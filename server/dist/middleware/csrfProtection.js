"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
const csrf_1 = require("../utils/csrf");
const AuditLog_1 = require("../models/AuditLog");
const csrfProtection = (req, res, next) => {
    var _a, _b, _c, _d;
    const tokenFromCookie = req.cookies.csrfToken;
    const tokenFromRequest = req.headers["x-csrf-token"] || req.body.csrfToken;
    if (!(0, csrf_1.validateCSRFToken)(tokenFromRequest, tokenFromCookie)) {
        // Log CSRF validation failure
        AuditLog_1.AuditLog.create({
            userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || null,
            actionType: "CSRF_VALIDATION_FAILED",
            description: `CSRF validation failed for ${req.method} ${req.path}`,
            targetId: ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) || null,
            metadata: {
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                endpoint: req.originalUrl,
                method: req.method,
                outcome: "failure",
                reason: "csrf_token_invalid",
                email: (_c = req.user) === null || _c === void 0 ? void 0 : _c.email,
                role: (_d = req.user) === null || _d === void 0 ? void 0 : _d.role,
                csrfTokenProvided: !!tokenFromRequest,
                csrfCookiePresent: !!tokenFromCookie,
            },
        }).catch((error) => console.error("Failed to log CSRF failure:", error));
        res.status(403).json({ error: "CSRF token validation failed" });
        return;
    }
    next();
};
exports.csrfProtection = csrfProtection;
