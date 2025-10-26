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
exports.AuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const auditLogSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false, // Optional for system actions
    },
    actionType: {
        type: String,
        required: [true, "Action type is required"],
        enum: [
            "USER_CREATE",
            "USER_UPDATE",
            "USER_DELETE",
            "STUDENT_CREATE",
            "STUDENT_UPDATE",
            "STUDENT_ACTIVATE",
            "STUDENT_DEACTIVATE",
            "TEACHER_CREATE",
            "TEACHER_UPDATE",
            "TEACHER_DELETE",
            "RESULT_CREATE",
            "RESULT_UPDATE",
            "ATTENDANCE_MARKED",
            "ATTENDANCE_UPDATED",
            "ATTENDANCE_DELETED",
            "FEES_UPDATE",
            "CLASS_ASSIGN",
            "PIN_GENERATE",
            "PIN_REVOKE",
            "CLASSROOM_CREATE",
            "CLASSROOM_UPDATE",
            "CLASSROOM_DELETE",
            "STUDENTS_ASSIGN",
            "STUDENTS_REMOVED_FROM_CLASSROOM",
            "CLASSROOM_SUBJECT_REMOVE",
            "CLASSROOM_SUBJECTS_ASSIGN",
            "SUBJECT_ACTIVATE",
            "SUBJECT_DEACTIVATE",
            "SUBJECT_CREATE",
            "SUBJECT_UPDATE",
            "TERM_CREATE",
            "TERM_ACTIVATE",
            "TERM_UPDATE",
            "HOLIDAY_CREATE",
            "HOLIDAY_UPDATE",
            "TIMETABLE_SAVED",
            "TIMETABLE_UPDATED",
            "TIMETABLE_DELETED",
            "FEE_STRUCTURE_UPDATE",
            "FEE_PAYMENT",
            "TERM_DEACTIVATE",
            "STUDENT_PHOTO_UPDATE",
            "CLASSROOM_TEACHER_REASSIGN",
            "RESULT_SUBMIT",
            "FEE_RECONCILIATION",
            "FEE_AUTO_REPAIR",
            "SYSTEM_CLEANUP", // Add system cleanup action
            "ACCOUNT_LOCKOUT_CHECK",
            "ACCOUNT_LOCKOUT_EXPIRED",
            "ACCOUNT_LOCKOUT",
            "ACCOUNT_UNLOCK",
        ],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    targetId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});
// Create indexes for faster queries
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ actionType: 1 });
auditLogSchema.index({ timestamp: -1 });
exports.AuditLog = mongoose_1.default.model("AuditLog", auditLogSchema);
