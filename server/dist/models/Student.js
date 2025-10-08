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
exports.Student = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const studentSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        set: function (v) {
            // Auto-capitalize first letter
            return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
        },
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        set: function (v) {
            // Auto-capitalize first letter
            return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
        },
    },
    // Keep fullName for backward compatibility - auto-generated from firstName + lastName
    fullName: {
        type: String,
        required: false, // Not required since it's auto-generated from firstName + lastName
        trim: true,
    },
    studentId: {
        type: String,
        required: [true, "Student ID is required"],
        unique: true,
        trim: true,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        trim: true,
    },
    passportPhoto: {
        type: String, // URL of uploaded passport photo
    },
    emergencyContact: {
        name: {
            type: String,
            required: true,
        },
        relationship: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
    },
    parentName: {
        type: String,
        required: true,
    },
    parentPhone: {
        type: String,
        required: true,
    },
    parentEmail: {
        type: String,
    },
    relationshipToStudent: {
        type: String,
        enum: ["Father", "Mother", "Guardian"],
        required: true,
    },
    currentClass: {
        type: String,
        required: [true, "Current class is required"],
        trim: true,
    },
    classroomId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Classroom",
        required: false,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    status: {
        type: String,
        enum: ["active", "inactive", "graduated", "transferred"],
        default: "active",
    },
    admissionDate: {
        type: Date,
        default: Date.now,
    },
    termFees: [
        {
            term: {
                type: String,
                enum: ["1st", "2nd", "3rd"],
                required: [true, "Term is required"],
            },
            session: {
                type: String,
                required: [true, "Session is required"],
            },
            paid: {
                type: Boolean,
                default: false,
            },
            pinCode: {
                type: String,
                required: [true, "PIN code is required"],
            },
            viewable: {
                type: Boolean,
                default: false,
            },
            amount: {
                type: Number,
                required: [true, "Fee amount is required"],
                min: [0, "Fee amount cannot be negative"],
            },
            paymentDate: {
                type: Date,
            },
            paymentMethod: {
                type: String,
                enum: ["cash", "bank_transfer", "online", "check", "mobile_money"],
            },
            receiptNumber: {
                type: String,
            },
            updatedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
            },
        },
    ],
    results: [
        {
            term: {
                type: String,
                required: [true, "Term is required"],
            },
            year: {
                type: Number,
                required: [true, "Year is required"],
            },
            scores: [
                {
                    subject: {
                        type: String,
                        required: [true, "Subject is required"],
                    },
                    assessments: {
                        ca1: {
                            type: Number,
                            required: true,
                            min: [0, "CA1 score cannot be less than 0"],
                            max: [20, "CA1 score cannot be more than 20"],
                            default: 0,
                        },
                        ca2: {
                            type: Number,
                            required: true,
                            min: [0, "CA2 score cannot be less than 0"],
                            max: [20, "CA2 score cannot be more than 20"],
                            default: 0,
                        },
                        exam: {
                            type: Number,
                            required: true,
                            min: [0, "Exam score cannot be less than 0"],
                            max: [60, "Exam score cannot be more than 60"],
                            default: 0,
                        },
                    },
                    totalScore: {
                        type: Number,
                        required: true,
                        min: [0, "Total score cannot be less than 0"],
                        max: [100, "Total score cannot be more than 100"],
                    },
                },
            ],
            comment: {
                type: String,
                required: [true, "Teacher comment is required"],
            },
            updatedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: [true, "Updated by is required"],
            },
            updatedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, {
    timestamps: true,
});
// Pre-save hook to auto-generate fullName from firstName + lastName
studentSchema.pre("save", function (next) {
    if (this.firstName && this.lastName) {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
    next();
});
studentSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.firstName && update.lastName) {
        update.fullName = `${update.firstName} ${update.lastName}`;
    }
    else if (update.firstName || update.lastName) {
        // If only one name is being updated, get the other from the document
        this.model.findOne(this.getQuery()).then((doc) => {
            if (doc) {
                const firstName = update.firstName || doc.firstName;
                const lastName = update.lastName || doc.lastName;
                update.fullName = `${firstName} ${lastName}`;
            }
        });
    }
    next();
});
// index for faster queries
studentSchema.index({ currentClass: 1 });
exports.Student = mongoose_1.default.model("Student", studentSchema);
