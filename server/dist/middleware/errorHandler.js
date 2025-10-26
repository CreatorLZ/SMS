"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuditLog_1 = require("../models/AuditLog");
const errorHandler = (err, req, res, next) => {
    var _a;
    let error = Object.assign({}, err);
    error.message = err.message;
    // Log error
    console.error(err);
    // Log to audit log (only if user is authenticated)
    if ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) {
        AuditLog_1.AuditLog.create({
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
        error = Object.assign(Object.assign({}, error), { message, statusCode: 404 });
    }
    // Mongoose duplicate key
    if (err.name === "MongoError" && err.code === 11000) {
        const message = "Duplicate field value entered";
        error = Object.assign(Object.assign({}, error), { message, statusCode: 400 });
    }
    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
        error = Object.assign(Object.assign({}, error), { message, statusCode: 400 });
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token";
        error = Object.assign(Object.assign({}, error), { message, statusCode: 401 });
    }
    if (err.name === "TokenExpiredError") {
        const message = "Token expired";
        error = Object.assign(Object.assign({}, error), { message, statusCode: 401 });
    }
    res.status(error.statusCode || 500).json(Object.assign({ success: false, message: error.message || "Server Error" }, (process.env.NODE_ENV === "development" && {
        stack: err.stack,
        error: err,
    })));
};
exports.default = errorHandler;
