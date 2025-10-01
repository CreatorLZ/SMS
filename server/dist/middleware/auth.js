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
exports.setPermissions = exports.requireAllPermissions = exports.requireAnyPermission = exports.requirePermission = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const permissions_1 = require("../utils/permissions");
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
            return res
                .status(401)
                .json({ message: "Not authorized to access this route" });
        }
        const token = authHeader.split(" ")[1];
        // Verify token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        }
        catch (error) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        // Get user from token
        const user = yield User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        // Add user to request object
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Not authorized to access this route" });
    }
});
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        var _a;
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || "undefined"} is not authorized to access this route`,
            });
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Middleware to check if user has specific permission
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!(0, permissions_1.hasPermission)(req.user.role, permission)) {
            return res.status(403).json({
                message: `Insufficient permissions. Required: ${permission}`,
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has any of the specified permissions
 */
const requireAnyPermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!(0, permissions_1.hasAnyPermission)(req.user.role, permissions)) {
            return res.status(403).json({
                message: `Insufficient permissions. Required one of: ${permissions.join(", ")}`,
            });
        }
        next();
    };
};
exports.requireAnyPermission = requireAnyPermission;
/**
 * Middleware to check if user has all of the specified permissions
 */
const requireAllPermissions = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userPermissions = (0, permissions_1.getRolePermissions)(req.user.role);
        const hasAllRequired = permissions.every((permission) => userPermissions.includes(permission));
        if (!hasAllRequired) {
            return res.status(403).json({
                message: `Insufficient permissions. Required all of: ${permissions.join(", ")}`,
            });
        }
        next();
    };
};
exports.requireAllPermissions = requireAllPermissions;
/**
 * Middleware to set user permissions on request object
 */
const setPermissions = (req, res, next) => {
    if (req.user) {
        req.permissions = (0, permissions_1.getRolePermissions)(req.user.role);
    }
    next();
};
exports.setPermissions = setPermissions;
