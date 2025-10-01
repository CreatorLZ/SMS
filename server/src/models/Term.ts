import mongoose, { Document, Schema } from "mongoose";

export interface ITerm extends Document {
  name: "1st" | "2nd" | "3rd";
  sessionId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  holidays: {
    name: string;
    startDate: Date;
    endDate: Date;
  }[];
}

const termSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["1st", "2nd", "3rd"],
      required: [true, "Term name is required"],
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "Session is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    holidays: [
      {
        name: {
          type: String,
          required: [true, "Holiday name is required"],
        },
        startDate: {
          type: Date,
          required: [true, "Holiday start date is required"],
        },
        endDate: {
          type: Date,
          required: [true, "Holiday end date is required"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create compound unique index for term and session
termSchema.index({ name: 1, sessionId: 1 }, { unique: true });

// Add validation to ensure endDate is after startDate
termSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  }
  next();
});

// Add validation for holiday dates
termSchema.pre("save", function (next) {
  const invalidHoliday = this.holidays.find(
    (holiday) =>
      holiday.endDate <= holiday.startDate ||
      holiday.startDate < this.startDate ||
      holiday.endDate > this.endDate
  );

  if (invalidHoliday) {
    next(
      new Error(
        "Holiday dates must be within term dates and end date must be after start date"
      )
    );
  }
  next();
});

export const Term = mongoose.model<ITerm>("Term", termSchema);
