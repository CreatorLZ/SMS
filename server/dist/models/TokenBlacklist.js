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
exports.TokenBlacklist = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const tokenBlacklistSchema = new mongoose_1.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    blacklistedAt: {
        type: Date,
        default: Date.now,
    },
    reason: {
        type: String,
        required: true,
        enum: ["logout", "suspicious_activity", "manual", "token_rotation"],
    },
    blacklistedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
}, {
    timestamps: true,
});
// Index for efficient cleanup of expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Static method to check if token is blacklisted
tokenBlacklistSchema.statics.isTokenBlacklisted = function (token) {
    return __awaiter(this, void 0, void 0, function* () {
        const blacklistedToken = yield this.findOne({ token });
        return !!blacklistedToken;
    });
};
// Static method to blacklist a token
tokenBlacklistSchema.statics.blacklistToken = function (token, userId, expiresAt, reason, blacklistedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        yield this.create({
            token,
            userId,
            expiresAt,
            reason,
            blacklistedBy,
        });
    });
};
// Static method to cleanup expired tokens (can be called periodically)
tokenBlacklistSchema.statics.cleanupExpiredTokens =
    function () {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.deleteMany({
                expiresAt: { $lt: new Date() },
            });
            return result.deletedCount;
        });
    };
exports.TokenBlacklist = mongoose_1.default.model("TokenBlacklist", tokenBlacklistSchema);
