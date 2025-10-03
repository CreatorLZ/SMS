import mongoose from "mongoose";
import dotenv from "dotenv";
import { Classroom } from "../models/Classroom";

// Load environment variables
dotenv.config();

/**
 * Script to find and fix corrupted Classroom documents where students field is not an array
 */
export const fixCorruptedClassrooms = async () => {
  try {
    console.log("Checking for corrupted Classroom documents...");

    // Find all classrooms
    const allClassrooms = await Classroom.find({});

    console.log(`Found ${allClassrooms.length} classrooms`);

    let corruptedCount = 0;

    for (const classroom of allClassrooms) {
      console.log(
        `Classroom ${classroom._id}: students =`,
        classroom.students,
        `type: ${typeof classroom.students}`
      );

      if (typeof classroom.students === "string") {
        console.log(
          `Corrupted classroom found: ${classroom._id}, name: ${classroom.name}, students: "${classroom.students}"`
        );

        // Fix it
        await Classroom.findByIdAndUpdate(classroom._id, {
          students: [],
        });

        console.log(`Fixed classroom ${classroom._id}`);
        corruptedCount++;
      } else if (!Array.isArray(classroom.students)) {
        console.log(
          `Invalid students type for classroom ${
            classroom._id
          }: ${typeof classroom.students}`
        );
        corruptedCount++;
      } else {
        // Check if array contains invalid ObjectIds
        const invalidStudents = classroom.students.filter((studentId) => {
          if (typeof studentId === "string") {
            return !mongoose.Types.ObjectId.isValid(studentId);
          }
          // If it's an ObjectId instance, it's valid
          return false;
        });

        if (invalidStudents.length > 0) {
          console.log(
            `Classroom ${classroom._id} has invalid student IDs:`,
            invalidStudents
          );

          // Fix by removing invalid IDs
          const validStudents = classroom.students.filter((studentId) => {
            if (typeof studentId === "string") {
              return mongoose.Types.ObjectId.isValid(studentId);
            }
            // Keep ObjectId instances
            return true;
          });

          await Classroom.findByIdAndUpdate(classroom._id, {
            students: validStudents,
          });

          console.log(
            `Fixed classroom ${classroom._id}, removed ${invalidStudents.length} invalid IDs`
          );
          corruptedCount++;
        }
      }
    }

    console.log(`Fixed ${corruptedCount} corrupted classrooms`);
    return corruptedCount === 0;
  } catch (error) {
    console.error("Script failed:", error);
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

    const success = await fixCorruptedClassrooms();

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

    process.exit(success ? 0 : 1);
  })();
}
