import { Request, Response } from "express";
import { User } from "../../models/User";
import { AuditLog } from "../../models/AuditLog";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// @desc    Register a new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Create audit log
    await AuditLog.create({
      userId: req.user?._id,
      actionType: "USER_CREATE",
      description: `Created new ${role} account for ${name}`,
      targetId: user._id,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.find()
      .populate("userId", "name email")
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
