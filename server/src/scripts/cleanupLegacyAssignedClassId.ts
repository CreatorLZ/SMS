import mongoose from "mongoose";
import { User } from "../models/User";
import { Classroom } from "../models/Classroom";

async function cleanupLegacyAssignedClassId() {
  try {
    console.log("Starting comprehensive cleanup of legacy assignedClassId...");

    // Step 1: Migrate any remaining assignedClassId to assignedClasses
    console.log("Step 1: Migrating remaining assignedClassId data...");

    const teachersWithLegacyField = await User.find({
      role: "teacher",
      assignedClassId: { $exists: true, $ne: null },
    });

    console.log(
      `Found ${teachersWithLegacyField.length} teachers with legacy assignedClassId`
    );

    for (const teacher of teachersWithLegacyField) {
      const assignedClassId = teacher.assignedClassId;

      if (!assignedClassId) continue;

      // Check if assignedClasses already contains this classroom
      const hasClassroom = teacher.assignedClasses?.includes(
        assignedClassId.toString()
      );

      if (!hasClassroom) {
        // Add to assignedClasses array
        await User.findByIdAndUpdate(teacher._id, {
          $addToSet: { assignedClasses: assignedClassId },
        });
        console.log(
          `Migrated teacher ${teacher.name}: added ${assignedClassId} to assignedClasses`
        );
      }

      // Ensure classroom.teacherId is set correctly
      const classroom = await Classroom.findById(assignedClassId);
      if (
        classroom &&
        classroom.teacherId?.toString() !== teacher._id.toString()
      ) {
        await Classroom.findByIdAndUpdate(assignedClassId, {
          teacherId: teacher._id,
        });
        console.log(
          `Fixed classroom ${classroom.name}: set teacherId to ${teacher.name}`
        );
      }
    }

    // Step 2: Remove assignedClassId field from all users
    console.log("Step 2: Removing assignedClassId field from all users...");

    const result = await User.updateMany(
      { assignedClassId: { $exists: true } },
      { $unset: { assignedClassId: 1 } }
    );

    console.log(
      `Removed assignedClassId field from ${result.modifiedCount} users`
    );

    // Step 3: Verify data integrity
    console.log("Step 3: Verifying data integrity...");

    const teachers = await User.find({ role: "teacher" }).populate(
      "assignedClasses",
      "name teacherId"
    );

    let integrityIssues = 0;

    for (const teacher of teachers) {
      if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
        for (const classroom of teacher.assignedClasses as any[]) {
          if (classroom.teacherId?.toString() !== teacher._id.toString()) {
            console.error(
              `Integrity issue: Classroom ${classroom.name} has teacherId ${classroom.teacherId} but teacher ${teacher.name} has it assigned`
            );
            integrityIssues++;

            // Fix the issue
            await Classroom.findByIdAndUpdate(classroom._id, {
              teacherId: teacher._id,
            });
            console.log(
              `Fixed: Set classroom ${classroom.name} teacherId to ${teacher.name}`
            );
          }
        }
      }
    }

    // Step 4: Check for orphaned classrooms (classrooms with teacherId but teacher doesn't have them assigned)
    console.log("Step 4: Checking for orphaned classroom assignments...");

    const classrooms = await Classroom.find({
      teacherId: { $exists: true, $ne: null },
    }).populate("teacherId", "name assignedClasses");

    for (const classroom of classrooms as any[]) {
      if (classroom.teacherId) {
        const teacher = classroom.teacherId;
        const hasAssignment = teacher.assignedClasses?.includes(
          classroom._id.toString()
        );

        if (!hasAssignment) {
          console.error(
            `Orphaned assignment: Classroom ${classroom.name} has teacherId ${teacher.name} but teacher doesn't have it in assignedClasses`
          );

          // Fix by adding to teacher's assignedClasses
          await User.findByIdAndUpdate(teacher._id, {
            $addToSet: { assignedClasses: classroom._id },
          });
          console.log(
            `Fixed: Added classroom ${classroom.name} to teacher ${teacher.name}'s assignedClasses`
          );
        }
      }
    }

    console.log("Cleanup Summary:");
    console.log(
      `- Migrated ${teachersWithLegacyField.length} teachers from assignedClassId to assignedClasses`
    );
    console.log(
      `- Removed assignedClassId field from ${result.modifiedCount} users`
    );
    console.log(`- Fixed ${integrityIssues} data integrity issues`);
    console.log("- Legacy assignedClassId cleanup completed successfully");
  } catch (error) {
    console.error("Error during legacy cleanup:", error);
    throw error;
  } finally {
    mongoose.connection.close();
  }
}

// Run the script if called directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose
    .connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://isaacanyim:Lezico123@isaacdev.bpnm7.mongodb.net/treasureland?retryWrites=true&w=majority&appName=Isaacdev"
    )
    .then(() => {
      console.log("Connected to MongoDB");
      return cleanupLegacyAssignedClassId();
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    });
}

export { cleanupLegacyAssignedClassId };
