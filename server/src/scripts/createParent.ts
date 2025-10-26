import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User";
import { Student } from "../models/Student";

// Load environment variables
dotenv.config();

/**
 * Script to create a parent user linked to a student
 *
 * Usage:
 * npm run create:parent
 * STUDENT_ID=SS1S250023 npm run create:parent
 */

async function createParent() {
  try {
    const studentId = process.env.STUDENT_ID || "SS1S250023";

    console.log(`🎯 Creating parent for student: ${studentId}`);

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
    await mongoose.connect(mongoUri);
    console.log("📊 Connected to MongoDB");

    // Find the student
    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    console.log(`👨‍🎓 Found student: ${student.fullName}`);

    // Check if parent already exists
    const existingParent = await User.findOne({
      linkedStudentIds: student._id,
      role: "parent",
    });

    if (existingParent) {
      console.log(
        `⚠️ Parent already exists for this student: ${existingParent.email}`
      );
      console.log(`🔑 Parent ID: ${existingParent._id}`);
      return;
    }

    // Create parent user
    const parentEmail = `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}.parent@school.com`;
    const parentPassword = "password123";

    const parent = new User({
      name: student.parentName,
      email: parentEmail,
      password: parentPassword,
      role: "parent",
      linkedStudentIds: [student._id],
      verified: true,
    });

    const savedParent = await parent.save();
    console.log(`✅ Created parent: ${savedParent.name}`);
    console.log(`📧 Email: ${savedParent.email}`);
    console.log(`🔑 Password: ${parentPassword}`);
    console.log(`🆔 Parent ID: ${savedParent._id}`);
  } catch (error: any) {
    console.error("❌ Error creating parent:", error.message);
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

createParent();
