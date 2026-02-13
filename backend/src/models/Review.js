import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    role: { type: String, enum: ["Learner", "Teacher"], required: true }
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", ReviewSchema);

