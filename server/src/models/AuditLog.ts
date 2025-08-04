import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  userId: Schema.Types.ObjectId;
  actionType: string;
  description: string;
  targetId?: Schema.Types.ObjectId;
  timestamp: Date;
}

const auditLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  actionType: {
    type: String,
    required: [true, "Action type is required"],
    enum: [
      "USER_CREATE",
      "USER_UPDATE",
      "USER_DELETE",
      "RESULT_CREATE",
      "RESULT_UPDATE",
      "ATTENDANCE_MARK",
      "FEES_UPDATE",
      "CLASS_ASSIGN",
      "PIN_GENERATE",
      "PIN_REVOKE",
    ],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for faster queries
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ actionType: 1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
