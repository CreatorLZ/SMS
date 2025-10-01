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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const subjectSchema = new mongoose_1.Schema({
    // Remove unique constraint from name field - allow same subject at different levels
    name: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ["Core", "Science", "Humanities", "Business", "Trade", "Optional"],
        required: true,
    },
    level: {
        type: String,
        enum: ["Primary", "Junior Secondary", "Senior Secondary"],
        required: true,
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
// Create indexes for faster queries
subjectSchema.index({ category: 1, level: 1 });
subjectSchema.index({ isActive: 1 });
// Compound unique index: same subject name can exist at different levels
subjectSchema.index({ name: 1, level: 1 }, { unique: true });
exports.Subject = mongoose_1.default.model("Subject", subjectSchema);
