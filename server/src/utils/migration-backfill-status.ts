import mongoose from "mongoose";
import { User } from "../models/User";

// Migration script to backfill status field for existing users
export const backfillUserStatus = async () => {
  try {
    console.log("Starting user status backfill migration...");

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log(
        "MongoDB not connected. Please ensure database connection is established."
      );
      return;
    }

    // Update all users that have null or undefined status to "active"
    const result = await User.updateMany(
      {
        $or: [{ status: { $exists: false } }, { status: null }, { status: "" }],
      },
      {
        $set: { status: "active" },
      }
    );

    console.log(`Migration completed successfully:`);
    console.log(`- Documents matched: ${result.matchedCount}`);
    console.log(`- Documents modified: ${result.modifiedCount}`);

    if (result.modifiedCount > 0) {
      console.log("✅ Status field successfully backfilled for existing users");
    } else {
      console.log(
        "ℹ️  No users needed status backfill (all users already have status set)"
      );
    }

    return result;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Script to run the migration
if (require.main === module) {
  // This allows running the script directly with: npx ts-node src/utils/migration-backfill-status.ts
  console.log("Running user status backfill migration...");

  // Note: You'll need to establish your database connection here
  // For example:
  // await mongoose.connect(process.env.MONGODB_URI!);

  backfillUserStatus()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export default backfillUserStatus;
