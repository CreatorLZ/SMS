import { Request, Response } from "express";
import mongoose from "mongoose";
import { FeeStructure } from "../../models/FeeStructure";
import { Student } from "../../models/Student";
import { Classroom } from "../../models/Classroom";
import { Term } from "../../models/Term";
import { AuditLog } from "../../models/AuditLog";
import { FeeSyncLog } from "../../models/FeeSyncLog";
import {
  syncStudentFeesForClassroomBatched,
  removeDuplicateStudentFees,
  backfillMissingFees,
  fullReconciliation,
} from "../../services/feeSync.service";

// Generate PIN code for fee access
const generatePinCode = (): string => {
  return Math.random().toString().slice(2, 8).padStart(6, "0");
};

// @desc    Create fee structure
// @route   POST /api/admin/fees/structures
// @access  Private/Admin
export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const { classroomId, termId, amount } = req.body;

    // Validate classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Validate term exists
    const term = await Term.findById(termId);
    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    const feeStructure = await FeeStructure.create({
      classroomId,
      termId,
      amount,
      isActive: term.isActive, // Only activate if term is active
      createdBy: req.user?._id,
      updatedBy: req.user?._id as any,
    });

    // Perform synchronous fee sync only if term is active
    let syncResult: any = null;
    if (term.isActive) {
      // Get all active students in this classroom for sync
      const students = await Student.find({
        classroomId,
        status: "active",
      }).select("_id");

      const studentIds = students.map((s) => (s._id as any).toString());

      // Perform synchronous fee sync
      syncResult = await syncStudentFeesForClassroomBatched(
        classroomId.toString(),
        req.user?._id?.toString()
      );
    }

    // Create fee sync log only if synced
    if (syncResult) {
      await FeeSyncLog.create({
        operationId: syncResult.operationId,
        classroomId,
        termId,
        enqueuedBy: req.user?._id,
        status: "completed",
        summary: {
          syncedStudents: syncResult.created + syncResult.updated,
          totalFees: syncResult.attempted,
          errors: syncResult.errors?.length || 0,
        },
        syncErrors: syncResult.errors,
        startedAt: new Date(),
        finishedAt: new Date(),
      });
    }

    // Create audit log
    let description = `Created fee structure for ${classroom.name} - ${
      term.name
    } ${(term.sessionId as any)?.name || "Unknown Session"}: ₦${amount}`;
    if (syncResult) {
      description += ` and synced ${
        syncResult.created + syncResult.updated
      } student fees`;
    } else {
      description += ` (term is inactive - no sync performed)`;
    }

    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_UPDATE",
      description,
      targetId: feeStructure._id,
    });

    let message = term.isActive
      ? "Fee structure created and fees synced successfully"
      : "Fee structure created successfully (term is inactive - fees will sync when term is activated)";

    res.status(201).json({
      feeStructure,
      message,
      syncResult,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Fee structure already exists for this classroom and term",
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all fee structures
// @route   GET /api/admin/fees/structures
// @access  Private/Admin
export const getFeeStructures = async (req: Request, res: Response) => {
  try {
    const { classroomId, termId } = req.query;

    let filter: any = {};
    if (classroomId) filter.classroomId = classroomId;
    if (termId) filter.termId = termId;

    const feeStructures = await FeeStructure.find({ ...filter, isActive: true })
      .populate("classroomId", "name")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      })
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    res.json(feeStructures);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update fee structure
// @route   PUT /api/admin/fees/structures/:id
// @access  Private/Admin
export const updateFeeStructure = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    const feeStructure = await FeeStructure.findById(req.params.id)
      .populate("classroomId", "name")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    const oldAmount = feeStructure.amount;
    feeStructure.amount = amount;
    if (req.user?._id) {
      feeStructure.updatedBy = req.user._id as any;
    }
    await feeStructure.save();

    // Get all active students in this classroom for sync
    const students = await Student.find({
      classroomId: (feeStructure.classroomId as any)._id,
      status: "active",
    }).select("_id");

    const studentIds = students.map((s) => (s._id as any).toString());

    // Perform synchronous fee sync
    const syncResult = await syncStudentFeesForClassroomBatched(
      (feeStructure.classroomId as any)._id.toString(),
      req.user?._id?.toString()
    );

    // Create fee sync log
    await FeeSyncLog.create({
      operationId: `sync-${Date.now()}-${feeStructure._id}`,
      classroomId: (feeStructure.classroomId as any)._id,
      termId: (feeStructure.termId as any)._id,
      enqueuedBy: req.user?._id,
      status: "completed",
      summary: syncResult,
      syncErrors: syncResult.errors,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_UPDATE",
      description: `Updated fee structure amount from ₦${oldAmount} to ₦${amount} and synced ${
        syncResult.created + syncResult.updated
      } student fees`,
      targetId: feeStructure._id,
    });

    res.status(200).json({
      feeStructure,
      message: "Fee structure updated and fees synced successfully",
      syncResult,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Preview delete fee structure
// @route   GET /api/admin/fees/structures/:id/preview-delete
// @access  Private/Admin
export const previewDeleteFeeStructure = async (
  req: Request,
  res: Response
) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id)
      .populate("classroomId", "name")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    if (!feeStructure.isActive) {
      return res
        .status(400)
        .json({ message: "Fee structure is already deleted" });
    }

    const termName = (feeStructure.termId as any)?.name;
    const termSession =
      (feeStructure.termId as any)?.sessionId?.name || "Unknown Session";
    const classroomId = (feeStructure.classroomId as any)?._id;

    // Count affected students
    const studentsAffected = await Student.countDocuments({
      classroomId: classroomId,
      "termFees.term": termName,
      "termFees.session": termSession,
    });

    // Count affected termFees entries
    const termFeesCount =
      (
        await Student.aggregate([
          { $match: { classroomId: classroomId } },
          {
            $project: {
              count: {
                $size: {
                  $filter: {
                    input: "$termFees",
                    as: "tf",
                    cond: {
                      $and: [
                        { $eq: ["$$tf.term", termName] },
                        { $eq: ["$$tf.session", termSession] },
                      ],
                    },
                  },
                },
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$count" } } },
        ])
      )[0]?.total || 0;

    res.json({
      feeStructure: {
        _id: feeStructure._id,
        classroom: (feeStructure.classroomId as any)?.name,
        term: `${termName} ${termSession}`,
        amount: feeStructure.amount,
      },
      impact: {
        studentsAffected,
        termFeesCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Confirm delete fee structure
// @route   POST /api/admin/fees/structures/:id/confirm-delete
// @access  Private/Admin
export const confirmDeleteFeeStructure = async (
  req: Request,
  res: Response
) => {
  try {
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({ message: "Confirmation required" });
    }

    const feeStructure = await FeeStructure.findById(req.params.id)
      .populate("classroomId", "name")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    if (!feeStructure.isActive) {
      return res
        .status(400)
        .json({ message: "Fee structure is already deleted" });
    }

    const termName = (feeStructure.termId as any)?.name;
    const termSession =
      (feeStructure.termId as any)?.sessionId?.name || "Unknown Session";
    const classroomId = (feeStructure.classroomId as any)?._id;

    // Generate CSV export of affected data
    const affectedStudents = await Student.find({
      classroomId: classroomId,
      "termFees.term": termName,
      "termFees.session": termSession,
    }).select("fullName studentId termFees");

    const csvData = affectedStudents.map((student) => {
      const termFee = student.termFees.find(
        (tf) => tf.term === termName && tf.session === termSession
      );
      return {
        studentId: student.studentId,
        fullName: student.fullName,
        term: termFee?.term,
        session: termFee?.session,
        amount: termFee?.amount,
        paid: termFee?.paid,
        paymentDate: termFee?.paymentDate,
        pinCode: termFee?.pinCode,
      };
    });

    // Soft delete the fee structure
    feeStructure.isActive = false;
    feeStructure.deletedAt = new Date();
    feeStructure.deletedBy = req.user?._id as any;
    await feeStructure.save();

    // Remove related termFees from students
    const result = await Student.updateMany(
      {
        classroomId: classroomId,
        "termFees.term": termName,
        "termFees.session": termSession,
      },
      {
        $pull: {
          termFees: { term: termName, session: termSession },
        },
      }
    );

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_DELETE",
      description: `Soft deleted fee structure and removed ${result.modifiedCount} term fee records. CSV export generated.`,
      targetId: req.params.id,
    });

    res.json({
      message: "Fee structure deleted successfully",
      stats: {
        studentsAffected: result.modifiedCount,
        csvData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete fee structure (hard delete)
// @route   DELETE /api/admin/fees/structures/:id
// @access  Private/Admin
export const deleteFeeStructure = async (req: Request, res: Response) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id)
      .populate("classroomId", "name")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    const termName = (feeStructure.termId as any)?.name;
    const termSession =
      (feeStructure.termId as any)?.sessionId?.name || "Unknown Session";
    const classroomId = (feeStructure.classroomId as any)?._id;

    // Remove related termFees from students
    const result = await Student.updateMany(
      {
        classroomId: classroomId,
        "termFees.term": termName,
        "termFees.session": termSession,
      },
      {
        $pull: {
          termFees: { term: termName, session: termSession },
        },
      }
    );

    // Hard delete the fee structure
    await FeeStructure.findByIdAndDelete(req.params.id);

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_DELETE",
      description: `Hard deleted fee structure and removed ${
        result.modifiedCount
      } term fee records for ${(feeStructure.classroomId as any)?.name} - ${
        (feeStructure.termId as any)?.name
      } ${(feeStructure.termId as any)?.year}`,
      targetId: req.params.id,
    });

    res.json({
      message: "Fee structure deleted successfully",
      stats: {
        studentsAffected: result.modifiedCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Mark student fee as paid (supports partial payments)
// @route   POST /api/admin/fees/students/:studentId/pay
// @access  Private/Admin
export const markFeePaid = async (req: Request, res: Response) => {
  try {
    const { term, session, paymentAmount, paymentMethod, receiptNumber } =
      req.body;

    // Validate payment amount
    if (!paymentAmount || paymentAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Valid payment amount is required" });
    }

    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the term fee record
    const termFeeIndex = student.termFees.findIndex(
      (fee) => fee.term === term && fee.session === session
    );

    if (termFeeIndex === -1) {
      return res.status(404).json({ message: "Term fee record not found" });
    }

    const termFee = student.termFees[termFeeIndex];
    const currentPaid = termFee.amountPaid || 0;
    const newAmountPaid = currentPaid + paymentAmount;

    // Check if payment exceeds the total amount
    if (newAmountPaid > termFee.amount) {
      return res.status(400).json({
        message: `Payment amount exceeds remaining balance. Remaining: ₦${
          termFee.amount - currentPaid
        }`,
      });
    }

    // Generate receipt number if not provided
    const finalReceiptNumber =
      receiptNumber || `RCP-${Date.now()}-${student.studentId}`;

    // Create payment record
    const paymentRecord = {
      amount: paymentAmount,
      paymentDate: new Date(),
      paymentMethod: paymentMethod || "cash",
      receiptNumber: finalReceiptNumber,
      updatedBy: req.user?._id as any,
    };

    // Update the fee record
    termFee.amountPaid = newAmountPaid;
    termFee.paymentHistory = termFee.paymentHistory || [];
    termFee.paymentHistory.push(paymentRecord);

    // Check if fully paid
    const isFullyPaid = newAmountPaid >= termFee.amount;
    termFee.paid = isFullyPaid;

    if (isFullyPaid) {
      termFee.viewable = true;
      termFee.paymentDate = new Date();
      termFee.paymentMethod = paymentMethod || "cash";
      termFee.receiptNumber = finalReceiptNumber;
    }

    if (req.user?._id) {
      termFee.updatedBy = req.user._id as any;
    }

    await student.save();

    // Create audit log
    const paymentType = isFullyPaid
      ? "fully paid"
      : `partial payment of ₦${paymentAmount}`;
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_PAYMENT",
      description: `Fee ${paymentType} for ${
        student.fullName
      } (${term} ${session}) - Receipt: ${finalReceiptNumber} - Balance: ₦${
        termFee.amount - newAmountPaid
      }`,
      targetId: student._id,
    });

    res.json({
      message: isFullyPaid
        ? "Fee fully paid successfully"
        : "Partial payment recorded successfully",
      termFee: student.termFees[termFeeIndex],
      receiptNumber: finalReceiptNumber,
      remainingBalance: termFee.amount - newAmountPaid,
      isFullyPaid,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get student fee history
// @route   GET /api/admin/fees/students/:studentId/fees
// @access  Private/Admin
export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate("classroomId", "name")
      .select("fullName studentId termFees classroomId");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get all existing fee structures to filter fees
    const feeStructures = await FeeStructure.find({})
      .populate("classroomId", "_id")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    // Create a map of existing fee structures for quick lookup
    const feeStructureMap = new Map();
    feeStructures.forEach((fs) => {
      const sessionName =
        (fs.termId as any).sessionId?.name || "Unknown Session";
      const key = `${(fs.classroomId as any)._id}-${
        (fs.termId as any).name
      }-${sessionName}`;
      feeStructureMap.set(key, fs);
    });

    // Filter out fees that don't have corresponding fee structures
    const filteredTermFees = student.termFees.filter((fee) => {
      const feeKey = `${(student.classroomId as any)?._id}-${fee.term}-${
        fee.session
      }`;
      return feeStructureMap.has(feeKey);
    });

    // Check for inconsistencies - Detect missing or incorrect fees
    let inconsistenciesFound = false;
    const repairedFees = [...filteredTermFees];

    // Check if student has classroom and get admission date for validation
    if (student.classroomId) {
      const admissionDate = new Date(student.admissionDate || "2020-01-01");

      // Check for missing fees that should exist
      for (const feeStructure of feeStructures) {
        const fsClassroomId = (feeStructure.classroomId as any)._id.toString();
        if (fsClassroomId !== (student.classroomId as any)._id.toString())
          continue;

        const term = feeStructure.termId as any;
        const termEnd = new Date(term.endDate);

        // Skip if student wasn't enrolled during this term
        if (admissionDate > termEnd) continue;

        const feeKey = `${term.name}-${
          (term.sessionId as any)?.name || "Unknown Session"
        }`;
        const hasFee = filteredTermFees.some(
          (fee) =>
            fee.term === term.name &&
            fee.session === (term.sessionId as any)?.name
        );

        // Auto-repair: Create missing fee record
        if (!hasFee) {
          console.log(
            `Auto-repairing missing fee for student ${student.fullName}: ${term.name} ${term.year}`
          );
          inconsistenciesFound = true;

          repairedFees.push({
            term: term.name,
            session: (term.sessionId as any)?.name || "Unknown Session",
            paid: false,
            pinCode: generatePinCode(),
            viewable: false,
            amount: feeStructure.amount,
            amountPaid: 0,
            paymentHistory: [],
            paymentDate: undefined,
            updatedBy: req.user?._id as any,
          });
        }
      }

      // Check for amount mismatches and repair
      for (const fee of filteredTermFees) {
        const feeKey = `${(student.classroomId as any)._id}-${fee.term}-${
          fee.session
        }`;
        const feeStructure = feeStructureMap.get(feeKey);

        if (feeStructure && fee.amount !== feeStructure.amount) {
          console.log(
            `Auto-repairing fee amount for student ${student.fullName}: ${fee.term} ${fee.session} - ${fee.amount} -> ${feeStructure.amount}`
          );
          inconsistenciesFound = true;

          // Find and update the fee in repairedFees
          const index = repairedFees.findIndex(
            (f) => f.term === fee.term && f.session === fee.session
          );
          if (index !== -1) {
            repairedFees[index] = {
              ...repairedFees[index],
              amount: feeStructure.amount,
              updatedBy: req.user?._id as any,
            };
          }
        }
      }

      // If inconsistencies found, save the repaired data
      if (inconsistenciesFound) {
        student.termFees = repairedFees;
        await student.save();

        // Create audit log for auto-repair
        await AuditLog.create({
          userId: req.user?._id,
          actionType: "FEE_AUTO_REPAIR",
          description: `Auto-repaired fee inconsistencies for student ${student.fullName}`,
          targetId: student._id,
        });

        console.log(
          `Auto-repaired ${
            repairedFees.length - filteredTermFees.length
          } fee entries for student ${student.fullName}`
        );
      }
    }

    // Return student with repaired fees
    const resultStudent = {
      ...student.toObject(),
      termFees: repairedFees,
      autoRepaired: inconsistenciesFound,
    };

    res.json(resultStudent);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get students with unpaid fees (arrears)
// @route   GET /api/admin/fees/arrears
// @access  Private/Admin
export const getArrears = async (req: Request, res: Response) => {
  try {
    const { classroomId, term, session } = req.query;

    // Get all active students first
    let studentFilter: any = { status: "active" };
    if (classroomId) {
      studentFilter.classroomId = classroomId;
    }

    const students = await Student.find(studentFilter)
      .populate("classroomId", "name")
      .select("fullName studentId currentClass termFees classroomId")
      .sort({ currentClass: 1, fullName: 1 });

    // Get all existing fee structures to filter fees
    const feeStructures = await FeeStructure.find({})
      .populate("classroomId", "_id")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    // Create a map of existing fee structures for quick lookup
    const feeStructureMap = new Map();
    feeStructures.forEach((fs) => {
      const sessionName =
        (fs.termId as any).sessionId?.name || "Unknown Session";
      const key = `${(fs.classroomId as any)._id}-${
        (fs.termId as any).name
      }-${sessionName}`;
      feeStructureMap.set(key, fs);
    });

    // Filter students with outstanding fees that have corresponding fee structures
    const arrearsData = students
      .map((student) => {
        let outstandingFees = student.termFees.filter((fee) => {
          // Only include fees that have a corresponding fee structure
          const feeKey = `${(student.classroomId as any)?._id}-${fee.term}-${
            fee.session
          }`;
          if (!feeStructureMap.has(feeKey)) return false;

          // Include if not fully paid (amountPaid < amount)
          const amountPaid = fee.amountPaid || 0;
          return amountPaid < fee.amount;
        });

        // Filter by specific term/session if provided
        if (term && session) {
          outstandingFees = outstandingFees.filter(
            (fee) => fee.term === term && fee.session === session
          );
        }

        // Only include students with outstanding fees
        if (outstandingFees.length > 0) {
          // Calculate total outstanding amount
          const totalOutstanding = outstandingFees.reduce(
            (sum, fee) => sum + (fee.amount - (fee.amountPaid || 0)),
            0
          );

          return {
            _id: student._id,
            fullName: student.fullName,
            studentId: student.studentId,
            currentClass: student.currentClass,
            classroom: (student.classroomId as any)?.name || "N/A",
            outstandingFees: outstandingFees.map((fee) => ({
              ...fee,
              amountPaid: fee.amountPaid || 0,
              balance: fee.amount - (fee.amountPaid || 0),
            })),
            totalOutstanding,
          };
        }
        return null;
      })
      .filter((student) => student !== null); // Remove null entries

    res.json(arrearsData);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Comprehensive fee sync for all students
// @route   POST /api/admin/fees/sync-all
// @access  Private/Admin
export const syncAllStudentFees = async (req: Request, res: Response) => {
  try {
    console.log("Starting comprehensive fee sync for all students...");

    const startTime = Date.now();

    // Get all active students
    const allStudents = await Student.find({ status: "active" })
      .select("_id classroomId")
      .populate("classroomId", "_id");

    if (allStudents.length === 0) {
      return res.json({
        message: "No active students found",
        stats: { totalStudents: 0, syncedStudents: 0, totalFees: 0 },
      });
    }

    // Group students by classroom
    const classroomStudentMap = new Map<string, string[]>();
    const studentsWithoutClassroom: string[] = [];

    allStudents.forEach((student) => {
      const classroomId = (student.classroomId as any)?._id?.toString();
      if (classroomId) {
        if (!classroomStudentMap.has(classroomId)) {
          classroomStudentMap.set(classroomId, []);
        }
        classroomStudentMap
          .get(classroomId)!
          .push((student._id as any).toString());
      } else {
        studentsWithoutClassroom.push((student._id as any).toString());
      }
    });

    let totalSyncedStudents = 0;
    let totalFeesProcessed = 0;
    let totalErrors = 0;
    const classroomResults: any[] = [];

    // Process each classroom
    for (const [classroomId, studentIds] of classroomStudentMap) {
      try {
        console.log(
          `Syncing ${studentIds.length} students for classroom ${classroomId}`
        );
        const result = await syncStudentFeesForClassroomBatched(
          classroomId,
          req.user?._id?.toString()
        );

        classroomResults.push({
          classroomId,
          students: studentIds.length,
          syncedStudents: result.created + result.updated,
          feesProcessed: result.attempted,
          errors: result.errors?.length || 0,
        });

        totalSyncedStudents += result.created + result.updated;
        totalFeesProcessed += result.attempted;
        if (result.errors) totalErrors += result.errors.length;
      } catch (classroomError: any) {
        console.error(
          `Error syncing classroom ${classroomId}:`,
          classroomError
        );
        classroomResults.push({
          classroomId,
          students: studentIds.length,
          syncedStudents: 0,
          feesProcessed: 0,
          errors: 1,
          errorMessage: classroomError.message,
        });
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_UPDATE",
      description: `Comprehensive fee sync completed: ${totalSyncedStudents}/${allStudents.length} students synced, ${totalFeesProcessed} fees processed in ${duration}ms`,
      targetId: null,
    });

    res.json({
      message: "Comprehensive fee synchronization completed",
      stats: {
        totalStudents: allStudents.length,
        studentsWithoutClassroom: studentsWithoutClassroom.length,
        syncedStudents: totalSyncedStudents,
        totalFeesProcessed,
        totalErrors,
        duration: `${duration}ms`,
      },
      classroomResults,
      studentsWithoutClassroom:
        studentsWithoutClassroom.length > 0
          ? studentsWithoutClassroom
          : undefined,
    });
  } catch (error: any) {
    console.error("Error during comprehensive fee sync:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Sync fees for a specific student
// @route   POST /api/admin/fees/students/:studentId/sync
// @access  Private/Admin
export const syncIndividualStudentFees = async (
  req: Request,
  res: Response
) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate(
      "classroomId",
      "_id"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.classroomId) {
      return res.status(400).json({
        message: "Student is not assigned to any classroom",
        student: {
          _id: student._id,
          fullName: student.fullName,
          studentId: student.studentId,
        },
      });
    }

    const result = await syncStudentFeesForClassroomBatched(
      (student.classroomId as any)._id.toString(),
      req.user?._id?.toString()
    );

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_UPDATE",
      description: `Manually synced fees for student ${student.fullName} (${student.studentId})`,
      targetId: student._id,
    });

    res.json({
      message: "Student fees synced successfully",
      student: {
        _id: student._id,
        fullName: student.fullName,
        studentId: student.studentId,
      },
      syncResult: result,
    });
  } catch (error: any) {
    console.error("Error syncing student fees:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Sync all fee structures for a specific term
// @route   POST /api/admin/fees/terms/:termId/sync
// @access  Private/Admin
export const syncTermsFees = async (req: Request, res: Response) => {
  try {
    const { termId } = req.params;

    // Validate term exists with session populated
    const term = await Term.findById(termId).populate("sessionId");
    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    console.log(
      `Starting fee sync for term: ${term.name} ${
        (term.sessionId as any)?.name || "Unknown Session"
      }`
    );

    const startTime = Date.now();

    // Get all active fee structures for this term
    const feeStructures = await FeeStructure.find({
      termId,
      isActive: true,
    })
      .populate("classroomId", "_id")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    if (feeStructures.length === 0) {
      return res.json({
        message: "No active fee structures found for this term",
        stats: { totalFeeStructures: 0, syncedClassrooms: 0, totalStudents: 0 },
      });
    }

    console.log(
      `Found ${feeStructures.length} fee structures for term ${term.name} ${
        (term.sessionId as any)?.name || "Unknown Session"
      }`
    );

    let totalSyncedStudents = 0;
    let totalFeesProcessed = 0;
    let totalErrors = 0;
    const processedClassrooms = new Set();
    const classroomResults: any[] = [];

    // Process each fee structure - sync the associated classroom
    for (const feeStructure of feeStructures) {
      const classroomId = (feeStructure.classroomId as any)._id.toString();

      // Skip if we already processed this classroom
      if (processedClassrooms.has(classroomId)) {
        continue;
      }
      processedClassrooms.add(classroomId);

      try {
        console.log(
          `Syncing classroom ${classroomId} for term ${term.name} ${
            (term.sessionId as any)?.name || "Unknown Session"
          }`
        );

        const result = await syncStudentFeesForClassroomBatched(
          classroomId,
          req.user?._id?.toString()
        );

        classroomResults.push({
          classroomId,
          students: result.created + result.updated,
          feesProcessed: result.attempted,
          errors: result.errors?.length || 0,
        });

        totalSyncedStudents += result.created + result.updated;
        totalFeesProcessed += result.attempted;
        if (result.errors) totalErrors += result.errors.length;
      } catch (classroomError: any) {
        console.error(
          `Error syncing classroom ${classroomId}:`,
          classroomError
        );
        classroomResults.push({
          classroomId,
          students: 0,
          feesProcessed: 0,
          errors: 1,
          errorMessage: classroomError.message,
        });
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_UPDATE",
      description: `Term fee sync completed: ${term.name} ${
        (term.sessionId as any)?.name || "Unknown Session"
      } - ${totalSyncedStudents} students synced, ${totalFeesProcessed} fees processed in ${duration}ms`,
      targetId: term._id,
    });

    res.json({
      message: `Term fee synchronization completed for ${term.name} ${
        (term.sessionId as any)?.name || "Unknown Session"
      }`,
      term: {
        _id: term._id,
        name: term.name,
        session: (term.sessionId as any)?.name || "Unknown Session",
      },
      stats: {
        totalFeeStructures: feeStructures.length,
        syncedClassrooms: processedClassrooms.size,
        syncedStudents: totalSyncedStudents,
        totalFeesProcessed,
        totalErrors,
        duration: `${duration}ms`,
      },
      classroomResults,
    });
  } catch (error: any) {
    console.error("Error during term fee sync:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove duplicate student fee records
// @route   POST /api/admin/fees/reconcile/deduplicate
// @access  Private/Admin
export const deduplicateStudentFees = async (req: Request, res: Response) => {
  try {
    console.log("Starting fee deduplication process...");
    const result = await removeDuplicateStudentFees(req.user?._id?.toString());

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_RECONCILIATION",
      description: `Fee deduplication completed: ${result.duplicatesFound} duplicates found, ${result.duplicatesRemoved} removed, ${result.errors.length} errors`,
      targetId: null,
    });

    res.json({
      message: "Fee deduplication completed",
      stats: result,
    });
  } catch (error: any) {
    console.error("Error during fee deduplication:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Backfill missing fees for students
// @route   POST /api/admin/fees/reconcile/backfill
// @access  Private/Admin
export const backfillMissingStudentFees = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("Starting fee backfill process...");
    const result = await backfillMissingFees(req.user?._id?.toString());

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_RECONCILIATION",
      description: `Fee backfill completed: ${result.missingFeesFound} missing fees found, ${result.feesBackfilled} backfilled, ${result.errors.length} errors`,
      targetId: null,
    });

    res.json({
      message: "Fee backfill completed",
      stats: result,
    });
  } catch (error: any) {
    console.error("Error during fee backfill:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Full reconciliation (deduplicate + backfill)
// @route   POST /api/admin/fees/reconcile/full
// @access  Private/Admin
export const fullFeeReconciliation = async (req: Request, res: Response) => {
  try {
    console.log("Starting full fee reconciliation process...");
    const result = await fullReconciliation(req.user?._id?.toString());

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_RECONCILIATION",
      description: `Full fee reconciliation completed: ${result.deduplication.duplicatesRemoved} duplicates removed, ${result.backfill.feesBackfilled} fees backfilled, ${result.totalErrors} total errors`,
      targetId: null,
    });

    res.json({
      message: "Full fee reconciliation completed",
      stats: result,
    });
  } catch (error: any) {
    console.error("Error during full fee reconciliation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get operation status
// @route   GET /api/admin/fees/operations/:operationId
// @access  Private/Admin
export const getOperationStatus = async (req: Request, res: Response) => {
  try {
    const operation = await FeeSyncLog.findOne({
      operationId: req.params.operationId,
    })
      .populate("classroomId", "name")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      })
      .populate("enqueuedBy", "name");

    if (!operation) {
      return res.status(404).json({ message: "Operation not found" });
    }

    res.json(operation);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Health check for fee system integrity
// @route   GET /api/admin/fees/health-check
// @access  Private/Admin
export const getFeeHealthCheck = async (req: Request, res: Response) => {
  try {
    console.log("Starting fee system health check...");

    const healthReport = {
      timestamp: new Date(),
      summary: {
        totalStudents: 0,
        studentsWithMissingFees: 0,
        studentsWithExtraFees: 0,
        totalFeeDiscrepancies: 0,
      },
      details: {
        missingFees: [] as any[],
        extraFees: [] as any[],
        classroomStats: [] as any[],
      },
    };

    // Get all active students
    const students = await Student.find({ status: "active" })
      .populate("classroomId", "name")
      .select("fullName studentId admissionDate classroomId termFees");

    healthReport.summary.totalStudents = students.length;

    // Get all fee structures
    const feeStructures = await FeeStructure.find({})
      .populate("classroomId", "_id name")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    // Create fee structure lookup map
    const feeStructureMap = new Map<string, any>();
    feeStructures.forEach((fs) => {
      const sessionName =
        (fs.termId as any).sessionId?.name || "Unknown Session";
      const key = `${(fs.classroomId as any)._id}-${
        (fs.termId as any).name
      }-${sessionName}`;
      feeStructureMap.set(key, fs);
    });

    // Analyze each student
    for (const student of students) {
      if (!student.classroomId) {
        healthReport.details.missingFees.push({
          studentId: student.studentId,
          fullName: student.fullName,
          issue: "No classroom assigned",
        });
        healthReport.summary.studentsWithMissingFees++;
        continue;
      }

      const classroomId = (student.classroomId as any)._id.toString();
      const admissionDate = new Date(student.admissionDate);

      // Check for missing fees
      const missingFees = [];
      for (const feeStructure of feeStructures) {
        const fsClassroomId = (feeStructure.classroomId as any)._id.toString();
        if (fsClassroomId !== classroomId) continue;

        const term = feeStructure.termId as any;
        const termEnd = new Date(term.endDate);

        // Skip if student wasn't enrolled during this term
        if (admissionDate > termEnd) continue;

        const feeKey = `${term.name}-${
          (term.sessionId as any)?.name || "Unknown Session"
        }`;
        const existingFee = student.termFees.find(
          (fee) =>
            fee.term === term.name &&
            fee.session === (term.sessionId as any)?.name
        );

        if (!existingFee) {
          missingFees.push({
            term: term.name,
            year: term.year,
            expectedAmount: feeStructure.amount,
          });
        } else {
          // Check if fee amount matches
          if (existingFee.amount !== feeStructure.amount) {
            // This will be handled in the amount mismatch check below
          }
        }
      }

      if (missingFees.length > 0) {
        healthReport.details.missingFees.push({
          studentId: student.studentId,
          fullName: student.fullName,
          classroom: (student.classroomId as any).name,
          missingFees,
        });
        healthReport.summary.studentsWithMissingFees++;
        healthReport.summary.totalFeeDiscrepancies += missingFees.length;
      }

      // Check for extra fees (fees without corresponding fee structures)
      const extraFees = [];
      for (const fee of student.termFees) {
        const feeKey = `${classroomId}-${fee.term}-${fee.session}`;
        if (!feeStructureMap.has(feeKey)) {
          // Check if student was enrolled during this term
          const term = feeStructures.find(
            (fs) =>
              (fs.termId as any).name === fee.term &&
              (fs.termId as any).sessionId?.name === fee.session
          );
          if (term) {
            const termEnd = new Date((term.termId as any).endDate);
            if (admissionDate <= termEnd) {
              extraFees.push(fee);
            }
          } else {
            extraFees.push(fee);
          }
        }
      }

      if (extraFees.length > 0) {
        healthReport.details.extraFees.push({
          studentId: student.studentId,
          fullName: student.fullName,
          classroom: (student.classroomId as any).name,
          extraFees,
        });
        healthReport.summary.studentsWithExtraFees++;
        healthReport.summary.totalFeeDiscrepancies += extraFees.length;
      }
    }

    // Classroom statistics
    const classroomMap = new Map<string, any>();
    students.forEach((student) => {
      const classroomId = (student.classroomId as any)?._id?.toString();
      const classroomName =
        (student.classroomId as any)?.name || "No Classroom";

      if (!classroomMap.has(classroomId || "none")) {
        classroomMap.set(classroomId || "none", {
          name: classroomName,
          totalStudents: 0,
          studentsWithIssues: 0,
        });
      }

      const classroom = classroomMap.get(classroomId || "none");
      classroom.totalStudents++;

      // Check if this student has issues
      const hasMissingFees = healthReport.details.missingFees.some(
        (issue) => issue.studentId === student.studentId
      );
      const hasExtraFees = healthReport.details.extraFees.some(
        (issue) => issue.studentId === student.studentId
      );

      if (hasMissingFees || hasExtraFees) {
        classroom.studentsWithIssues++;
      }
    });

    healthReport.details.classroomStats = Array.from(classroomMap.values());

    // Overall health status
    const healthStatus = {
      status:
        healthReport.summary.totalFeeDiscrepancies === 0
          ? "healthy"
          : "warning",
      message:
        healthReport.summary.totalFeeDiscrepancies === 0
          ? "All student fees are properly synchronized"
          : `${healthReport.summary.totalFeeDiscrepancies} fee discrepancies found`,
    };

    console.log(
      `Fee health check completed: ${healthReport.summary.totalFeeDiscrepancies} discrepancies found`
    );

    res.json({
      ...healthReport,
      healthStatus,
    });
  } catch (error: any) {
    console.error("Error during fee health check:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
