import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  firstName: string;
  lastName: string;
  fullName: string; // Keep for backward compatibility
  studentId: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: Date;
  address: string;
  location: string;
  email?: string;
  passportPhoto?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };

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
    session: string;
    paid: boolean; // true when amountPaid >= amount
    pinCode: string;
    viewable: boolean;
    amount: number; // total fee amount required
    amountPaid: number; // total amount paid so far (default 0)
    paymentHistory: {
      amount: number;
      paymentDate: Date;
      paymentMethod:
        | "cash"
        | "bank_transfer"
        | "online"
        | "check"
        | "mobile_money";
      receiptNumber?: string;
      updatedBy?: Schema.Types.ObjectId;
    }[];
    paymentDate?: Date; // most recent payment date
    paymentMethod?:
      | "cash"
      | "bank_transfer"
      | "online"
      | "check"
      | "mobile_money";
    receiptNumber?: string; // most recent receipt
    updatedBy?: Schema.Types.ObjectId;
  }[];

  results: {
    term: string;
    year: number;
    scores: {
      subject: string;
      assessments: {
        ca1: number; // 0-20 marks
        ca2: number; // 0-20 marks
        exam: number; // 0-60 marks
      };
      totalScore: number; // Auto-calculated: ca1 + ca2 + exam
    }[];
    comment: string;
    updatedBy: Schema.Types.ObjectId;
    updatedAt: Date;
  }[];
}

const studentSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      set: function (v: string) {
        // Auto-capitalize first letter
        return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      },
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      set: function (v: string) {
        // Auto-capitalize first letter
        return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      },
    },
    // Keep fullName for backward compatibility - auto-generated from firstName + lastName
    fullName: {
      type: String,
      required: false, // Not required since it's auto-generated from firstName + lastName
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
    email: {
      type: String,
      trim: true,
    },
    passportPhoto: {
      type: String, // URL of uploaded passport photo
    },
    emergencyContact: {
      name: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
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
        session: {
          type: String,
          required: [true, "Session is required"],
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
        amountPaid: {
          type: Number,
          default: 0,
          min: [0, "Amount paid cannot be negative"],
        },
        paymentHistory: [
          {
            amount: {
              type: Number,
              required: [true, "Payment amount is required"],
              min: [0, "Payment amount cannot be negative"],
            },
            paymentDate: {
              type: Date,
              default: Date.now,
            },
            paymentMethod: {
              type: String,
              enum: [
                "cash",
                "bank_transfer",
                "online",
                "check",
                "mobile_money",
              ],
              required: [true, "Payment method is required"],
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
            assessments: {
              ca1: {
                type: Number,
                required: true,
                min: [0, "CA1 score cannot be less than 0"],
                max: [20, "CA1 score cannot be more than 20"],
                default: 0,
              },
              ca2: {
                type: Number,
                required: true,
                min: [0, "CA2 score cannot be less than 0"],
                max: [20, "CA2 score cannot be more than 20"],
                default: 0,
              },
              exam: {
                type: Number,
                required: true,
                min: [0, "Exam score cannot be less than 0"],
                max: [60, "Exam score cannot be more than 60"],
                default: 0,
              },
            },
            totalScore: {
              type: Number,
              required: true,
              min: [0, "Total score cannot be less than 0"],
              max: [100, "Total score cannot be more than 100"],
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

// Pre-save hook to auto-generate fullName from firstName + lastName
studentSchema.pre("save", function (next) {
  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
  next();
});

studentSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  if (update.firstName && update.lastName) {
    update.fullName = `${update.firstName} ${update.lastName}`;
  } else if (update.firstName || update.lastName) {
    // If only one name is being updated, get the other from the document
    this.model.findOne(this.getQuery()).then((doc) => {
      if (doc) {
        const firstName = update.firstName || doc.firstName;
        const lastName = update.lastName || doc.lastName;
        update.fullName = `${firstName} ${lastName}`;
      }
    });
  }
  next();
});

// index for faster queries
studentSchema.index({ currentClass: 1 });

export const Student = mongoose.model<IStudent>("Student", studentSchema);
