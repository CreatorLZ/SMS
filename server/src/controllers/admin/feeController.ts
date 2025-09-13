import { Request, Response } from "express";
import mongoose from "mongoose";
import { FeeStructure } from "../../models/FeeStructure";
import { Student } from "../../models/Student";
import { Classroom } from "../../models/Classroom";
import { Term } from "../../models/Term";
import { AuditLog } from "../../models/AuditLog";
import { FeeSyncLog } from "../../models/FeeSyncLog";
import { syncStudentFeesForClassroomBatched } from "../../services/feeSync.service";

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
      createdBy: req.user?._id,
      updatedBy: req.user?._id as any,
    });

    // Get all active students in this classroom for sync
    const students = await Student.find({
      classroomId,
      status: "active",
    }).select("_id");

    const studentIds = students.map((s) => (s._id as any).toString());

    // Perform synchronous fee sync
    const syncResult = await syncStudentFeesForClassroomBatched(
      classroomId.toString(),
      req.user?._id?.toString()
    );

    // Create fee sync log
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

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_UPDATE",
      description: `Created fee structure for ${classroom.name} - ${
        term.name
      } ${term.year}: ₦${amount} and synced ${
        syncResult.created + syncResult.updated
      } student fees`,
      targetId: feeStructure._id,
    });

    res.status(201).json({
      feeStructure,
      message: "Fee structure created and fees synced successfully",
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
      .populate("termId", "name year")
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
      .populate("termId", "name year");

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
      .populate("termId", "name year");

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    if (!feeStructure.isActive) {
      return res
        .status(400)
        .json({ message: "Fee structure is already deleted" });
    }

    const termName = (feeStructure.termId as any)?.name;
    const termYear = (feeStructure.termId as any)?.year;
    const classroomId = (feeStructure.classroomId as any)?._id;

    // Count affected students
    const studentsAffected = await Student.countDocuments({
      classroomId: classroomId,
      "termFees.term": termName,
      "termFees.year": termYear,
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
                        { $eq: ["$$tf.year", termYear] },
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
        term: `${termName} ${termYear}`,
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
      .populate("termId", "name year");

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    if (!feeStructure.isActive) {
      return res
        .status(400)
        .json({ message: "Fee structure is already deleted" });
    }

    const termName = (feeStructure.termId as any)?.name;
    const termYear = (feeStructure.termId as any)?.year;
    const classroomId = (feeStructure.classroomId as any)?._id;

    // Generate CSV export of affected data
    const affectedStudents = await Student.find({
      classroomId: classroomId,
      "termFees.term": termName,
      "termFees.year": termYear,
    }).select("fullName studentId termFees");

    const csvData = affectedStudents.map((student) => {
      const termFee = student.termFees.find(
        (tf) => tf.term === termName && tf.year === termYear
      );
      return {
        studentId: student.studentId,
        fullName: student.fullName,
        term: termFee?.term,
        year: termFee?.year,
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
        "termFees.year": termYear,
      },
      {
        $pull: {
          termFees: { term: termName, year: termYear },
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

// @desc    Delete fee structure (legacy - now uses soft delete)
// @route   DELETE /api/admin/fees/structures/:id
// @access  Private/Admin
export const deleteFeeStructure = async (req: Request, res: Response) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id)
      .populate("classroomId", "name")
      .populate("termId", "name year");

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    if (!feeStructure.isActive) {
      return res
        .status(400)
        .json({ message: "Fee structure is already deleted" });
    }

    // Soft delete instead of hard delete
    feeStructure.isActive = false;
    feeStructure.deletedAt = new Date();
    feeStructure.deletedBy = req.user?._id as any;
    await feeStructure.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_STRUCTURE_UPDATE",
      description: `Soft deleted fee structure for ${
        (feeStructure.classroomId as any)?.name
      } - ${(feeStructure.termId as any)?.name} ${
        (feeStructure.termId as any)?.year
      }`,
      targetId: req.params.id,
    });

    res.json({
      message: "Fee structure soft deleted successfully",
      feeStructure: {
        _id: feeStructure._id,
        isActive: false,
        deletedAt: feeStructure.deletedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Mark student fee as paid
// @route   POST /api/admin/fees/students/:studentId/pay
// @access  Private/Admin
export const markFeePaid = async (req: Request, res: Response) => {
  try {
    const { term, year, paymentMethod, receiptNumber } = req.body;

    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the term fee record
    const termFeeIndex = student.termFees.findIndex(
      (fee) => fee.term === term && fee.year === year
    );

    if (termFeeIndex === -1) {
      return res.status(404).json({ message: "Term fee record not found" });
    }

    // Generate receipt number if not provided
    const finalReceiptNumber =
      receiptNumber || `RCP-${Date.now()}-${student.studentId}`;

    // Update the fee record
    student.termFees[termFeeIndex].paid = true;
    student.termFees[termFeeIndex].viewable = true;
    student.termFees[termFeeIndex].paymentDate = new Date();
    student.termFees[termFeeIndex].paymentMethod = paymentMethod || "cash";
    student.termFees[termFeeIndex].receiptNumber = finalReceiptNumber;

    if (req.user?._id) {
      student.termFees[termFeeIndex].updatedBy = req.user._id as any;
    }

    await student.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "FEE_PAYMENT",
      description: `Marked fee as paid for ${student.fullName} (${term} ${year}) - Receipt: ${finalReceiptNumber}`,
      targetId: student._id,
    });

    res.json({
      message: "Fee marked as paid successfully",
      termFee: student.termFees[termFeeIndex],
      receiptNumber: finalReceiptNumber,
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
      .populate("termId", "name year");

    // Create a map of existing fee structures for quick lookup
    const feeStructureMap = new Map();
    feeStructures.forEach((fs) => {
      const key = `${(fs.classroomId as any)._id}-${(fs.termId as any).name}-${
        (fs.termId as any).year
      }`;
      feeStructureMap.set(key, fs);
    });

    // Filter out fees that don't have corresponding fee structures
    const filteredTermFees = student.termFees.filter((fee) => {
      const feeKey = `${(student.classroomId as any)?._id}-${fee.term}-${
        fee.year
      }`;
      return feeStructureMap.has(feeKey);
    });

    // Return student with filtered fees
    const filteredStudent = {
      ...student.toObject(),
      termFees: filteredTermFees,
    };

    res.json(filteredStudent);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get students with unpaid fees (arrears)
// @route   GET /api/admin/fees/arrears
// @access  Private/Admin
export const getArrears = async (req: Request, res: Response) => {
  try {
    const { classroomId, term, year } = req.query;

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
      .populate("termId", "name year");

    // Create a map of existing fee structures for quick lookup
    const feeStructureMap = new Map();
    feeStructures.forEach((fs) => {
      const key = `${(fs.classroomId as any)._id}-${(fs.termId as any).name}-${
        (fs.termId as any).year
      }`;
      feeStructureMap.set(key, fs);
    });

    // Filter students with unpaid fees that have corresponding fee structures
    const arrearsData = students
      .map((student) => {
        let unpaidFees = student.termFees.filter((fee) => {
          // Only include fees that have a corresponding fee structure
          const feeKey = `${(student.classroomId as any)?._id}-${fee.term}-${
            fee.year
          }`;
          return !fee.paid && feeStructureMap.has(feeKey);
        });

        // Filter by specific term/year if provided
        if (term && year) {
          unpaidFees = unpaidFees.filter(
            (fee) => fee.term === term && fee.year === parseInt(year as string)
          );
        }

        // Only include students with unpaid fees
        if (unpaidFees.length > 0) {
          return {
            _id: student._id,
            fullName: student.fullName,
            studentId: student.studentId,
            currentClass: student.currentClass,
            classroom: (student.classroomId as any)?.name || "N/A",
            unpaidFees,
            totalUnpaid: unpaidFees.reduce(
              (sum, fee) => sum + (fee.amount || 0),
              0
            ),
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

// @desc    Get operation status
// @route   GET /api/admin/fees/operations/:operationId
// @access  Private/Admin
export const getOperationStatus = async (req: Request, res: Response) => {
  try {
    const operation = await FeeSyncLog.findOne({
      operationId: req.params.operationId,
    })
      .populate("classroomId", "name")
      .populate("termId", "name year")
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
      .populate("termId", "name year startDate endDate");

    // Create fee structure lookup map
    const feeStructureMap = new Map<string, any>();
    feeStructures.forEach((fs) => {
      const key = `${(fs.classroomId as any)._id}-${(fs.termId as any).name}-${
        (fs.termId as any).year
      }`;
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

        const feeKey = `${term.name}-${term.year}`;
        const hasFee = student.termFees.some(
          (fee) => fee.term === term.name && fee.year === term.year
        );

        if (!hasFee) {
          missingFees.push({
            term: term.name,
            year: term.year,
            expectedAmount: feeStructure.amount,
          });
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
        const feeKey = `${classroomId}-${fee.term}-${fee.year}`;
        if (!feeStructureMap.has(feeKey)) {
          // Check if student was enrolled during this term
          const term = feeStructures.find(
            (fs) =>
              (fs.termId as any).name === fee.term &&
              (fs.termId as any).year === fee.year
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
