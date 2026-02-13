import mongoose from "mongoose";

const PlatformExpenditureSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: "other" },
    description: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    tags: { type: [String], default: [] },
    attachments: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const PlatformExpenditure = mongoose.model("PlatformExpenditure", PlatformExpenditureSchema);
