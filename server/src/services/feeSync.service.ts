// src/services/feeSync.service.ts
import mongoose from "mongoose";
import { Student } from "../models/Student";
import { FeeStructure } from "../models/FeeStructure";
import { Classroom } from "../models/Classroom";
import { FeeSyncLog } from "../models/FeeSyncLog";
import crypto from "crypto";

const BATCH_SIZE = 500;

function generatePinCode() {
  // 6 digit numeric but cryptographically random
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

function generateOperationId() {
  return crypto.randomUUID();
}

export async function syncStudentFeesForClassroomBatched(
  classroomId: string,
  userId?: string
): Promise<{
  operationId: string;
  created: number;
  updated: number;
  attempted: number;
  errors: any[];
}> {
  const operationId = generateOperationId();
  const errors: any[] = [];
  let created = 0;
  let updated = 0;
  let attempted = 0;

  // Load active fee structures for classroom
  const feeStructures = await FeeStructure.find({
    classroomId,
    isActive: true,
  }).populate({
    path: "termId",
    populate: {
      path: "sessionId",
      select: "name",
    },
  });
  if (!feeStructures || feeStructures.length === 0) {
    return { operationId, created, updated, attempted, errors };
  }

  // Get all active students in classroom
  const students = await Student.find({
    classroomId,
    status: "active",
  }).select("_id termFees");
  const bulkOps: any[] = [];

  const now = new Date();

  for (const student of students) {
    for (const fs of feeStructures) {
      const term = fs.termId as any;
      if (!term) continue;

      const termName = term.name;
      const sessionName = (term.sessionId as any)?.name || "Unknown Session";
      const amount = fs.amount ?? 0;

      // Check if student already has this fee
      const hasTerm = student.termFees?.some(
        (t: any) => t.term === termName && t.session === sessionName
      );

      if (!hasTerm) {
        // Add new fee entry
        bulkOps.push({
          updateOne: {
            filter: {
              _id: student._id,
              "termFees.term": { $ne: termName },
              "termFees.session": { $ne: sessionName },
            },
            update: {
              $push: {
                termFees: {
                  term: termName,
                  session: sessionName,
                  paid: false,
                  pinCode: generatePinCode(),
                  viewable: false,
                  amount,
                  paymentDate: null,
                  updatedBy: userId
                    ? new mongoose.Types.ObjectId(userId)
                    : undefined,
                  createdAt: now,
                },
              },
            },
          },
        });
        created++;
      } else {
        // Update existing fee amount if changed
        const existingFee = student.termFees.find(
          (t: any) => t.term === termName && t.session === sessionName
        );

        if (existingFee && existingFee.amount !== amount) {
          bulkOps.push({
            updateOne: {
              filter: {
                _id: student._id,
                "termFees.term": termName,
                "termFees.session": sessionName,
              },
              update: {
                $set: {
                  "termFees.$.amount": amount,
                  "termFees.$.updatedBy": userId
                    ? new mongoose.Types.ObjectId(userId)
                    : undefined,
                },
              },
            },
          });
          updated++;
        }

        // Ensure PIN code exists
        if (existingFee && !existingFee.pinCode) {
          bulkOps.push({
            updateOne: {
              filter: {
                _id: student._id,
                "termFees.term": termName,
                "termFees.session": sessionName,
              },
              update: {
                $set: {
                  "termFees.$.pinCode": generatePinCode(),
                  "termFees.$.updatedBy": userId
                    ? new mongoose.Types.ObjectId(userId)
                    : undefined,
                },
              },
            },
          });
          updated++;
        }
      }
    }
  }

  // Execute in batches
  for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
    const batch = bulkOps.slice(i, i + BATCH_SIZE);
    attempted += batch.length;
    try {
      const res = await Student.bulkWrite(batch, { ordered: false });
      const result = res as any;
      updated += result.nModified || 0;
      created += result.nUpserted || 0;
    } catch (err: any) {
      errors.push({ batchStart: i, error: err.message || err });
    }
  }

  return { operationId, created, updated, attempted, errors };
}

export async function backfillStudentClassroomIds(userId?: string): Promise<{
  processed: number;
  updated: number;
  errors: any[];
}> {
  const errors: any[] = [];
  let processed = 0;
  let updated = 0;

  try {
    // Get all classrooms for mapping
    const classrooms = await Classroom.find({}).select("_id name");
    const classroomMap = new Map(classrooms.map((c: any) => [c.name, c._id]));

    // Find students who have currentClass but no classroomId
    const studentsToUpdate = await Student.find({
      currentClass: { $exists: true, $ne: "" },
      $or: [{ classroomId: { $exists: false } }, { classroomId: null }],
    }).select("_id currentClass classroomId");

    processed = studentsToUpdate.length;

    if (processed === 0) {
      return { processed, updated, errors };
    }

    console.log(`Found ${processed} students to backfill classroomId`);

    // Process in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < studentsToUpdate.length; i += BATCH_SIZE) {
      const batch = studentsToUpdate.slice(i, i + BATCH_SIZE);
      const bulkOps: any[] = [];

      for (const student of batch) {
        const classroomId = classroomMap.get(student.currentClass);
        if (classroomId) {
          bulkOps.push({
            updateOne: {
              filter: { _id: student._id },
              update: { classroomId },
            },
          });
        } else {
          errors.push({
            studentId: student._id,
            currentClass: student.currentClass,
            error: `No classroom found for class name: ${student.currentClass}`,
          });
        }
      }

      if (bulkOps.length > 0) {
        try {
          const result = await Student.bulkWrite(bulkOps, { ordered: false });
          updated += result.modifiedCount || 0;

          console.log(
            `Updated ${result.modifiedCount} students in batch ${
              Math.floor(i / BATCH_SIZE) + 1
            }`
          );
        } catch (err: any) {
          console.error(
            `Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
            err
          );
          errors.push({ batchStart: i, error: err.message || err });
        }
      }
    }

    console.log(
      `Backfill complete: ${processed} processed, ${updated} updated, ${errors.length} errors`
    );
  } catch (error: any) {
    console.error("Error in backfillStudentClassroomIds:", error);
    errors.push({ error: error.message || error });
  }

  return { processed, updated, errors };
}

// Remove duplicate student fee records
export async function removeDuplicateStudentFees(userId?: string): Promise<{
  processed: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: any[];
}> {
  const errors: any[] = [];
  let processed = 0;
  let duplicatesFound = 0;
  let duplicatesRemoved = 0;

  try {
    console.log("Starting duplicate fee removal process...");

    // Get all students with termFees
    const students = await Student.find({
      termFees: { $exists: true, $ne: [] },
    }).select("_id fullName studentId termFees");

    processed = students.length;

    for (const student of students) {
      if (!student.termFees || student.termFees.length === 0) continue;

      // Find duplicate term/session combinations
      const seenTerms = new Map<string, any[]>();
      const toRemove: string[] = [];

      student.termFees.forEach((fee: any, index: number) => {
        const key = `${fee.term}-${fee.session}`;
        if (!seenTerms.has(key)) {
          seenTerms.set(key, []);
        }
        seenTerms.get(key)!.push({ ...fee, originalIndex: index });
      });

      // Identify duplicates for each term/year (keep the most recently updated)
      seenTerms.forEach((fees, key) => {
        if (fees.length > 1) {
          duplicatesFound += fees.length - 1;

          // Sort by updatedAt (null first, then by date)
          fees.sort((a: any, b: any) => {
            const aTime = a.updatedAt || a.createdAt || new Date(0);
            const bTime = b.updatedAt || b.createdAt || new Date(0);
            return bTime.getTime() - aTime.getTime(); // Descending order (latest first)
          });

          // Mark all but the first (latest) for removal
          for (let i = 1; i < fees.length; i++) {
            toRemove.push(fees[i].originalIndex.toString());
          }
        }
      });

      // Remove duplicates if any found
      if (toRemove.length > 0) {
        try {
          // Simpler approach: remove all duplicate entries by term/session
          const removeConditions = toRemove.map((index) => {
            const fee = student.termFees[parseInt(index)];
            return { term: fee.term, session: fee.session };
          });

          await Student.updateOne(
            { _id: student._id },
            {
              $pull: {
                termFees: { $or: removeConditions },
              },
            }
          );
          duplicatesRemoved += toRemove.length;
          console.log(
            `Removed ${toRemove.length} duplicates for student ${student.fullName}`
          );
        } catch (err: any) {
          console.error(
            `Error removing duplicates for student ${student._id}:`,
            err
          );
          errors.push({
            studentId: student._id,
            error: err.message || err,
          });
        }
      }
    }

    console.log(
      `Duplicate removal complete: ${duplicatesFound} duplicates found, ${duplicatesRemoved} removed`
    );
  } catch (error: any) {
    console.error("Error in removeDuplicateStudentFees:", error);
    errors.push({ error: error.message || error });
  }

  return { processed, duplicatesFound, duplicatesRemoved, errors };
}

// Backfill missing fees for students
export async function backfillMissingFees(userId?: string): Promise<{
  processed: number;
  missingFeesFound: number;
  feesBackfilled: number;
  errors: any[];
}> {
  const errors: any[] = [];
  let processed = 0;
  let missingFeesFound = 0;
  let feesBackfilled = 0;

  try {
    console.log("Starting missing fees backfill process...");

    // Get all active students
    const students = await Student.find({ status: "active" })
      .populate("classroomId", "_id")
      .select("_id fullName studentId admissionDate classroomId termFees");

    processed = students.length;

    // Get all active fee structures
    const feeStructures = await FeeStructure.find({ isActive: true })
      .populate("classroomId", "_id")
      .populate({
        path: "termId",
        populate: {
          path: "sessionId",
          select: "name",
        },
      });

    // Create fee structure lookup
    const feeStructureMap = new Map<string, any>();
    feeStructures.forEach((fs) => {
      const sessionName =
        (fs.termId as any).sessionId?.name || "Unknown Session";
      const key = `${(fs.classroomId as any)._id}-${
        (fs.termId as any).name
      }-${sessionName}`;
      feeStructureMap.set(key, fs);
    });

    // Check each student for missing fees
    for (const student of students) {
      if (!student.classroomId) continue;

      const classroomId = (student.classroomId as any)._id.toString();
      const admissionDate = new Date(student.admissionDate);

      const missingFees: any[] = [];

      // Check for missing fees that should exist
      feeStructures.forEach((fs) => {
        const fsClassroomId = (fs.classroomId as any)._id.toString();
        if (fsClassroomId !== classroomId) return;

        const term = fs.termId as any;
        const termEnd = new Date(term.endDate);
        const sessionName = term.sessionId?.name || "Unknown Session";

        // Skip if student wasn't enrolled during this term
        if (admissionDate > termEnd) return;

        const feeKey = `${term.name}-${sessionName}`;
        const hasFee = student.termFees.some(
          (fee: any) => fee.term === term.name && fee.session === sessionName
        );

        if (!hasFee) {
          missingFees.push({
            term: term.name,
            session: sessionName,
            amount: fs.amount,
            feeStructureId: fs._id,
          });
        }
      });

      // Backfill missing fees
      if (missingFees.length > 0) {
        missingFeesFound += missingFees.length;

        const now = new Date();

        try {
          const bulkOps = missingFees.map((missingFee) => ({
            updateOne: {
              filter: {
                _id: student._id,
                "termFees.term": { $ne: missingFee.term },
                "termFees.session": { $ne: missingFee.session },
              },
              update: {
                $push: {
                  termFees: {
                    term: missingFee.term,
                    session: missingFee.session,
                    paid: false,
                    pinCode: generatePinCode(),
                    viewable: false,
                    amount: missingFee.amount,
                    paymentDate: null,
                    updatedBy: userId
                      ? new mongoose.Types.ObjectId(userId)
                      : undefined,
                    createdAt: now,
                  },
                },
              },
            },
          }));

          await Student.bulkWrite(bulkOps, { ordered: false });
          feesBackfilled += missingFees.length;

          console.log(
            `Backfilled ${missingFees.length} fees for student ${student.fullName}`
          );
        } catch (err: any) {
          console.error(
            `Error backfilling fees for student ${student._id}:`,
            err
          );
          errors.push({
            studentId: student._id,
            error: err.message || err,
          });
        }
      }
    }

    console.log(
      `Missing fees backfill complete: ${missingFeesFound} missing fees found, ${feesBackfilled} backfilled`
    );
  } catch (error: any) {
    console.error("Error in backfillMissingFees:", error);
    errors.push({ error: error.message || error });
  }

  return { processed, missingFeesFound, feesBackfilled, errors };
}

// Full reconciliation: remove duplicates + backfill missing fees
export async function fullReconciliation(userId?: string): Promise<{
  deduplication: {
    processed: number;
    duplicatesFound: number;
    duplicatesRemoved: number;
    errors: any[];
  };
  backfill: {
    processed: number;
    missingFeesFound: number;
    feesBackfilled: number;
    errors: any[];
  };
  totalErrors: number;
}> {
  try {
    console.log("Starting full reconciliation process...");

    // First, remove duplicates
    console.log("Phase 1: Removing duplicate fees...");
    const deduplication = await removeDuplicateStudentFees(userId);

    // Then, backfill missing fees
    console.log("Phase 2: Backfilling missing fees...");
    const backfill = await backfillMissingFees(userId);

    const totalErrors = deduplication.errors.length + backfill.errors.length;

    console.log(`Full reconciliation complete: ${totalErrors} total errors`);

    return {
      deduplication,
      backfill,
      totalErrors,
    };
  } catch (error: any) {
    console.error("Error in fullReconciliation:", error);
    throw error;
  }
}
