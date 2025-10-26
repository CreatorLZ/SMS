"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const AuditLog_1 = require("../../models/AuditLog");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
// All audit routes require authentication and admin/superadmin role
router.use(auth_1.protect);
router.use((0, auth_1.authorize)("admin", "superadmin"));
// @desc    Get audit logs with filtering and pagination
// @route   GET /api/admin/audit/logs
// @access  Private/Admin
router.get("/logs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 50, actionType, userId, email, startDate, endDate, outcome, ip, sortBy = "timestamp", sortOrder = "desc", } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        const filter = {};
        if (actionType) {
            filter.actionType = actionType;
        }
        if (userId) {
            filter.userId = userId;
        }
        if (email) {
            // Find user by email and filter by userId
            const User = (yield Promise.resolve().then(() => __importStar(require("../../models/User")))).User;
            const user = yield User.findOne({ email }).select("_id");
            if (user) {
                filter.userId = user._id;
            }
            else {
                // If no user found with that email, return empty results
                return res.json({
                    logs: [],
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: 0,
                        pages: 0,
                    },
                });
            }
        }
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.timestamp.$lte = new Date(endDate);
            }
        }
        if (outcome) {
            filter["metadata.outcome"] = outcome;
        }
        if (ip) {
            filter["metadata.ip"] = ip;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        // Execute query with pagination
        const logs = yield AuditLog_1.AuditLog.find(filter)
            .populate("userId", "name email role")
            .populate("targetId", "name email role")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();
        const total = yield AuditLog_1.AuditLog.countDocuments(filter);
        const pages = Math.ceil(total / limitNum);
        res.json({
            logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages,
            },
        });
    }
    catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Get audit log statistics
// @route   GET /api/admin/audit/stats
// @access  Private/Admin
router.get("/stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period = "24h" } = req.query;
        // Calculate date range
        const now = new Date();
        let startDate;
        switch (period) {
            case "1h":
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case "24h":
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case "7d":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        // Get statistics
        const [totalLogs, loginAttempts, failedLogins, successfulLogins, rateLimitViolations, accountLockouts, permissionDenials, csrfFailures,] = yield Promise.all([
            AuditLog_1.AuditLog.countDocuments({ timestamp: { $gte: startDate } }),
            AuditLog_1.AuditLog.countDocuments({
                actionType: { $in: ["LOGIN_SUCCESS", "LOGIN_FAILED"] },
                timestamp: { $gte: startDate },
            }),
            AuditLog_1.AuditLog.countDocuments({
                actionType: "LOGIN_FAILED",
                timestamp: { $gte: startDate },
            }),
            AuditLog_1.AuditLog.countDocuments({
                actionType: "LOGIN_SUCCESS",
                timestamp: { $gte: startDate },
            }),
            AuditLog_1.AuditLog.countDocuments({
                actionType: "RATE_LIMIT_VIOLATION",
                timestamp: { $gte: startDate },
            }),
            AuditLog_1.AuditLog.countDocuments({
                actionType: "ACCOUNT_LOCKOUT",
                timestamp: { $gte: startDate },
            }),
            AuditLog_1.AuditLog.countDocuments({
                actionType: "PERMISSION_DENIED",
                timestamp: { $gte: startDate },
            }),
            AuditLog_1.AuditLog.countDocuments({
                actionType: "CSRF_VALIDATION_FAILED",
                timestamp: { $gte: startDate },
            }),
        ]);
        // Get top action types
        const actionTypeStats = yield AuditLog_1.AuditLog.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            { $group: { _id: "$actionType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        // Get top IPs by failed attempts
        const topFailedIPs = yield AuditLog_1.AuditLog.aggregate([
            {
                $match: {
                    actionType: "LOGIN_FAILED",
                    timestamp: { $gte: startDate },
                },
            },
            { $group: { _id: "$metadata.ip", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        res.json({
            period,
            summary: {
                totalLogs,
                loginAttempts,
                failedLogins,
                successfulLogins,
                successRate: loginAttempts > 0 ? (successfulLogins / loginAttempts) * 100 : 0,
                rateLimitViolations,
                accountLockouts,
                permissionDenials,
                csrfFailures,
            },
            actionTypeStats,
            topFailedIPs,
        });
    }
    catch (error) {
        console.error("Error fetching audit stats:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Get audit log by ID
// @route   GET /api/admin/audit/logs/:id
// @access  Private/Admin
router.get("/logs/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const log = yield AuditLog_1.AuditLog.findById(req.params.id)
            .populate("userId", "name email role")
            .populate("targetId", "name email role");
        if (!log) {
            return res.status(404).json({ message: "Audit log not found" });
        }
        res.json(log);
    }
    catch (error) {
        console.error("Error fetching audit log:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Get available action types
// @route   GET /api/admin/audit/action-types
// @access  Private/Admin
router.get("/action-types", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actionTypes = yield AuditLog_1.AuditLog.distinct("actionType");
        res.json({ actionTypes: actionTypes.sort() });
    }
    catch (error) {
        console.error("Error fetching action types:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Export audit logs (basic CSV export)
// @route   GET /api/admin/audit/export
// @access  Private/Admin
router.get("/export", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { actionType, userId, startDate, endDate, format = "csv", } = req.query;
        // Build filter (similar to logs endpoint)
        const filter = {};
        if (actionType)
            filter.actionType = actionType;
        if (userId)
            filter.userId = userId;
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate)
                filter.timestamp.$gte = new Date(startDate);
            if (endDate)
                filter.timestamp.$lte = new Date(endDate);
        }
        const logs = yield AuditLog_1.AuditLog.find(filter)
            .populate("userId", "name email role")
            .populate("targetId", "name email role")
            .sort({ timestamp: -1 })
            .limit(10000) // Limit export to 10k records
            .lean();
        if (format === "csv") {
            // Generate CSV
            const csvHeader = "Timestamp,User,Email,Role,Action Type,Description,IP Address,User Agent,Outcome\n";
            const csvRows = logs.map((log) => {
                var _a, _b, _c;
                const user = log.userId;
                const timestamp = log.timestamp.toISOString();
                const email = (user === null || user === void 0 ? void 0 : user.email) || "";
                const role = (user === null || user === void 0 ? void 0 : user.role) || "";
                const name = (user === null || user === void 0 ? void 0 : user.name) || "";
                const description = `"${log.description.replace(/"/g, '""')}"`;
                const ip = ((_a = log.metadata) === null || _a === void 0 ? void 0 : _a.ip) || "";
                const userAgent = `"${(((_b = log.metadata) === null || _b === void 0 ? void 0 : _b.userAgent) || "").replace(/"/g, '""')}"`;
                const outcome = ((_c = log.metadata) === null || _c === void 0 ? void 0 : _c.outcome) || "";
                return `${timestamp},${name},${email},${role},${log.actionType},${description},${ip},${userAgent},${outcome}`;
            });
            const csv = csvHeader + csvRows.join("\n");
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
            res.send(csv);
        }
        else {
            // JSON export
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", "attachment; filename=audit-logs.json");
            res.json(logs);
        }
    }
    catch (error) {
        console.error("Error exporting audit logs:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
exports.default = router;
