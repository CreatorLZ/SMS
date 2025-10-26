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
exports.cleanupOldAuditLogs = exports.cleanupExpiredTokens = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const TokenBlacklist_1 = require("../models/TokenBlacklist");
const AuditLog_1 = require("../models/AuditLog");
/**
 * Script to cleanup expired blacklisted tokens
 * This can be run as a cron job or scheduled task
 */
const cleanupExpiredTokens = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting cleanup of expired blacklisted tokens...");
        const result = yield TokenBlacklist_1.TokenBlacklist.deleteMany({
            expiresAt: { $lt: new Date() },
        });
        const deletedCount = result.deletedCount || 0;
        console.log(`Cleaned up ${deletedCount} expired blacklisted tokens`);
        // Log the cleanup action
        yield AuditLog_1.AuditLog.create({
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
    }
    catch (error) {
        console.error("Error during token cleanup:", error);
        throw error;
    }
});
exports.cleanupExpiredTokens = cleanupExpiredTokens;
/**
 * Script to cleanup old audit logs (optional, for maintenance)
 */
const cleanupOldAuditLogs = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (daysOld = 90) {
    try {
        console.log(`Starting cleanup of audit logs older than ${daysOld} days...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const result = yield AuditLog_1.AuditLog.deleteMany({
            createdAt: { $lt: cutoffDate },
        });
        const deletedCount = result.deletedCount || 0;
        console.log(`Cleaned up ${deletedCount} old audit logs`);
        // Log the cleanup action
        yield AuditLog_1.AuditLog.create({
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
    }
    catch (error) {
        console.error("Error during audit log cleanup:", error);
        throw error;
    }
});
exports.cleanupOldAuditLogs = cleanupOldAuditLogs;
// If run directly
if (require.main === module) {
    const runCleanup = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield mongoose_1.default.connect(process.env.MONGODB_URI);
            console.log("Connected to MongoDB");
            // Run cleanup
            yield (0, exports.cleanupExpiredTokens)();
            // Optional: cleanup old audit logs
            // await cleanupOldAuditLogs(90);
            console.log("Cleanup completed successfully");
            process.exit(0);
        }
        catch (error) {
            console.error("Cleanup failed:", error);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
    runCleanup();
}
