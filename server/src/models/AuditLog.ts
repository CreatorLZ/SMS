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
      "STUDENT_CREATE",
      "STUDENT_UPDATE",
      "STUDENT_ACTIVATE",
      "STUDENT_DEACTIVATE",
      "TEACHER_CREATE",
      "TEACHER_UPDATE",
      "TEACHER_DELETE",
      "RESULT_CREATE",
      "RESULT_UPDATE",
      "ATTENDANCE_MARKED",
      "ATTENDANCE_UPDATED",
      "ATTENDANCE_DELETED",
      "FEES_UPDATE",
      "CLASS_ASSIGN",
      "PIN_GENERATE",
      "PIN_REVOKE",
      "CLASSROOM_CREATE",
      "CLASSROOM_UPDATE",
      "CLASSROOM_DELETE",
      "STUDENTS_ASSIGN",
      "STUDENTS_REMOVED_FROM_CLASSROOM",
      "CLASSROOM_SUBJECT_REMOVE",
      "CLASSROOM_SUBJECTS_ASSIGN",
      "SUBJECT_ACTIVATE",
      "SUBJECT_DEACTIVATE",
      "SUBJECT_CREATE",
      "SUBJECT_UPDATE",
      "TERM_CREATE",
      "TERM_ACTIVATE",
      "TERM_UPDATE",
      "HOLIDAY_CREATE",
      "HOLIDAY_UPDATE",
      "TIMETABLE_SAVED",
      "TIMETABLE_UPDATED",
      "TIMETABLE_DELETED",
      "FEE_STRUCTURE_UPDATE",
      "FEE_PAYMENT",
      "TERM_DEACTIVATE",
      "STUDENT_PHOTO_UPDATE",
      "CLASSROOM_TEACHER_REASSIGN",
      "RESULT_SUBMIT",
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
