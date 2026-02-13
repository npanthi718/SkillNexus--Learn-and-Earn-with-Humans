import mongoose from "mongoose";

const LegalContentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["privacy", "terms"], required: true, unique: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" }
  },
  { timestamps: true }
);

export const LegalContent = mongoose.model("LegalContent", LegalContentSchema);
