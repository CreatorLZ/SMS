import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  name: string; // e.g., "2024/2025"
  startYear: number; // e.g., 2024
  endYear: number; // e.g., 2025
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Session name is required"],
      unique: true,
      trim: true,
    },
    startYear: {
      type: Number,
      required: [true, "Start year is required"],
    },
    endYear: {
      type: Number,
      required: [true, "End year is required"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique year combinations
SessionSchema.index({ startYear: 1, endYear: 1 }, { unique: true });

export default mongoose.model<ISession>("Session", SessionSchema);
