import mongoose, { Document, Schema } from "mongoose";

export interface IClassroom extends Document {
  name: string;
  teacherId: Schema.Types.ObjectId;
  timetable: {
    day: string;
    subject: string;
    time: string;
  }[];
  students: Schema.Types.ObjectId[];
}

const classroomSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      unique: true,
      trim: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    timetable: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          required: [true, "Day is required"],
        },
        subject: {
          type: String,
          required: [true, "Subject is required"],
        },
        time: {
          type: String,
          required: [true, "Time is required"],
        },
      },
    ],
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
classroomSchema.index({ teacherId: 1 });

export const Classroom = mongoose.model<IClassroom>(
  "Classroom",
  classroomSchema
);
