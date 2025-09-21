import mongoose from "mongoose";
import { Student } from "../models/Student";

/**
 * Migration script to split existing fullName into firstName and lastName
 * Run this script once after updating the Student model with name fields
 */
export const migrateStudentNames = async () => {
  try {
    console.log("Starting student name migration...");

    // Find all students that don't have firstName or lastName set
    const studentsToMigrate = await Student.find({
      $or: [
        { firstName: { $exists: false } },
        { lastName: { $exists: false } },
        { firstName: "" },
        { lastName: "" },
      ],
    });

    console.log(`Found ${studentsToMigrate.length} students to migrate`);

    for (const student of studentsToMigrate) {
      if (student.fullName) {
        // Split fullName into firstName and lastName
        const nameParts = student.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Update the student with split names
        await Student.findByIdAndUpdate(student._id, {
          firstName:
            firstName.charAt(0).toUpperCase() +
            firstName.slice(1).toLowerCase(),
          lastName:
            lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase(),
        });

        console.log(
          `Migrated: ${student.fullName} -> ${firstName} ${lastName}`
        );
      }
    }

    // Verify all students now have firstName and lastName
    const studentsWithoutNames = await Student.find({
      $or: [
        { firstName: { $exists: false } },
        { lastName: { $exists: false } },
        { firstName: "" },
        { lastName: "" },
      ],
    });

    console.log(
      `Migration complete. ${studentsWithoutNames.length} students still missing names.`
    );
    return studentsWithoutNames.length === 0;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
};

// If running this script directly
if (require.main === module) {
  (async () => {
    await mongoose.connect(
      process.env.DATABASE_URL || "mongodb://localhost:27017/schoolms"
    );
    const success = await migrateStudentNames();
    await mongoose.disconnect();
    process.exit(success ? 0 : 1);
  })();
}
