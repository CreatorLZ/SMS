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
  subjects: Schema.Types.ObjectId[];
}

// Define allowed classroom names
const ALLOWED_CLASSROOMS = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS1",
  "JSS2",
  "JSS3",
  "SS1 SCIENCE",
  "SS1 COMMERCIAL",
  "SS1 ART",
  "SS2 SCIENCE",
  "SS2 COMMERCIAL",
  "SS2 ART",
  "SS3 SCIENCE",
  "SS3 COMMERCIAL",
  "SS3 ART",
];

const classroomSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      unique: true,
      trim: true,
      enum: {
        values: ALLOWED_CLASSROOMS,
        message: "Class name must be one of the predefined options",
      },
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
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
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
export { ALLOWED_CLASSROOMS };
