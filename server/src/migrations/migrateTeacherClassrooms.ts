import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User";

// Load environment variables
dotenv.config();

/**
 * Migration script to migrate existing assignedClassId to assignedClasses array
 * This enables teachers to have multiple classroom assignments
 */
export const migrateTeacherClassrooms = async () => {
  try {
    console.log("Starting teacher classroom assignment migration...");

    // Find all teachers with assignedClassId but empty assignedClasses
    const teachersToMigrate = await User.find({
      role: "teacher",
      assignedClassId: { $exists: true, $ne: null },
      $or: [
        { assignedClasses: { $exists: false } },
        { assignedClasses: { $size: 0 } },
      ],
    });

    console.log(`Found ${teachersToMigrate.length} teachers to migrate`);

    for (const teacher of teachersToMigrate) {
      if (teacher.assignedClassId) {
        // Migrate single assignedClassId to assignedClasses array
        await User.findByIdAndUpdate(teacher._id, {
          assignedClasses: [teacher.assignedClassId],
        });

        console.log(
          `Migrated teacher ${teacher.name}: ${teacher.assignedClassId} -> assignedClasses array`
        );
      }
    }

    // Verify migration - count teachers with old vs new structure
    const teachersWithOldStructure = await User.countDocuments({
      role: "teacher",
      assignedClassId: { $exists: true, $ne: null },
      $and: [
        { assignedClasses: { $exists: true } },
        { assignedClasses: { $size: 0 } },
      ],
    });

    const teachersWithNewStructure = await User.countDocuments({
      role: "teacher",
      assignedClasses: { $exists: true, $not: { $size: 0 } },
    });

    console.log(`Migration stats:`);
    console.log(
      `- Teachers still needing migration: ${teachersWithOldStructure}`
    );
    console.log(
      `- Teachers with migrated structure: ${teachersWithNewStructure}`
    );

    console.log("Teacher classroom migration complete.");
    return teachersWithOldStructure === 0;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
};

// If running this script directly
if (require.main === module) {
  (async () => {
    const dbUrl =
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      "mongodb://localhost:27017/schoolms";

    await mongoose.connect(dbUrl);
    console.log(`Connected to MongoDB at ${dbUrl}`);

    const success = await migrateTeacherClassrooms();

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

    process.exit(success ? 0 : 1);
  })();
}
