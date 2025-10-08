import mongoose from "mongoose";
import dotenv from "dotenv";
import { Student } from "../models/Student";

// Load environment variables
dotenv.config();

/**
 * Migration script to fix students that don't have fullName field populated
 *
 * This script finds all students where fullName is missing or empty,
 * and sets it to firstName + " " + lastName
 *
 * Usage:
 * npm run fix:student-fullnames
 */

async function fixStudentFullNames() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
    await mongoose.connect(mongoUri);
    console.log("📊 Connected to MongoDB");

    // Find students without fullName or with empty fullName
    const studentsWithoutFullName = await Student.find({
      $or: [
        { fullName: { $exists: false } },
        { fullName: "" },
        { fullName: null },
      ],
    }).select("firstName lastName fullName studentId");

    console.log(
      `🔍 Found ${studentsWithoutFullName.length} students without fullName`
    );

    if (studentsWithoutFullName.length === 0) {
      console.log("✅ All students already have fullName populated");
      return;
    }

    // Update each student
    let updatedCount = 0;
    for (const student of studentsWithoutFullName) {
      if (student.firstName && student.lastName) {
        const newFullName = `${student.firstName} ${student.lastName}`;

        await Student.findByIdAndUpdate(student._id, {
          fullName: newFullName,
        });

        console.log(`✅ Updated ${student.studentId}: "${newFullName}"`);
        updatedCount++;
      } else {
        console.log(
          `⚠️  Skipped ${student.studentId}: Missing firstName or lastName`
        );
      }
    }

    console.log(
      `🎉 Successfully updated ${updatedCount} students with fullName field`
    );

    // Verify the updates
    const remainingWithoutFullName = await Student.countDocuments({
      $or: [
        { fullName: { $exists: false } },
        { fullName: "" },
        { fullName: null },
      ],
    });

    console.log(
      `📊 Students still without fullName: ${remainingWithoutFullName}`
    );
  } catch (error: any) {
    console.error("❌ Error fixing student fullNames:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, closing database connection...");
  await mongoose.disconnect();
  process.exit(0);
});

fixStudentFullNames();
