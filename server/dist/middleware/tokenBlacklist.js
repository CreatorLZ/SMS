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
exports.blacklistAllUserTokens = exports.blacklistToken = exports.checkTokenBlacklist = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const TokenBlacklist_1 = require("../models/TokenBlacklist");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Middleware to check if the access token is blacklisted
 * Should be used after the protect middleware
 */
const checkTokenBlacklist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        // Check if token is blacklisted
        const blacklistedToken = yield TokenBlacklist_1.TokenBlacklist.findOne({ token });
        if (blacklistedToken) {
            return res.status(401).json({
                message: "Token has been revoked",
                error: "TOKEN_REVOKED",
            });
        }
        next();
    }
    catch (error) {
        console.error("Token blacklist check error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.checkTokenBlacklist = checkTokenBlacklist;
/**
 * Utility function to blacklist a token
 */
const blacklistToken = (token, userId, reason, blacklistedBy) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Decode token to get expiration time
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp) {
            throw new Error("Invalid token format");
        }
        const expiresAt = new Date(decoded.exp * 1000); // JWT exp is in seconds
        yield TokenBlacklist_1.TokenBlacklist.create({
            token,
            userId: new mongoose_1.default.Types.ObjectId(userId),
            expiresAt,
            reason,
            blacklistedBy: blacklistedBy
                ? new mongoose_1.default.Types.ObjectId(blacklistedBy)
                : undefined,
        });
    }
    catch (error) {
        console.error("Error blacklisting token:", error);
        throw error;
    }
});
exports.blacklistToken = blacklistToken;
/**
 * Utility function to blacklist all tokens for a user
 */
const blacklistAllUserTokens = (userId, reason, blacklistedBy) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // This would require getting all active tokens for the user
        // For now, we'll implement this when we have a way to track active tokens
        // For logout, we can blacklist the current token
        console.log(`Blacklisting all tokens for user ${userId} with reason: ${reason}`);
    }
    catch (error) {
        console.error("Error blacklisting all user tokens:", error);
        throw error;
    }
});
exports.blacklistAllUserTokens = blacklistAllUserTokens;
