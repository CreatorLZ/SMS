import mongoose from "mongoose";
import { Student } from "../models/Student";
import dotenv from "dotenv";

dotenv.config();

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");

    const students = await Student.find({});
    console.log(`Found ${students.length} students`);

    for (const student of students) {
      let updated = false;

      if (!student.gender) {
        student.gender = "Male"; // default placeholder
        updated = true;
      }
      if (!student.dateOfBirth) {
        student.dateOfBirth = new Date("2005-01-01");
        updated = true;
      }
      if (!student.address) {
        student.address = "Unknown";
        updated = true;
      }
      if (!student.location) {
        student.location = "Unknown";
        updated = true;
      }
      if (!student.parentName) {
        student.parentName = "Unknown Parent";
        updated = true;
      }
      if (!student.parentPhone) {
        student.parentPhone = "0000000000";
        updated = true;
      }
      if (!student.relationshipToStudent) {
        student.relationshipToStudent = "Guardian";
        updated = true;
      }
      if (!student.admissionDate) {
        student.admissionDate = new Date();
        updated = true;
      }

      if (updated) {
        await student.save();
        console.log(`Updated student: ${student.fullName}`);
      }
    }

    console.log("Migration completed");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed", error);
    process.exit(1);
  }
};

runMigration();
