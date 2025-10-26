import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenBlacklist } from "../models/TokenBlacklist";
import { JwtPayload } from "../types/auth.types";
import mongoose from "mongoose";

/**
 * Middleware to check if the access token is blacklisted
 * Should be used after the protect middleware
 */
export const checkTokenBlacklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({
        message: "Token has been revoked",
        error: "TOKEN_REVOKED",
      });
    }

    next();
  } catch (error) {
    console.error("Token blacklist check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Utility function to blacklist a token
 */
export const blacklistToken = async (
  token: string,
  userId: string,
  reason: string,
  blacklistedBy?: string
): Promise<void> => {
  try {
    // Decode token to get expiration time
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      throw new Error("Invalid token format");
    }

    const expiresAt = new Date(decoded.exp * 1000); // JWT exp is in seconds

    await TokenBlacklist.create({
      token,
      userId: new mongoose.Types.ObjectId(userId),
      expiresAt,
      reason,
      blacklistedBy: blacklistedBy
        ? new mongoose.Types.ObjectId(blacklistedBy)
        : undefined,
    });
  } catch (error) {
    console.error("Error blacklisting token:", error);
    throw error;
  }
};

/**
 * Utility function to blacklist all tokens for a user
 */
export const blacklistAllUserTokens = async (
  userId: string,
  reason: string,
  blacklistedBy?: string
): Promise<void> => {
  try {
    // This would require getting all active tokens for the user
    // For now, we'll implement this when we have a way to track active tokens
    // For logout, we can blacklist the current token
    console.log(
      `Blacklisting all tokens for user ${userId} with reason: ${reason}`
    );
  } catch (error) {
    console.error("Error blacklisting all user tokens:", error);
    throw error;
  }
};
