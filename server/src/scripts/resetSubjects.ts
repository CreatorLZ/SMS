import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const resetSubjects = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/treasure-land";
    await mongoose.connect(mongoUri);
    console.log("📊 Connected to MongoDB");

    // Check if subjects collection exists
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const collections = await db.listCollections().toArray();
    const subjectsCollection = collections.find(
      (col) => col.name === "subjects"
    );

    if (subjectsCollection) {
      // Drop the subjects collection
      await db.dropCollection("subjects");
      console.log("🗑️  Dropped subjects collection");
    } else {
      console.log("ℹ️  Subjects collection doesn't exist, nothing to drop");
    }

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    console.log("✅ Database reset complete");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error resetting database:", error.message);
    process.exit(1);
  }
};

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, closing database connection...");
  await mongoose.connection.close();
  process.exit(0);
});

resetSubjects();
