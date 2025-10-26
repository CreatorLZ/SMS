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
exports.updatePasswordPolicy = exports.getPasswordPolicy = exports.logPasswordValidationFailure = exports.validatePassword = void 0;
const AuditLog_1 = require("../models/AuditLog");
// Default password policy
const DEFAULT_POLICY = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    blacklistCommonPasswords: true,
    preventSequentialChars: true,
    preventRepeatedChars: true,
    maxRepeatedChars: 3,
    maxSequentialChars: 3,
};
// Common passwords blacklist (can be expanded)
const COMMON_PASSWORDS = [
    "password",
    "password123",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "password1",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "1234567890",
    "password1234",
    "qwerty123",
    "admin123",
    "root",
    "user",
    "guest",
    "test",
    "demo",
];
/**
 * Validates a password against comprehensive security rules
 * @param password - The password to validate
 * @param policy - Optional custom password policy (uses default if not provided)
 * @returns PasswordValidationResult with validation status and error messages
 */
const validatePassword = (password, policy = {}) => {
    const effectivePolicy = Object.assign(Object.assign({}, DEFAULT_POLICY), policy);
    const errors = [];
    // Check minimum length
    if (password.length < effectivePolicy.minLength) {
        errors.push(`Password must be at least ${effectivePolicy.minLength} characters long`);
    }
    // Check for uppercase letters
    if (effectivePolicy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    // Check for lowercase letters
    if (effectivePolicy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    // Check for numbers
    if (effectivePolicy.requireNumbers && !/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    // Check for special characters
    if (effectivePolicy.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
        errors.push("Password must contain at least one special character (!@#$%^&*)");
    }
    // Check against common passwords
    if (effectivePolicy.blacklistCommonPasswords) {
        const lowerPassword = password.toLowerCase();
        if (COMMON_PASSWORDS.includes(lowerPassword)) {
            errors.push("Password is too common. Please choose a more unique password");
        }
    }
    // Check for sequential characters
    if (effectivePolicy.preventSequentialChars) {
        if (hasSequentialChars(password, effectivePolicy.maxSequentialChars)) {
            errors.push(`Password cannot contain more than ${effectivePolicy.maxSequentialChars} sequential characters`);
        }
    }
    // Check for repeated characters
    if (effectivePolicy.preventRepeatedChars) {
        if (hasRepeatedChars(password, effectivePolicy.maxRepeatedChars)) {
            errors.push(`Password cannot contain more than ${effectivePolicy.maxRepeatedChars} repeated characters`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.validatePassword = validatePassword;
/**
 * Checks if password contains sequential characters (e.g., abc, 123, xyz)
 */
const hasSequentialChars = (password, maxSequential) => {
    const lowerPassword = password.toLowerCase();
    // Check alphabetical sequences
    for (let i = 0; i <= lowerPassword.length - maxSequential; i++) {
        const sequence = lowerPassword.slice(i, i + maxSequential);
        if (isAlphabeticalSequence(sequence)) {
            return true;
        }
    }
    // Check numerical sequences
    for (let i = 0; i <= password.length - maxSequential; i++) {
        const sequence = password.slice(i, i + maxSequential);
        if (isNumericalSequence(sequence)) {
            return true;
        }
    }
    return false;
};
/**
 * Checks if a string is an alphabetical sequence (e.g., abc, xyz)
 */
const isAlphabeticalSequence = (str) => {
    for (let i = 0; i < str.length - 1; i++) {
        if (str.charCodeAt(i + 1) !== str.charCodeAt(i) + 1) {
            return false;
        }
    }
    return true;
};
/**
 * Checks if a string is a numerical sequence (e.g., 123, 456)
 */
const isNumericalSequence = (str) => {
    if (!/^\d+$/.test(str))
        return false;
    for (let i = 0; i < str.length - 1; i++) {
        if (parseInt(str[i + 1]) !== parseInt(str[i]) + 1) {
            return false;
        }
    }
    return true;
};
/**
 * Checks if password contains repeated characters (e.g., aaa, 111)
 */
const hasRepeatedChars = (password, maxRepeated) => {
    for (let i = 0; i <= password.length - maxRepeated; i++) {
        const char = password[i];
        let count = 1;
        for (let j = i + 1; j < password.length && password[j] === char; j++) {
            count++;
            if (count > maxRepeated) {
                return true;
            }
        }
    }
    return false;
};
/**
 * Logs password validation failures for security monitoring
 * @param userId - User ID (null for registration attempts)
 * @param email - Email address
 * @param errors - Validation errors
 * @param req - Express request object for IP/User-Agent logging
 */
const logPasswordValidationFailure = (userId, email, errors, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield AuditLog_1.AuditLog.create({
            userId,
            actionType: "PASSWORD_VALIDATION_FAILED",
            description: `Password validation failed for ${email || "unknown user"}`,
            targetId: userId,
            metadata: {
                email,
                errors,
                ip: req === null || req === void 0 ? void 0 : req.ip,
                userAgent: (_a = req === null || req === void 0 ? void 0 : req.get) === null || _a === void 0 ? void 0 : _a.call(req, "User-Agent"),
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        // Log to console if database logging fails
        console.error("Failed to log password validation failure:", error);
    }
});
exports.logPasswordValidationFailure = logPasswordValidationFailure;
/**
 * Gets the current password policy configuration
 * This can be extended to load from database/environment variables
 */
const getPasswordPolicy = () => {
    return DEFAULT_POLICY;
};
exports.getPasswordPolicy = getPasswordPolicy;
/**
 * Updates the password policy (for future admin configuration)
 * @param newPolicy - New password policy settings
 */
const updatePasswordPolicy = (newPolicy) => {
    // In a real implementation, this would save to database
    // For now, just update the default policy
    Object.assign(DEFAULT_POLICY, newPolicy);
    return DEFAULT_POLICY;
};
exports.updatePasswordPolicy = updatePasswordPolicy;
