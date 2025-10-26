"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogStats = exports.archiveAuditLogs = exports.cleanupAuditLogs = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AuditLog_1 = require("../models/AuditLog");
/**
 * Script to clean up old audit logs based on retention policy
 * This script should be run periodically (e.g., daily via cron job)
 */
const RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || "90"); // Default 90 days
const cleanupAuditLogs = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Starting audit log cleanup. Retention period: ${RETENTION_DAYS} days`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
        // Count logs to be deleted
        const logsToDelete = yield AuditLog_1.AuditLog.countDocuments({
            timestamp: { $lt: cutoffDate },
        });
        console.log(`Found ${logsToDelete} audit logs older than ${cutoffDate.toISOString()}`);
        if (logsToDelete === 0) {
            console.log("No audit logs to clean up");
            return;
        }
        // Delete old logs
        const deleteResult = yield AuditLog_1.AuditLog.deleteMany({
            timestamp: { $lt: cutoffDate },
        });
        console.log(`Successfully deleted ${deleteResult.deletedCount} audit logs`);
        // Log the cleanup operation
        yield AuditLog_1.AuditLog.create({
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
    }
    catch (error) {
        console.error("Error during audit log cleanup:", error);
        // Log the cleanup failure
        try {
            const errorMessage = error instanceof Error ? error.message : String(error);
            yield AuditLog_1.AuditLog.create({
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
        }
        catch (logError) {
            console.error("Failed to log cleanup error:", logError);
        }
        throw error;
    }
});
exports.cleanupAuditLogs = cleanupAuditLogs;
/**
 * Archive old audit logs instead of deleting them
 * This moves logs to a separate collection for long-term storage
 */
const archiveAuditLogs = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Starting audit log archival. Retention period: ${RETENTION_DAYS} days`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
        // Get logs to archive
        const logsToArchive = yield AuditLog_1.AuditLog.find({
            timestamp: { $lt: cutoffDate },
        }).lean();
        if (logsToArchive.length === 0) {
            console.log("No audit logs to archive");
            return;
        }
        // Create archive collection if it doesn't exist
        const ArchiveLog = mongoose_1.default.model("ArchiveLog", AuditLog_1.AuditLog.schema, "audit_logs_archive");
        // Insert into archive
        yield ArchiveLog.insertMany(logsToArchive);
        // Delete from main collection
        const deleteResult = yield AuditLog_1.AuditLog.deleteMany({
            timestamp: { $lt: cutoffDate },
        });
        console.log(`Successfully archived ${deleteResult.deletedCount} audit logs`);
        // Log the archival operation
        yield AuditLog_1.AuditLog.create({
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
    }
    catch (error) {
        console.error("Error during audit log archival:", error);
        throw error;
    }
});
exports.archiveAuditLogs = archiveAuditLogs;
/**
 * Get audit log statistics for monitoring
 */
const getAuditLogStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalLogs, logs24h, logs7d, logs30d, oldestLog, newestLog] = yield Promise.all([
            AuditLog_1.AuditLog.countDocuments(),
            AuditLog_1.AuditLog.countDocuments({ timestamp: { $gte: last24h } }),
            AuditLog_1.AuditLog.countDocuments({ timestamp: { $gte: last7d } }),
            AuditLog_1.AuditLog.countDocuments({ timestamp: { $gte: last30d } }),
            AuditLog_1.AuditLog.findOne().sort({ timestamp: 1 }).select("timestamp"),
            AuditLog_1.AuditLog.findOne().sort({ timestamp: -1 }).select("timestamp"),
        ]);
        // Get action type distribution
        const actionTypeStats = yield AuditLog_1.AuditLog.aggregate([
            { $group: { _id: "$actionType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        return {
            totalLogs,
            logsLast24h: logs24h,
            logsLast7d: logs7d,
            logsLast30d: logs30d,
            oldestLog: oldestLog === null || oldestLog === void 0 ? void 0 : oldestLog.timestamp,
            newestLog: newestLog === null || newestLog === void 0 ? void 0 : newestLog.timestamp,
            retentionDays: RETENTION_DAYS,
            actionTypeStats,
        };
    }
    catch (error) {
        console.error("Error getting audit log stats:", error);
        throw error;
    }
});
exports.getAuditLogStats = getAuditLogStats;
// Run cleanup if this script is executed directly
if (require.main === module) {
    const runCleanup = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Connect to database if not already connected
            if (mongoose_1.default.connection.readyState !== 1) {
                yield mongoose_1.default.connect(process.env.MONGODB_URI);
                console.log("Connected to MongoDB");
            }
            const operation = process.argv[2] || "cleanup"; // 'cleanup' or 'archive'
            if (operation === "archive") {
                yield (0, exports.archiveAuditLogs)();
            }
            else {
                yield (0, exports.cleanupAuditLogs)();
            }
            // Show stats
            const stats = yield (0, exports.getAuditLogStats)();
            console.log("Audit Log Statistics:", JSON.stringify(stats, null, 2));
            process.exit(0);
        }
        catch (error) {
            console.error("Cleanup script failed:", error);
            process.exit(1);
        }
    });
    runCleanup();
}
