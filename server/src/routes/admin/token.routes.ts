import express from "express";
import { protect, authorize, requirePermission } from "../../middleware/auth";
import { TokenBlacklist } from "../../models/TokenBlacklist";
import { AuditLog } from "../../models/AuditLog";
import { blacklistToken } from "../../middleware/tokenBlacklist";

const router = express.Router();

// All routes require authentication and admin/superadmin role
router.use(protect);
router.use(authorize("admin", "superadmin"));

// @desc    Get all blacklisted tokens
// @route   GET /api/admin/tokens/blacklist
// @access  Private/Admin
router.get("/blacklist", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const tokens = await TokenBlacklist.find()
      .populate("userId", "name email")
      .populate("blacklistedBy", "name email")
      .sort({ blacklistedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TokenBlacklist.countDocuments();

    res.json({
      tokens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Manually blacklist a token
// @route   POST /api/admin/tokens/blacklist
// @access  Private/Admin
router.post("/blacklist", async (req, res) => {
  try {
    const { token, userId, reason } = req.body;

    if (!token || !userId || !reason) {
      return res.status(400).json({
        message: "Token, userId, and reason are required",
      });
    }

    // Check if token is already blacklisted
    const existingToken = await TokenBlacklist.findOne({ token });
    if (existingToken) {
      return res.status(400).json({ message: "Token is already blacklisted" });
    }

    // Blacklist the token
    await blacklistToken(token, userId, reason, req.user!._id.toString());

    // Log the action
    await AuditLog.create({
      userId: req.user!._id,
      actionType: "TOKEN_BLACKLIST",
      description: `Manually blacklisted token for user ${userId}`,
      targetId: userId,
      metadata: {
        reason,
        token: token.substring(0, 20) + "...", // Log partial token for audit
      },
    });

    res.json({ message: "Token blacklisted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Remove token from blacklist (unblacklist)
// @route   DELETE /api/admin/tokens/blacklist/:tokenId
// @access  Private/Admin
router.delete("/blacklist/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await TokenBlacklist.findById(tokenId);
    if (!token) {
      return res.status(404).json({ message: "Token not found in blacklist" });
    }

    await TokenBlacklist.findByIdAndDelete(tokenId);

    // Log the action
    await AuditLog.create({
      userId: req.user!._id,
      actionType: "TOKEN_UNBLACKLIST",
      description: `Removed token from blacklist for user ${token.userId}`,
      targetId: token.userId,
      metadata: {
        tokenId,
        reason: token.reason,
      },
    });

    res.json({ message: "Token removed from blacklist successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Get blacklist statistics
// @route   GET /api/admin/tokens/stats
// @access  Private/Admin
router.get("/stats", async (req, res) => {
  try {
    const totalBlacklisted = await TokenBlacklist.countDocuments();
    const expiredTokens = await TokenBlacklist.countDocuments({
      expiresAt: { $lt: new Date() },
    });

    // Group by reason
    const reasonStats = await TokenBlacklist.aggregate([
      {
        $group: {
          _id: "$reason",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent blacklists (last 24 hours)
    const recentBlacklists = await TokenBlacklist.countDocuments({
      blacklistedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.json({
      totalBlacklisted,
      expiredTokens,
      activeTokens: totalBlacklisted - expiredTokens,
      recentBlacklists,
      reasonStats,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Cleanup expired blacklisted tokens
// @route   POST /api/admin/tokens/cleanup
// @access  Private/Admin
router.post("/cleanup", async (req, res) => {
  try {
    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    const deletedCount = result.deletedCount;

    // Log the action
    await AuditLog.create({
      userId: req.user!._id,
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
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
