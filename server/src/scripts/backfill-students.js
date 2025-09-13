const mongoose = require("mongoose");
const { backfillStudentClassroomIds } = require("../services/feeSync.service");

async function runBackfill() {
  try {
    console.log("Starting student classroomId backfill...");

    const result = await backfillStudentClassroomIds();

    console.log("Backfill completed!");
    console.log(`Processed: ${result.processed}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("Errors:");
      result.errors.forEach((error) => console.log(" -", error));
    }
  } catch (error) {
    console.error("Backfill failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runBackfill();
