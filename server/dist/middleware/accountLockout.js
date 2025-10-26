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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetFailedLoginAttempts = exports.handleFailedLogin = exports.checkAccountLockout = void 0;
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const lockoutConfig = {
    3: { attempts: 3, duration: 5 },
    5: { attempts: 5, duration: 15 },
    10: { attempts: 10, duration: 60 },
    15: { attempts: 15, duration: 1440 }, // 24 hours
};
const checkAccountLockout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return next();
        }
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            return next();
        }
        const now = new Date();
        // Check if account is currently locked
        if (user.lockoutUntil && user.lockoutUntil > now) {
            const remainingTime = Math.ceil((user.lockoutUntil.getTime() - now.getTime()) / (1000 * 60));
            // Log lockout check
            yield AuditLog_1.AuditLog.create({
                userId: user._id,
                actionType: "ACCOUNT_LOCKOUT_CHECK",
                description: `Account lockout check for user: ${email}`,
                targetId: user._id,
                metadata: {
                    email,
                    lockoutUntil: user.lockoutUntil,
                    remainingMinutes: remainingTime,
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                },
            });
            res.status(423).json({
                message: `Account is locked due to too many failed login attempts. Try again in ${remainingTime} minutes.`,
                lockoutUntil: user.lockoutUntil,
                remainingMinutes: remainingTime,
            });
            return;
        }
        // If lockout has expired, reset failed attempts
        if (user.lockoutUntil && user.lockoutUntil <= now) {
            user.failedLoginAttempts = 0;
            user.lockoutUntil = undefined;
            user.lastFailedLogin = undefined;
            yield user.save();
            // Log lockout expiry
            yield AuditLog_1.AuditLog.create({
                userId: user._id,
                actionType: "ACCOUNT_LOCKOUT_EXPIRED",
                description: `Account lockout expired for user: ${email}`,
                targetId: user._id,
                metadata: {
                    email,
                    previousLockoutUntil: user.lockoutUntil,
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                },
            });
        }
        next();
    }
    catch (error) {
        console.error("Account lockout middleware error:", error);
        res.status(500).json({ message: "Server error during lockout check" });
    }
});
exports.checkAccountLockout = checkAccountLockout;
const handleFailedLogin = (userId, email, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById(userId);
        if (!user)
            return;
        const now = new Date();
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        user.lastFailedLogin = now;
        // Determine lockout duration based on attempts
        let lockoutDuration = 0;
        for (const [attempts, config] of Object.entries(lockoutConfig)) {
            if (user.failedLoginAttempts >= parseInt(attempts)) {
                lockoutDuration = config.duration;
            }
        }
        if (lockoutDuration > 0) {
            user.lockoutUntil = new Date(now.getTime() + lockoutDuration * 60 * 1000);
            // Log account lockout
            yield AuditLog_1.AuditLog.create({
                userId: user._id,
                actionType: "ACCOUNT_LOCKOUT",
                description: `Account locked for user: ${email} after ${user.failedLoginAttempts} failed attempts`,
                targetId: user._id,
                metadata: {
                    email,
                    failedAttempts: user.failedLoginAttempts,
                    lockoutDuration,
                    lockoutUntil: user.lockoutUntil,
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                },
            });
        }
        yield user.save();
    }
    catch (error) {
        console.error("Failed login handling error:", error);
    }
});
exports.handleFailedLogin = handleFailedLogin;
const resetFailedLoginAttempts = (userId, email, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById(userId);
        if (!user)
            return;
        const wasLocked = user.lockoutUntil && user.lockoutUntil > new Date();
        user.failedLoginAttempts = 0;
        user.lockoutUntil = undefined;
        user.lastFailedLogin = undefined;
        yield user.save();
        // Log successful login and potential unlock
        if (wasLocked) {
            yield AuditLog_1.AuditLog.create({
                userId: user._id,
                actionType: "ACCOUNT_UNLOCK",
                description: `Account unlocked for user: ${email} after successful login`,
                targetId: user._id,
                metadata: {
                    email,
                    previousFailedAttempts: user.failedLoginAttempts,
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                },
            });
        }
    }
    catch (error) {
        console.error("Reset failed login attempts error:", error);
    }
});
exports.resetFailedLoginAttempts = resetFailedLoginAttempts;
