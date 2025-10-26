import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../models/AuditLog";

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Log to audit log (only if user is authenticated)
  if (req.user?._id) {
    AuditLog.create({
      userId: req.user._id,
      actionType: "ERROR",
      description: `Error occurred: ${err.message}`,
      targetId: null,
      metadata: {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        error: err.message,
      },
    }).catch((logErr) => console.error("Failed to log error:", logErr));
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { ...error, message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.name === "MongoError" && (err as any).code === 11000) {
    const message = "Duplicate field value entered";
    error = { ...error, message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
    error = { ...error, message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { ...error, message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { ...error, message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};

export default errorHandler;
