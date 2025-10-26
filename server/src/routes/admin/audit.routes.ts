import express from "express";
import { AuditLog } from "../../models/AuditLog";
import { protect, authorize } from "../../middleware/auth";

const router = express.Router();

// All audit routes require authentication and admin/superadmin role
router.use(protect);
router.use(authorize("admin", "superadmin"));

// @desc    Get audit logs with filtering and pagination
// @route   GET /api/admin/audit/logs
// @access  Private/Admin
router.get("/logs", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      actionType,
      userId,
      email,
      startDate,
      endDate,
      outcome,
      ip,
      sortBy = "timestamp",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};

    if (actionType) {
      filter.actionType = actionType;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (email) {
      // Find user by email and filter by userId
      const User = (await import("../../models/User")).User;
      const user = await User.findOne({ email }).select("_id");
      if (user) {
        filter.userId = user._id;
      } else {
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
        filter.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string);
      }
    }

    if (outcome) {
      filter["metadata.outcome"] = outcome;
    }

    if (ip) {
      filter["metadata.ip"] = ip;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const logs = await AuditLog.find(filter)
      .populate("userId", "name email role")
      .populate("targetId", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await AuditLog.countDocuments(filter);
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
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Get audit log statistics
// @route   GET /api/admin/audit/stats
// @access  Private/Admin
router.get("/stats", async (req, res) => {
  try {
    const { period = "24h" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

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
    const [
      totalLogs,
      loginAttempts,
      failedLogins,
      successfulLogins,
      rateLimitViolations,
      accountLockouts,
      permissionDenials,
      csrfFailures,
    ] = await Promise.all([
      AuditLog.countDocuments({ timestamp: { $gte: startDate } }),
      AuditLog.countDocuments({
        actionType: { $in: ["LOGIN_SUCCESS", "LOGIN_FAILED"] },
        timestamp: { $gte: startDate },
      }),
      AuditLog.countDocuments({
        actionType: "LOGIN_FAILED",
        timestamp: { $gte: startDate },
      }),
      AuditLog.countDocuments({
        actionType: "LOGIN_SUCCESS",
        timestamp: { $gte: startDate },
      }),
      AuditLog.countDocuments({
        actionType: "RATE_LIMIT_VIOLATION",
        timestamp: { $gte: startDate },
      }),
      AuditLog.countDocuments({
        actionType: "ACCOUNT_LOCKOUT",
        timestamp: { $gte: startDate },
      }),
      AuditLog.countDocuments({
        actionType: "PERMISSION_DENIED",
        timestamp: { $gte: startDate },
      }),
      AuditLog.countDocuments({
        actionType: "CSRF_VALIDATION_FAILED",
        timestamp: { $gte: startDate },
      }),
    ]);

    // Get top action types
    const actionTypeStats = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: "$actionType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get top IPs by failed attempts
    const topFailedIPs = await AuditLog.aggregate([
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
        successRate:
          loginAttempts > 0 ? (successfulLogins / loginAttempts) * 100 : 0,
        rateLimitViolations,
        accountLockouts,
        permissionDenials,
        csrfFailures,
      },
      actionTypeStats,
      topFailedIPs,
    });
  } catch (error: any) {
    console.error("Error fetching audit stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Get audit log by ID
// @route   GET /api/admin/audit/logs/:id
// @access  Private/Admin
router.get("/logs/:id", async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate("userId", "name email role")
      .populate("targetId", "name email role");

    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    res.json(log);
  } catch (error: any) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Get available action types
// @route   GET /api/admin/audit/action-types
// @access  Private/Admin
router.get("/action-types", async (req, res) => {
  try {
    const actionTypes = await AuditLog.distinct("actionType");
    res.json({ actionTypes: actionTypes.sort() });
  } catch (error: any) {
    console.error("Error fetching action types:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Export audit logs (basic CSV export)
// @route   GET /api/admin/audit/export
// @access  Private/Admin
router.get("/export", async (req, res) => {
  try {
    const {
      actionType,
      userId,
      startDate,
      endDate,
      format = "csv",
    } = req.query;

    // Build filter (similar to logs endpoint)
    const filter: any = {};

    if (actionType) filter.actionType = actionType;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(filter)
      .populate("userId", "name email role")
      .populate("targetId", "name email role")
      .sort({ timestamp: -1 })
      .limit(10000) // Limit export to 10k records
      .lean();

    if (format === "csv") {
      // Generate CSV
      const csvHeader =
        "Timestamp,User,Email,Role,Action Type,Description,IP Address,User Agent,Outcome\n";
      const csvRows = logs.map((log) => {
        const user = log.userId as any;
        const timestamp = log.timestamp.toISOString();
        const email = user?.email || "";
        const role = user?.role || "";
        const name = user?.name || "";
        const description = `"${log.description.replace(/"/g, '""')}"`;
        const ip = log.metadata?.ip || "";
        const userAgent = `"${(log.metadata?.userAgent || "").replace(
          /"/g,
          '""'
        )}"`;
        const outcome = log.metadata?.outcome || "";

        return `${timestamp},${name},${email},${role},${log.actionType},${description},${ip},${userAgent},${outcome}`;
      });

      const csv = csvHeader + csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=audit-logs.csv"
      );
      res.send(csv);
    } else {
      // JSON export
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=audit-logs.json"
      );
      res.json(logs);
    }
  } catch (error: any) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
