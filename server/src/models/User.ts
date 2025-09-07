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
      enum: ["superadmin", "admin", "teacher", "student", "parent"],
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
    assignedClassId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
    },
    subjectSpecialization: {
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
