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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false,
    },
    role: {
        type: String,
        enum: ["superadmin", "admin", "teacher", "staff", "student", "parent"],
        required: [true, "Role is required"],
    },
    verified: {
        type: Boolean,
        default: false,
    },
    refreshTokens: [
        {
            type: String,
            select: false,
        },
    ],
    linkedStudentIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Student",
        },
    ],
    assignedClassId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Classroom",
    },
    assignedClasses: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: "Classroom",
        default: [],
    },
    subjectSpecializations: [
        {
            type: String,
            required: false,
            trim: true,
        },
    ],
    // Keep for backward compatibility
    subjectSpecialization: {
        type: String,
        required: false,
        trim: true,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    passportPhoto: {
        type: String,
        required: false,
        trim: true,
    },
    phone: {
        type: String,
        required: false,
        trim: true,
    },
    // Additional teacher information fields
    dateOfBirth: {
        type: Date,
        required: false,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: false,
    },
    nationality: {
        type: String,
        required: false,
        trim: true,
        default: "Nigerian",
    },
    stateOfOrigin: {
        type: String,
        required: false,
        trim: true,
    },
    localGovernmentArea: {
        type: String,
        required: false,
        trim: true,
    },
    address: {
        type: String,
        required: false,
        trim: true,
    },
    alternativePhone: {
        type: String,
        required: false,
        trim: true,
    },
    personalEmail: {
        type: String,
        required: false,
        lowercase: true,
        trim: true,
    },
    emergencyContact: {
        name: {
            type: String,
            required: false,
            trim: true,
        },
        relationship: {
            type: String,
            required: false,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: false,
            trim: true,
        },
    },
    qualification: {
        type: String,
        required: false,
        trim: true,
    },
    yearsOfExperience: {
        type: Number,
        required: false,
        min: 0,
    },
    previousSchool: {
        type: String,
        required: false,
        trim: true,
    },
    employmentStartDate: {
        type: Date,
        required: false,
    },
    // Optional professional development fields
    teachingLicenseNumber: {
        type: String,
        required: false,
        trim: true,
    },
    employmentType: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract"],
        required: false,
        default: "Full-time",
    },
    maritalStatus: {
        type: String,
        enum: ["Single", "Married", "Divorced", "Widowed"],
        required: false,
    },
    nationalIdNumber: {
        type: String,
        required: false,
        trim: true,
    },
    bankInformation: {
        bankName: {
            type: String,
            required: false,
            trim: true,
        },
        accountNumber: {
            type: String,
            required: false,
            trim: true,
        },
        accountName: {
            type: String,
            required: false,
            trim: true,
        },
    },
    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: false,
    },
    knownAllergies: {
        type: String,
        required: false,
        trim: true,
    },
    medicalConditions: {
        type: String,
        required: false,
        trim: true,
    },
}, {
    timestamps: true,
});
// Hash password before saving
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next();
        try {
            const salt = yield bcrypt_1.default.genSalt(12);
            this.password = yield bcrypt_1.default.hash(this.password, salt);
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcrypt_1.default.compare(candidatePassword, this.password);
        }
        catch (error) {
            return false;
        }
    });
};
// Remove sensitive fields when converting to JSON
userSchema.set("toJSON", {
    transform: function (doc, ret) {
        if (ret.password)
            delete ret.password;
        if (ret.refreshTokens)
            delete ret.refreshTokens;
        return ret;
    },
});
exports.User = mongoose_1.default.model("User", userSchema);
