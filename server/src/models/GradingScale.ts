import mongoose, { Document, Schema } from "mongoose";

export interface IGradingScale extends Document {
  min: number;
  max: number;
  grade: string;
  remark: string;
}

const GradingScaleSchema: Schema = new Schema(
  {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "gradingscales", // Use the existing collection name
  }
);

export default mongoose.model<IGradingScale>(
  "GradingScale",
  GradingScaleSchema
);
