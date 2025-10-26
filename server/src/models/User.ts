import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../types/auth.types";

const userSchema = new Schema(
  {
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
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    assignedClasses: {
      type: [Schema.Types.ObjectId],
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
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      required: false,
    },
    lastFailedLogin: {
      type: Date,
      required: false,
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
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Remove sensitive fields when converting to JSON
userSchema.set("toJSON", {
  transform: function (doc: mongoose.Document, ret: any) {
    if (ret.password) delete ret.password;
    if (ret.refreshTokens) delete ret.refreshTokens;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
