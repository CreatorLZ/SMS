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
exports.ALLOWED_CLASSROOMS = exports.Classroom = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define allowed classroom names
const ALLOWED_CLASSROOMS = [
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JSS1",
    "JSS2",
    "JSS3",
    "SS1 SCIENCE",
    "SS1 COMMERCIAL",
    "SS1 ART",
    "SS2 SCIENCE",
    "SS2 COMMERCIAL",
    "SS2 ART",
    "SS3 SCIENCE",
    "SS3 COMMERCIAL",
    "SS3 ART",
];
exports.ALLOWED_CLASSROOMS = ALLOWED_CLASSROOMS;
const classroomSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Class name is required"],
        unique: true,
        trim: true,
        enum: {
            values: ALLOWED_CLASSROOMS,
            message: "Class name must be one of the predefined options",
        },
    },
    teacherId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Teacher is required"],
    },
    timetable: [
        {
            day: {
                type: String,
                enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                required: [true, "Day is required"],
            },
            subject: {
                type: String,
                required: [true, "Subject is required"],
            },
            time: {
                type: String,
                required: [true, "Time is required"],
            },
        },
    ],
    students: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Student",
        },
    ],
    subjects: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Subject",
        },
    ],
}, {
    timestamps: true,
});
// Create index for faster queries
classroomSchema.index({ teacherId: 1 });
exports.Classroom = mongoose_1.default.model("Classroom", classroomSchema);
