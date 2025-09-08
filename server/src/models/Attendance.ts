import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  classroomId: Schema.Types.ObjectId;
  date: Date;
  records: {
    studentId: Schema.Types.ObjectId;
    status: "present" | "absent" | "late";
  }[];
  markedBy: Schema.Types.ObjectId;
}

const attendanceSchema = new Schema(
  {
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: [true, "Classroom ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    records: [
      {
        studentId: {
          type: Schema.Types.ObjectId,
          ref: "Student",
          required: [true, "Student ID is required"],
        },
        status: {
          type: String,
          enum: ["present", "absent", "late"],
          required: [true, "Status is required"],
        },
      },
    ],
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Marked by is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness: one attendance record per classroom per date
attendanceSchema.index({ classroomId: 1, date: 1 }, { unique: true });

// Create indexes for faster queries
attendanceSchema.index({ classroomId: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ markedBy: 1 });

export const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema
);
