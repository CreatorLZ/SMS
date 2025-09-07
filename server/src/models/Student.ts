import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  fullName: string;
  studentId: string;
  currentClass: string;
  status: "active" | "inactive";
  termFees: {
    term: "1st" | "2nd" | "3rd";
    year: number;
    paid: boolean;
    pinCode: string;
    viewable: boolean;
  }[];
  attendance: {
    date: Date;
    status: "present" | "absent";
  }[];
  results: {
    term: string;
    year: number;
    scores: {
      subject: string;
      score: number;
    }[];
    comment: string;
    updatedBy: Schema.Types.ObjectId;
    updatedAt: Date;
  }[];
}

const studentSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      trim: true,
    },
    currentClass: {
      type: String,
      required: [true, "Current class is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    termFees: [
      {
        term: {
          type: String,
          enum: ["1st", "2nd", "3rd"],
          required: [true, "Term is required"],
        },
        year: {
          type: Number,
          required: [true, "Year is required"],
        },
        paid: {
          type: Boolean,
          default: false,
        },
        pinCode: {
          type: String,
          required: [true, "PIN code is required"],
        },
        viewable: {
          type: Boolean,
          default: false,
        },
      },
    ],
    attendance: [
      {
        date: {
          type: Date,
          required: [true, "Date is required"],
        },
        status: {
          type: String,
          enum: ["present", "absent"],
          required: [true, "Status is required"],
        },
      },
    ],
    results: [
      {
        term: {
          type: String,
          required: [true, "Term is required"],
        },
        year: {
          type: Number,
          required: [true, "Year is required"],
        },
        scores: [
          {
            subject: {
              type: String,
              required: [true, "Subject is required"],
            },
            score: {
              type: Number,
              required: [true, "Score is required"],
              min: [0, "Score cannot be less than 0"],
              max: [100, "Score cannot be more than 100"],
            },
          },
        ],
        comment: {
          type: String,
          required: [true, "Teacher comment is required"],
        },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Updated by is required"],
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// index for faster queries
studentSchema.index({ currentClass: 1 });

export const Student = mongoose.model<IStudent>("Student", studentSchema);
