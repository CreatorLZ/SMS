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
  }).populate("termId", "name year");
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
      const year = term.year;
      const amount = fs.amount ?? 0;

      // Check if student already has this fee
      const hasTerm = student.termFees?.some(
        (t: any) => t.term === termName && t.year === year
      );

      if (!hasTerm) {
        // Add new fee entry
        bulkOps.push({
          updateOne: {
            filter: {
              _id: student._id,
              "termFees.term": { $ne: termName },
              "termFees.year": { $ne: year },
            },
            update: {
              $push: {
                termFees: {
                  term: termName,
                  year,
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
          (t: any) => t.term === termName && t.year === year
        );

        if (existingFee && existingFee.amount !== amount) {
          bulkOps.push({
            updateOne: {
              filter: {
                _id: student._id,
                "termFees.term": termName,
                "termFees.year": year,
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
                "termFees.year": year,
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
