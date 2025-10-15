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
exports.devSuperAdminLogin = exports.refresh = exports.getCurrentUser = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
// Token generation helpers
const generateAccessToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
    }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
};
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
    }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};
// @desc    Register a new user (admin/superadmin only)
// @route   POST /api/auth/register
// @access  Private/Admin
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role } = req.body;
        // Validate role based on who's registering
        const isAllowed = req.user.role === "superadmin" ||
            (req.user.role === "admin" && !["superadmin", "admin"].includes(role));
        if (!isAllowed) {
            return res.status(403).json({
                message: "You are not authorized to create users with this role",
            });
        }
        // Check if user exists
        const userExists = yield User_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Create user
        const user = yield User_1.User.create({
            name,
            email,
            password,
            role,
            verified: true, // Auto-verify since admin is creating
        });
        // Log the action
        yield AuditLog_1.AuditLog.create({
            userId: req.user._id,
            actionType: "USER_CREATE",
            description: `Created new ${role} account for ${name}`,
            targetId: user._id,
        });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.register = register;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Check for user and include password field
        const user = yield User_1.User.findOne({ email }).select("+password +refreshTokens");
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Check password
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Clear existing refresh tokens for this user
        user.refreshTokens = [];
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        // Store refresh token
        user.refreshTokens.push(refreshToken);
        yield user.save();
        // Set refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.login = login;
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            // Remove refresh token from user
            yield User_1.User.updateOne({ _id: req.user._id }, { $pull: { refreshTokens: refreshToken } });
            // Clear cookie
            res.clearCookie("refreshToken");
        }
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.logout = logout;
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getCurrentUser = getCurrentUser;
// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (with refresh token)
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }
        // Verify refresh token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        }
        catch (error) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        // Check if user exists and token is in their refresh tokens
        const user = yield User_1.User.findById(decoded.id).select("+refreshTokens");
        if (!user || !user.refreshTokens.includes(refreshToken)) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        // Generate new tokens (rotation)
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        // Update refresh tokens (rotation) - replace all tokens with just the new one to prevent accumulation
        user.refreshTokens = [newRefreshToken];
        yield user.save();
        // Set new refresh token cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({
            message: "Token refresh successful",
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.refresh = refresh;
// Development only route to get super admin tokens
const devSuperAdminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow in development mode
        if (process.env.NODE_ENV === "production") {
            res.status(404).json({ message: "Route not found" });
            return;
        }
        const superAdmin = yield User_1.User.findOne({ role: "superadmin" });
        if (!superAdmin) {
            res.status(404).json({ message: "Super admin not found" });
            return;
        }
        // Generate tokens
        const accessToken = generateAccessToken(superAdmin);
        const refreshToken = generateRefreshToken(superAdmin);
        // Add refresh token to user's refreshTokens array (clear existing first)
        superAdmin.refreshTokens = [refreshToken];
        yield superAdmin.save();
        // Set refresh token cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // Since this is dev-only
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // Return tokens
        res.status(200).json({
            message: "Dev super admin login successful",
            accessToken,
            user: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.devSuperAdminLogin = devSuperAdminLogin;
