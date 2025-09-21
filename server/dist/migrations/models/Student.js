"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
var mongoose_1 = require("mongoose");
var studentSchema = new mongoose_1.Schema({
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
    // Keep fullName for backward compatibility during migration
    fullName: {
        type: String,
        required: [true, "Full name is required"],
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
            year: {
                type: Number,
                required: [true, "Year is required"],
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
                    score: {
                        type: Number,
                        required: [true, "Score is required"],
                        min: [0, "Score cannot be less than 0"],
                        max: [100, "Score cannot be more than 100"],
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
        this.fullName = "".concat(this.firstName, " ").concat(this.lastName);
    }
    next();
});
studentSchema.pre("findOneAndUpdate", function (next) {
    var update = this.getUpdate();
    if (update.firstName && update.lastName) {
        update.fullName = "".concat(update.firstName, " ").concat(update.lastName);
    }
    else if (update.firstName || update.lastName) {
        // If only one name is being updated, get the other from the document
        this.model.findOne(this.getQuery()).then(function (doc) {
            if (doc) {
                var firstName = update.firstName || doc.firstName;
                var lastName = update.lastName || doc.lastName;
                update.fullName = "".concat(firstName, " ").concat(lastName);
            }
        });
    }
    next();
});
// index for faster queries
studentSchema.index({ currentClass: 1 });
exports.Student = mongoose_1.default.model("Student", studentSchema);
