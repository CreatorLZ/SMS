import mongoose, { Document, Schema } from "mongoose";

export interface IFeeStructure extends Document {
  classroomId: Schema.Types.ObjectId;
  termId: Schema.Types.ObjectId;
  amount: number;
  isActive: boolean;
  deletedAt?: Date;
  deletedBy?: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const feeStructureSchema = new Schema(
  {
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: [true, "Classroom ID is required"],
    },
    termId: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: [true, "Term ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Fee amount is required"],
      min: [0, "Fee amount cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Updated by is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index for classroomId + termId
feeStructureSchema.index({ classroomId: 1, termId: 1 }, { unique: true });

export const FeeStructure = mongoose.model<IFeeStructure>(
  "FeeStructure",
  feeStructureSchema
);
