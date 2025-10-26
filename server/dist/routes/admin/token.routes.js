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
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const TokenBlacklist_1 = require("../../models/TokenBlacklist");
const AuditLog_1 = require("../../models/AuditLog");
const tokenBlacklist_1 = require("../../middleware/tokenBlacklist");
const router = express_1.default.Router();
// All routes require authentication and admin/superadmin role
router.use(auth_1.protect);
router.use((0, auth_1.authorize)("admin", "superadmin"));
// @desc    Get all blacklisted tokens
// @route   GET /api/admin/tokens/blacklist
// @access  Private/Admin
router.get("/blacklist", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const tokens = yield TokenBlacklist_1.TokenBlacklist.find()
            .populate("userId", "name email")
            .populate("blacklistedBy", "name email")
            .sort({ blacklistedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = yield TokenBlacklist_1.TokenBlacklist.countDocuments();
        res.json({
            tokens,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Manually blacklist a token
// @route   POST /api/admin/tokens/blacklist
// @access  Private/Admin
router.post("/blacklist", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, userId, reason } = req.body;
        if (!token || !userId || !reason) {
            return res.status(400).json({
                message: "Token, userId, and reason are required",
            });
        }
        // Check if token is already blacklisted
        const existingToken = yield TokenBlacklist_1.TokenBlacklist.findOne({ token });
        if (existingToken) {
            return res.status(400).json({ message: "Token is already blacklisted" });
        }
        // Blacklist the token
        yield (0, tokenBlacklist_1.blacklistToken)(token, userId, reason, req.user._id.toString());
        // Log the action
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "TOKEN_BLACKLIST",
            description: `Manually blacklisted token for user ${userId}`,
            targetId: userId,
            metadata: {
                reason,
                token: token.substring(0, 20) + "...", // Log partial token for audit
            },
        });
        res.json({ message: "Token blacklisted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Remove token from blacklist (unblacklist)
// @route   DELETE /api/admin/tokens/blacklist/:tokenId
// @access  Private/Admin
router.delete("/blacklist/:tokenId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tokenId } = req.params;
        const token = yield TokenBlacklist_1.TokenBlacklist.findById(tokenId);
        if (!token) {
            return res.status(404).json({ message: "Token not found in blacklist" });
        }
        yield TokenBlacklist_1.TokenBlacklist.findByIdAndDelete(tokenId);
        // Log the action
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "TOKEN_UNBLACKLIST",
            description: `Removed token from blacklist for user ${token.userId}`,
            targetId: token.userId,
            metadata: {
                tokenId,
                reason: token.reason,
            },
        });
        res.json({ message: "Token removed from blacklist successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Get blacklist statistics
// @route   GET /api/admin/tokens/stats
// @access  Private/Admin
router.get("/stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalBlacklisted = yield TokenBlacklist_1.TokenBlacklist.countDocuments();
        const expiredTokens = yield TokenBlacklist_1.TokenBlacklist.countDocuments({
            expiresAt: { $lt: new Date() },
        });
        // Group by reason
        const reasonStats = yield TokenBlacklist_1.TokenBlacklist.aggregate([
            {
                $group: {
                    _id: "$reason",
                    count: { $sum: 1 },
                },
            },
        ]);
        // Recent blacklists (last 24 hours)
        const recentBlacklists = yield TokenBlacklist_1.TokenBlacklist.countDocuments({
            blacklistedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        res.json({
            totalBlacklisted,
            expiredTokens,
            activeTokens: totalBlacklisted - expiredTokens,
            recentBlacklists,
            reasonStats,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
// @desc    Cleanup expired blacklisted tokens
// @route   POST /api/admin/tokens/cleanup
// @access  Private/Admin
router.post("/cleanup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield TokenBlacklist_1.TokenBlacklist.deleteMany({
            expiresAt: { $lt: new Date() },
        });
        const deletedCount = result.deletedCount;
        // Log the action
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "TOKEN_CLEANUP",
            description: `Cleaned up ${deletedCount} expired blacklisted tokens`,
            targetId: null,
            metadata: {
                deletedCount,
            },
        });
        res.json({
            message: "Cleanup completed successfully",
            deletedCount,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));
exports.default = router;
