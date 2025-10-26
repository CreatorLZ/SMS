import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog";

/**
 * Script to clean up old audit logs based on retention policy
 * This script should be run periodically (e.g., daily via cron job)
 */

const RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || "90"); // Default 90 days

export const cleanupAuditLogs = async (): Promise<void> => {
  try {
    console.log(
      `Starting audit log cleanup. Retention period: ${RETENTION_DAYS} days`
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    // Count logs to be deleted
    const logsToDelete = await AuditLog.countDocuments({
      timestamp: { $lt: cutoffDate },
    });

    console.log(
      `Found ${logsToDelete} audit logs older than ${cutoffDate.toISOString()}`
    );

    if (logsToDelete === 0) {
      console.log("No audit logs to clean up");
      return;
    }

    // Delete old logs
    const deleteResult = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(`Successfully deleted ${deleteResult.deletedCount} audit logs`);

    // Log the cleanup operation
    await AuditLog.create({
      userId: null, // System operation
      actionType: "AUDIT_LOG_CLEANUP",
      description: `Cleaned up ${deleteResult.deletedCount} audit logs older than ${RETENTION_DAYS} days`,
      targetId: null,
      metadata: {
        retentionDays: RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
        deletedCount: deleteResult.deletedCount,
        operation: "cleanup",
      },
    });
  } catch (error) {
    console.error("Error during audit log cleanup:", error);

    // Log the cleanup failure
    try {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await AuditLog.create({
        userId: null,
        actionType: "AUDIT_LOG_CLEANUP_FAILED",
        description: `Audit log cleanup failed: ${errorMessage}`,
        targetId: null,
        metadata: {
          error: errorMessage,
          retentionDays: RETENTION_DAYS,
          operation: "cleanup",
          outcome: "failure",
        },
      });
    } catch (logError) {
      console.error("Failed to log cleanup error:", logError);
    }

    throw error;
  }
};

/**
 * Archive old audit logs instead of deleting them
 * This moves logs to a separate collection for long-term storage
 */
export const archiveAuditLogs = async (): Promise<void> => {
  try {
    console.log(
      `Starting audit log archival. Retention period: ${RETENTION_DAYS} days`
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    // Get logs to archive
    const logsToArchive = await AuditLog.find({
      timestamp: { $lt: cutoffDate },
    }).lean();

    if (logsToArchive.length === 0) {
      console.log("No audit logs to archive");
      return;
    }

    // Create archive collection if it doesn't exist
    const ArchiveLog = mongoose.model(
      "ArchiveLog",
      AuditLog.schema,
      "audit_logs_archive"
    );

    // Insert into archive
    await ArchiveLog.insertMany(logsToArchive);

    // Delete from main collection
    const deleteResult = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(
      `Successfully archived ${deleteResult.deletedCount} audit logs`
    );

    // Log the archival operation
    await AuditLog.create({
      userId: null,
      actionType: "AUDIT_LOG_ARCHIVAL",
      description: `Archived ${deleteResult.deletedCount} audit logs older than ${RETENTION_DAYS} days`,
      targetId: null,
      metadata: {
        retentionDays: RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
        archivedCount: deleteResult.deletedCount,
        operation: "archive",
      },
    });
  } catch (error) {
    console.error("Error during audit log archival:", error);
    throw error;
  }
};

/**
 * Get audit log statistics for monitoring
 */
export const getAuditLogStats = async (): Promise<any> => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalLogs, logs24h, logs7d, logs30d, oldestLog, newestLog] =
      await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ timestamp: { $gte: last24h } }),
        AuditLog.countDocuments({ timestamp: { $gte: last7d } }),
        AuditLog.countDocuments({ timestamp: { $gte: last30d } }),
        AuditLog.findOne().sort({ timestamp: 1 }).select("timestamp"),
        AuditLog.findOne().sort({ timestamp: -1 }).select("timestamp"),
      ]);

    // Get action type distribution
    const actionTypeStats = await AuditLog.aggregate([
      { $group: { _id: "$actionType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalLogs,
      logsLast24h: logs24h,
      logsLast7d: logs7d,
      logsLast30d: logs30d,
      oldestLog: oldestLog?.timestamp,
      newestLog: newestLog?.timestamp,
      retentionDays: RETENTION_DAYS,
      actionTypeStats,
    };
  } catch (error) {
    console.error("Error getting audit log stats:", error);
    throw error;
  }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
  const runCleanup = async () => {
    try {
      // Connect to database if not already connected
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log("Connected to MongoDB");
      }

      const operation = process.argv[2] || "cleanup"; // 'cleanup' or 'archive'

      if (operation === "archive") {
        await archiveAuditLogs();
      } else {
        await cleanupAuditLogs();
      }

      // Show stats
      const stats = await getAuditLogStats();
      console.log("Audit Log Statistics:", JSON.stringify(stats, null, 2));

      process.exit(0);
    } catch (error) {
      console.error("Cleanup script failed:", error);
      process.exit(1);
    }
  };

  runCleanup();
}
