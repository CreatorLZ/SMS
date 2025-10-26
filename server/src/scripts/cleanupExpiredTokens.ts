import mongoose from "mongoose";
import { TokenBlacklist } from "../models/TokenBlacklist";
import { AuditLog } from "../models/AuditLog";

/**
 * Script to cleanup expired blacklisted tokens
 * This can be run as a cron job or scheduled task
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    console.log("Starting cleanup of expired blacklisted tokens...");

    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    const deletedCount = result.deletedCount || 0;

    console.log(`Cleaned up ${deletedCount} expired blacklisted tokens`);

    // Log the cleanup action
    await AuditLog.create({
      userId: null, // System action
      actionType: "SYSTEM_CLEANUP",
      description: `Automatic cleanup of ${deletedCount} expired blacklisted tokens`,
      targetId: null,
      metadata: {
        cleanupType: "expired_tokens",
        deletedCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error during token cleanup:", error);
    throw error;
  }
};

/**
 * Script to cleanup old audit logs (optional, for maintenance)
 */
export const cleanupOldAuditLogs = async (
  daysOld: number = 90
): Promise<void> => {
  try {
    console.log(`Starting cleanup of audit logs older than ${daysOld} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    const deletedCount = result.deletedCount || 0;

    console.log(`Cleaned up ${deletedCount} old audit logs`);

    // Log the cleanup action
    await AuditLog.create({
      userId: null, // System action
      actionType: "SYSTEM_CLEANUP",
      description: `Automatic cleanup of ${deletedCount} audit logs older than ${daysOld} days`,
      targetId: null,
      metadata: {
        cleanupType: "old_audit_logs",
        deletedCount,
        daysOld,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error during audit log cleanup:", error);
    throw error;
  }
};

// If run directly
if (require.main === module) {
  const runCleanup = async () => {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log("Connected to MongoDB");

      // Run cleanup
      await cleanupExpiredTokens();

      // Optional: cleanup old audit logs
      // await cleanupOldAuditLogs(90);

      console.log("Cleanup completed successfully");
      process.exit(0);
    } catch (error) {
      console.error("Cleanup failed:", error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
    }
  };

  runCleanup();
}
