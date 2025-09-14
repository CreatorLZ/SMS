import mongoose from "mongoose";
import { FeeStructure } from "../models/FeeStructure";
import { Term } from "../models/Term";
import dotenv from "dotenv";

dotenv.config();

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");

    console.log("Starting fee structure activation migration...");

    // Get all fee structures
    const feeStructures = await FeeStructure.find({}).populate(
      "termId",
      "isActive"
    );

    console.log(`Found ${feeStructures.length} fee structures`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const feeStructure of feeStructures) {
      const term = feeStructure.termId as any;

      try {
        if (!term) {
          console.warn(
            `Fee structure ${feeStructure._id} has no associated term`
          );
          errorCount++;
          continue;
        }

        const shouldBeActive = term.isActive;
        const isCurrentlyActive = feeStructure.isActive;

        if (shouldBeActive !== isCurrentlyActive) {
          feeStructure.isActive = shouldBeActive;
          await feeStructure.save();
          updatedCount++;

          const termDetails = `${term.name} ${term.year}`;
          console.log(
            `Updated fee structure for classroom ${feeStructure.classroomId} - ${termDetails}: active=${shouldBeActive}`
          );
        }
      } catch (error: any) {
        console.error(
          `Error updating fee structure ${feeStructure._id}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(
      `Migration completed: ${updatedCount} fee structures updated, ${errorCount} errors`
    );

    if (errorCount > 0) {
      console.warn(
        "Some fee structures could not be updated. Please check manually."
      );
    } else {
      console.log(
        "All fee structures are now correctly aligned with term activation status."
      );
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed", error);
    process.exit(1);
  }
};

runMigration();
