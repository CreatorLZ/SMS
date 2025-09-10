import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedSubjects } from "../utils/seedSubjects";

// Load environment variables
dotenv.config();

const runSeed = async () => {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
    await mongoose.connect(mongoUri);
    console.log("📊 Connected to MongoDB");

    // Seed subjects
    await seedSubjects();
    console.log("✅ Subjects seeded successfully!");
    console.log("🎓 60+ Nigerian curriculum subjects added to database");

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding subjects:", error.message);
    process.exit(1);
  }
};

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, closing database connection...");
  await mongoose.connection.close();
  process.exit(0);
});

runSeed();
