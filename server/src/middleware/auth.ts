import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { JwtPayload, Permission } from "../types/auth.types";
import {
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
} from "../utils/permissions";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Not authorized to access this route" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized to access this route" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${
          req.user?.role || "undefined"
        } is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        message: `Insufficient permissions. Required: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return res.status(403).json({
        message: `Insufficient permissions. Required one of: ${permissions.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has all of the specified permissions
 */
export const requireAllPermissions = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userPermissions = getRolePermissions(req.user.role);
    const hasAllRequired = permissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllRequired) {
      return res.status(403).json({
        message: `Insufficient permissions. Required all of: ${permissions.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

/**
 * Middleware to set user permissions on request object
 */
export const setPermissions = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    req.permissions = getRolePermissions(req.user.role);
  }
  next();
};
