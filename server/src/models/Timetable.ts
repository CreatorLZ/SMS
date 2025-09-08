import mongoose, { Document, Schema } from "mongoose";

export interface ITimetable extends Document {
  classroomId: Schema.Types.ObjectId;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  period: number; // 1-8
  subject: string;
  teacherId: Schema.Types.ObjectId;
  teacherName: string;
  startTime: string;
  endTime: string;
  classroom: string;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema: Schema = new Schema(
  {
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    classroom: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate schedules
TimetableSchema.index(
  { classroomId: 1, dayOfWeek: 1, period: 1 },
  { unique: true }
);

// Index for efficient queries
TimetableSchema.index({ teacherId: 1 });

export const Timetable = mongoose.model<ITimetable>(
  "Timetable",
  TimetableSchema
);
