import { Request, Response, NextFunction } from "express";
import {
  validatePassword,
  logPasswordValidationFailure,
} from "../utils/passwordValidation";

/**
 * Middleware to validate password strength for password change/reset endpoints
 * This middleware should be used on routes that accept password changes
 */
export const validatePasswordMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password } = req.body;

    // Skip validation if no password provided
    if (!password) {
      return next();
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
      // Log password validation failure
      const userId = req.user?.id || req.user?._id?.toString() || null;
      const email = req.user?.email || req.body.email || null;

      await logPasswordValidationFailure(
        userId,
        email,
        passwordValidation.errors,
        req
      );

      res.status(400).json({
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
      });
      return;
    }

    // Password is valid, proceed
    next();
  } catch (error: any) {
    console.error("Password validation middleware error:", error);
    res.status(500).json({
      message: "Server error during password validation",
      error: error.message,
    });
  }
};

/**
 * Middleware specifically for password reset endpoints
 * Validates new password and ensures it differs from current password if user is authenticated
 */
export const validatePasswordResetMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password, currentPassword } = req.body;

    // Skip validation if no password provided
    if (!password) {
      return next();
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
      // Log password validation failure
      const userId = req.user?.id || req.user?._id?.toString() || null;
      const email = req.user?.email || req.body.email || null;

      await logPasswordValidationFailure(
        userId,
        email,
        passwordValidation.errors,
        req
      );

      res.status(400).json({
        message: "New password does not meet security requirements",
        errors: passwordValidation.errors,
      });
      return;
    }

    // If user is authenticated and provided current password, verify it
    if (req.user && currentPassword) {
      const { User } = await import("../models/User");
      const user = await User.findById(req.user.id || req.user._id).select(
        "+password"
      );

      if (user) {
        const isCurrentPasswordValid = await user.comparePassword(
          currentPassword
        );
        if (!isCurrentPasswordValid) {
          res.status(400).json({
            message: "Current password is incorrect",
          });
          return;
        }

        // Check if new password is different from current
        const isSamePassword = await user.comparePassword(password);
        if (isSamePassword) {
          res.status(400).json({
            message: "New password must be different from current password",
          });
          return;
        }
      }
    }

    // Password is valid, proceed
    next();
  } catch (error: any) {
    console.error("Password reset validation middleware error:", error);
    res.status(500).json({
      message: "Server error during password validation",
      error: error.message,
    });
  }
};
