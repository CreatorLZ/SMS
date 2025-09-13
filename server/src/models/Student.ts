import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  fullName: string;
  studentId: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: Date;
  address: string;
  location: string;
  photo?: string;

  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  relationshipToStudent: "Father" | "Mother" | "Guardian";

  currentClass: string;
  classroomId?: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  parentId?: Schema.Types.ObjectId;
  status: "active" | "inactive" | "graduated" | "transferred";
  admissionDate: Date;

  termFees: {
    term: "1st" | "2nd" | "3rd";
    year: number;
    paid: boolean;
    pinCode: string;
    viewable: boolean;
    amount: number;
    paymentDate?: Date;
    paymentMethod?:
      | "cash"
      | "bank_transfer"
      | "online"
      | "check"
      | "mobile_money";
    receiptNumber?: string;
    updatedBy?: Schema.Types.ObjectId;
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
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    photo: {
      type: String, // URL of uploaded profile picture
    },

    parentName: {
      type: String,
      required: true,
    },
    parentPhone: {
      type: String,
      required: true,
    },
    parentEmail: {
      type: String,
    },
    relationshipToStudent: {
      type: String,
      enum: ["Father", "Mother", "Guardian"],
      required: true,
    },

    currentClass: {
      type: String,
      required: [true, "Current class is required"],
      trim: true,
    },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
    },
    admissionDate: {
      type: Date,
      default: Date.now,
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
        amount: {
          type: Number,
          required: [true, "Fee amount is required"],
          min: [0, "Fee amount cannot be negative"],
        },
        paymentDate: {
          type: Date,
        },
        paymentMethod: {
          type: String,
          enum: ["cash", "bank_transfer", "online", "check", "mobile_money"],
        },
        receiptNumber: {
          type: String,
        },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
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
