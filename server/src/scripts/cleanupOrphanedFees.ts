import mongoose from "mongoose";
import { Student } from "../models/Student";
import { FeeStructure } from "../models/FeeStructure";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const cleanupOrphanedFees = async () => {
  try {
    console.log("Starting orphaned fee cleanup...");

    const startTime = Date.now();
    let totalOrphanedFees = 0;
    let studentsAffected = 0;

    // Get an admin user for audit logging
    const adminUser = await User.findOne({
      role: { $in: ["admin", "superadmin"] },
    }).select("_id");
    if (!adminUser) {
      throw new Error("No admin user found for audit logging");
    }

    // Get all active fee structures for lookup
    const feeStructures = await FeeStructure.find({ isActive: true })
      .populate("classroomId", "_id")
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

    console.log(`Found ${feeStructures.length} active fee structures`);

    // Get all students with term fees
    const students = await Student.find({
      "termFees.0": { $exists: true }, // Students with at least one term fee
    }).select("_id fullName studentId classroomId termFees");

    console.log(`Checking ${students.length} students for orphaned fees...`);

    for (const student of students) {
      if (!student.classroomId) {
        console.log(
          `Student ${student.fullName} has no classroom assigned, skipping...`
        );
        continue;
      }

      const classroomId = (student.classroomId as any)._id.toString();
      const orphanedFees: any[] = [];

      // Check each term fee
      for (const fee of student.termFees) {
        const feeKey = `${classroomId}-${fee.term}-${fee.session}`;

        if (!feeStructureMap.has(feeKey)) {
          orphanedFees.push({
            term: fee.term,
            session: fee.session,
            amount: fee.amount,
            paid: fee.paid,
          });
        }
      }

      // Remove orphaned fees if any found
      if (orphanedFees.length > 0) {
        console.log(
          `Student ${student.fullName} (${student.studentId}) has ${orphanedFees.length} orphaned fees:`
        );
        orphanedFees.forEach((fee) => {
          console.log(
            `  - ${fee.term} ${fee.session}: ₦${fee.amount} (${
              fee.paid ? "paid" : "unpaid"
            })`
          );
        });

        // Remove orphaned fees from student
        const conditions = orphanedFees.map((fee) => ({
          term: fee.term,
          session: fee.session,
        }));

        await Student.updateOne(
          { _id: student._id },
          {
            $pull: {
              termFees: { $or: conditions },
            },
          }
        );

        totalOrphanedFees += orphanedFees.length;
        studentsAffected++;

        // Create audit log for this student
        await AuditLog.create({
          userId: adminUser._id,
          actionType: "FEE_RECONCILIATION",
          description: `Cleaned up ${orphanedFees.length} orphaned fees for student ${student.fullName} (${student.studentId})`,
          targetId: student._id,
        });
      }
    }

    const duration = Date.now() - startTime;

    // Create summary audit log
    await AuditLog.create({
      userId: adminUser._id,
      actionType: "FEE_RECONCILIATION",
      description: `Orphaned fee cleanup completed: ${totalOrphanedFees} orphaned fees removed from ${studentsAffected} students in ${duration}ms`,
      targetId: null,
    });

    console.log("\n=== CLEANUP SUMMARY ===");
    console.log(`Total orphaned fees removed: ${totalOrphanedFees}`);
    console.log(`Students affected: ${studentsAffected}`);
    console.log(`Duration: ${duration}ms`);
    console.log("========================\n");

    if (totalOrphanedFees > 0) {
      console.log("✅ Cleanup completed successfully!");
    } else {
      console.log("ℹ️  No orphaned fees found - system is clean.");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  }
};

// If running this script directly
if (require.main === module) {
  (async () => {
    const dbUrl =
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/schoolms";

    await mongoose.connect(dbUrl);
    console.log(`Connected to MongoDB at ${dbUrl}`);

    await cleanupOrphanedFees();

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

    process.exit(0);
  })();
}
