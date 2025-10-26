import { Request, Response, NextFunction } from "express";
import { validateCSRFToken } from "../utils/csrf";
import { AuditLog } from "../models/AuditLog";

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const tokenFromCookie = req.cookies.csrfToken;
  const tokenFromRequest =
    (req.headers["x-csrf-token"] as string) || req.body.csrfToken;

  if (!validateCSRFToken(tokenFromRequest, tokenFromCookie)) {
    // Log CSRF validation failure
    AuditLog.create({
      userId: req.user?._id || null,
      actionType: "CSRF_VALIDATION_FAILED",
      description: `CSRF validation failed for ${req.method} ${req.path}`,
      targetId: req.user?._id || null,
      metadata: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
        method: req.method,
        outcome: "failure",
        reason: "csrf_token_invalid",
        email: req.user?.email,
        role: req.user?.role,
        csrfTokenProvided: !!tokenFromRequest,
        csrfCookiePresent: !!tokenFromCookie,
      },
    }).catch((error) => console.error("Failed to log CSRF failure:", error));

    res.status(403).json({ error: "CSRF token validation failed" });
    return;
  }

  next();
};
