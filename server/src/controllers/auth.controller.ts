import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUser, JwtPayload } from "../types/auth.types";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";

// Token generation helpers
const generateAccessToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );
};

// @desc    Register a new user (admin/superadmin only)
// @route   POST /api/auth/register
// @access  Private/Admin
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role based on who's registering
    const isAllowed =
      req.user!.role === "superadmin" ||
      (req.user!.role === "admin" && !["superadmin", "admin"].includes(role));

    if (!isAllowed) {
      return res.status(403).json({
        message: "You are not authorized to create users with this role",
      });
    }

    // Check if user exists
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
      verified: true, // Auto-verify since admin is creating
    });

    // Log the action
    await AuditLog.create({
      userId: req.user!._id,
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
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check for user and include password field
    const user = await User.findOne({ email }).select(
      "+password +refreshTokens"
    );
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Remove refresh token from user
      await User.updateOne(
        { _id: req.user!._id },
        { $pull: { refreshTokens: refreshToken } }
      );

      // Clear cookie
      res.clearCookie("refreshToken");
    }

    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (with refresh token)
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    // Verify refresh token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as JwtPayload;
    } catch (error) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Check if user exists and token is in their refresh tokens
    const user = await User.findById(decoded.id).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh tokens (rotation)
    user.refreshTokens = user.refreshTokens.filter(
      (token: string) => token !== refreshToken
    );
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    // Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Token refresh successful",
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Development only route to get super admin tokens
export const devSuperAdminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ message: "Route not found" });
      return;
    }

    const superAdmin = await User.findOne({ role: "superadmin" });
    if (!superAdmin) {
      res.status(404).json({ message: "Super admin not found" });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(superAdmin);
    const refreshToken = generateRefreshToken(superAdmin);

    // Add refresh token to user's refreshTokens array
    superAdmin.refreshTokens = superAdmin.refreshTokens || [];
    superAdmin.refreshTokens.push(refreshToken);
    await superAdmin.save();

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // Since this is dev-only
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return tokens
    res.status(200).json({
      message: "Dev super admin login successful",
      accessToken,
      user: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
