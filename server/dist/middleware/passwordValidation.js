"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.validatePasswordResetMiddleware = exports.validatePasswordMiddleware = void 0;
const passwordValidation_1 = require("../utils/passwordValidation");
/**
 * Middleware to validate password strength for password change/reset endpoints
 * This middleware should be used on routes that accept password changes
 */
const validatePasswordMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { password } = req.body;
        // Skip validation if no password provided
        if (!password) {
            return next();
        }
        // Validate password strength
        const passwordValidation = (0, passwordValidation_1.validatePassword)(password);
        if (!passwordValidation.isValid) {
            // Log password validation failure
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) || null;
            const email = ((_d = req.user) === null || _d === void 0 ? void 0 : _d.email) || req.body.email || null;
            yield (0, passwordValidation_1.logPasswordValidationFailure)(userId, email, passwordValidation.errors, req);
            res.status(400).json({
                message: "Password does not meet security requirements",
                errors: passwordValidation.errors,
            });
            return;
        }
        // Password is valid, proceed
        next();
    }
    catch (error) {
        console.error("Password validation middleware error:", error);
        res.status(500).json({
            message: "Server error during password validation",
            error: error.message,
        });
    }
});
exports.validatePasswordMiddleware = validatePasswordMiddleware;
/**
 * Middleware specifically for password reset endpoints
 * Validates new password and ensures it differs from current password if user is authenticated
 */
const validatePasswordResetMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { password, currentPassword } = req.body;
        // Skip validation if no password provided
        if (!password) {
            return next();
        }
        // Validate password strength
        const passwordValidation = (0, passwordValidation_1.validatePassword)(password);
        if (!passwordValidation.isValid) {
            // Log password validation failure
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) || null;
            const email = ((_d = req.user) === null || _d === void 0 ? void 0 : _d.email) || req.body.email || null;
            yield (0, passwordValidation_1.logPasswordValidationFailure)(userId, email, passwordValidation.errors, req);
            res.status(400).json({
                message: "New password does not meet security requirements",
                errors: passwordValidation.errors,
            });
            return;
        }
        // If user is authenticated and provided current password, verify it
        if (req.user && currentPassword) {
            const { User } = yield Promise.resolve().then(() => __importStar(require("../models/User")));
            const user = yield User.findById(req.user.id || req.user._id).select("+password");
            if (user) {
                const isCurrentPasswordValid = yield user.comparePassword(currentPassword);
                if (!isCurrentPasswordValid) {
                    res.status(400).json({
                        message: "Current password is incorrect",
                    });
                    return;
                }
                // Check if new password is different from current
                const isSamePassword = yield user.comparePassword(password);
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
    }
    catch (error) {
        console.error("Password reset validation middleware error:", error);
        res.status(500).json({
            message: "Server error during password validation",
            error: error.message,
        });
    }
});
exports.validatePasswordResetMiddleware = validatePasswordResetMiddleware;
