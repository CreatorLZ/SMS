import mongoose from "mongoose";
import GradingScale from "../models/GradingScale";

const nigerianGradingScales = [
  // Primary School Grading Scale (A-F)
  { min: 70, max: 100, grade: "A", remark: "Excellent" },
  { min: 60, max: 69, grade: "B", remark: "Very Good" },
  { min: 50, max: 59, grade: "C", remark: "Good" },
  { min: 45, max: 49, grade: "D", remark: "Pass" },
  { min: 40, max: 44, grade: "E", remark: "Fair" },
  { min: 0, max: 39, grade: "F", remark: "Fail" },

  // Secondary School Grading Scale (A1-F9)
  { min: 75, max: 100, grade: "A1", remark: "Excellent" },
  { min: 70, max: 74, grade: "B2", remark: "Very Good" },
  { min: 65, max: 69, grade: "B3", remark: "Good" },
  { min: 60, max: 64, grade: "C4", remark: "Credit" },
  { min: 55, max: 59, grade: "C5", remark: "Credit" },
  { min: 50, max: 54, grade: "C6", remark: "Credit" },
  { min: 45, max: 49, grade: "D7", remark: "Pass" },
  { min: 40, max: 44, grade: "E8", remark: "Pass" },
  { min: 0, max: 39, grade: "F9", remark: "Fail" },
];

async function seedNigerianGradingScales() {
  try {
    console.log("🌱 Seeding Nigerian grading scales...");

    // Clear existing grading scales
    await GradingScale.deleteMany({});
    console.log("🗑️  Cleared existing grading scales");

    // Insert new grading scales
    const insertedScales = await GradingScale.insertMany(nigerianGradingScales);
    console.log(
      `✅ Successfully seeded ${insertedScales.length} grading scales`
    );

    // Display the seeded scales
    console.log("\n📊 Seeded Grading Scales:");
    console.log("Primary School (A-F):");
    insertedScales.slice(0, 6).forEach((scale) => {
      console.log(
        `  ${scale.grade}: ${scale.min}-${scale.max}% (${scale.remark})`
      );
    });

    console.log("\nSecondary School (A1-F9):");
    insertedScales.slice(6).forEach((scale) => {
      console.log(
        `  ${scale.grade}: ${scale.min}-${scale.max}% (${scale.remark})`
      );
    });

    console.log("\n🎉 Nigerian grading scales seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding Nigerian grading scales:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require("dotenv").config();

  mongoose
    .connect(process.env.MONGODB_URI!)
    .then(() => {
      console.log("📡 Connected to MongoDB");
      return seedNigerianGradingScales();
    })
    .then(() => {
      console.log("🏁 Seeding process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export default seedNigerianGradingScales;
