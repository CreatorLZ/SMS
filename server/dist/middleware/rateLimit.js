"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRateLimiter = exports.failedLoginRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const AuditLog_1 = require("../models/AuditLog");
// Standard login rate limiter: 5 attempts per 15 minutes per IP
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: "Too many login attempts from this IP, please try again after 15 minutes.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Log rate limit violation
        try {
            yield AuditLog_1.AuditLog.create({
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
        }
        catch (error) {
            console.error("Failed to log rate limit violation:", error);
        }
        res.status(429).json({
            error: "Too many login attempts from this IP, please try again after 15 minutes.",
        });
    }),
});
// Failed login rate limiter: 10 attempts per hour per IP
exports.failedLoginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 failed login attempts per windowMs
    message: {
        error: "Too many failed login attempts from this IP, please try again after 1 hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed requests
    skip: (req) => {
        // Skip if login was successful (we'll check this in the controller)
        return req.body && req.body.success === true;
    },
    handler: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield AuditLog_1.AuditLog.create({
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
        }
        catch (error) {
            console.error("Failed to log rate limit violation:", error);
        }
        res.status(429).json({
            error: "Too many failed login attempts from this IP, please try again after 1 hour.",
        });
    }),
});
// Account-specific rate limiter: 3 failed attempts per 5 minutes per account
exports.accountRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each account to 3 failed login attempts per windowMs
    message: {
        error: "Too many failed login attempts for this account, please try again after 5 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        var _a;
        // Use email as the key for account-specific limiting
        return ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || req.ip;
    },
    skipSuccessfulRequests: true,
    skip: (req) => {
        return req.body && req.body.success === true;
    },
    handler: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            yield AuditLog_1.AuditLog.create({
                userId: null,
                actionType: "RATE_LIMIT_VIOLATION",
                description: `Rate limit exceeded for account-specific login attempts: ${((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || "unknown"} from IP: ${req.ip}`,
                targetId: null,
                metadata: {
                    ip: req.ip,
                    email: (_b = req.body) === null || _b === void 0 ? void 0 : _b.email,
                    userAgent: req.get("User-Agent"),
                    endpoint: req.originalUrl,
                    method: req.method,
                },
            });
        }
        catch (error) {
            console.error("Failed to log rate limit violation:", error);
        }
        res.status(429).json({
            error: "Too many failed login attempts for this account, please try again after 5 minutes.",
        });
    }),
});
