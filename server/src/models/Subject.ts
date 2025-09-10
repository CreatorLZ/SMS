import mongoose, { Schema, Document } from "mongoose";

export interface ISubject extends Document {
  name: string;
  category:
    | "Core"
    | "Science"
    | "Humanities"
    | "Business"
    | "Trade"
    | "Optional";
  level: "Primary" | "Junior Secondary" | "Senior Secondary";
  isActive: boolean;
}

const subjectSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

// Create indexes for faster queries
subjectSchema.index({ category: 1, level: 1 });
subjectSchema.index({ isActive: 1 });
// Compound unique index: same subject name can exist at different levels
subjectSchema.index({ name: 1, level: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>("Subject", subjectSchema);
