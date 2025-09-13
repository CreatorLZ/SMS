// src/models/FeeSyncLog.ts
import mongoose, { Schema } from "mongoose";

const feeSyncLogSchema = new Schema(
  {
    operationId: { type: String, required: true, unique: true },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    termId: { type: Schema.Types.ObjectId, ref: "Term" },
    enqueuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    summary: { type: Object },
    status: {
      type: String,
      enum: ["enqueued", "running", "completed", "failed"],
      default: "enqueued",
    },
    syncErrors: { type: Array },
  },
  { timestamps: true }
);

export const FeeSyncLog = mongoose.model("FeeSyncLog", feeSyncLogSchema);
