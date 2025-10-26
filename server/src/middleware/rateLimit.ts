import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";

// Standard login rate limiter: 5 attempts per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error:
      "Too many login attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: async (req: Request, res: Response) => {
    // Log rate limit violation
    try {
      await AuditLog.create({
        userId: null, // No user ID for rate limit violations
        actionType: "RATE_LIMIT_VIOLATION",
        description: `Rate limit exceeded for login attempts from IP: ${req.ip}`,
        targetId: null,
        metadata: {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          endpoint: req.originalUrl,
          method: req.method,
        },
      });
    } catch (error) {
      console.error("Failed to log rate limit violation:", error);
    }

    res.status(429).json({
      error:
        "Too many login attempts from this IP, please try again after 15 minutes.",
    });
  },
});

// Failed login rate limiter: 10 attempts per hour per IP
export const failedLoginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 failed login attempts per windowMs
  message: {
    error:
      "Too many failed login attempts from this IP, please try again after 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  skip: (req: Request) => {
    // Skip if login was successful (we'll check this in the controller)
    return req.body && req.body.success === true;
  },
  handler: async (req: Request, res: Response) => {
    try {
      await AuditLog.create({
        userId: null,
        actionType: "RATE_LIMIT_VIOLATION",
        description: `Rate limit exceeded for failed login attempts from IP: ${req.ip}`,
        targetId: null,
        metadata: {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          endpoint: req.originalUrl,
          method: req.method,
        },
      });
    } catch (error) {
      console.error("Failed to log rate limit violation:", error);
    }

    res.status(429).json({
      error:
        "Too many failed login attempts from this IP, please try again after 1 hour.",
    });
  },
});

// Account-specific rate limiter: 3 failed attempts per 5 minutes per account
export const accountRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each account to 3 failed login attempts per windowMs
  message: {
    error:
      "Too many failed login attempts for this account, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use email as the key for account-specific limiting
    return req.body?.email || req.ip;
  },
  skipSuccessfulRequests: true,
  skip: (req: Request) => {
    return req.body && req.body.success === true;
  },
  handler: async (req: Request, res: Response) => {
    try {
      await AuditLog.create({
        userId: null,
        actionType: "RATE_LIMIT_VIOLATION",
        description: `Rate limit exceeded for account-specific login attempts: ${
          req.body?.email || "unknown"
        } from IP: ${req.ip}`,
        targetId: null,
        metadata: {
          ip: req.ip,
          email: req.body?.email,
          userAgent: req.get("User-Agent"),
          endpoint: req.originalUrl,
          method: req.method,
        },
      });
    } catch (error) {
      console.error("Failed to log rate limit violation:", error);
    }

    res.status(429).json({
      error:
        "Too many failed login attempts for this account, please try again after 5 minutes.",
    });
  },
});
