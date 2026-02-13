import mongoose from "mongoose";

const PaymentComplaintSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["learner", "teacher"], required: true },
    reason: { type: String, required: true },
    proofUrls: [{ type: String }],
    status: {
      type: String,
      enum: ["open", "proof_required", "resolved", "reverted"],
      default: "open"
    },
    adminNotes: { type: String, default: "" },
    proofSubmittedByAdmin: [{ type: String }],
    resolution: {
      type: String,
      enum: ["reassigned_meeting_paid", "reverted_to_learner"]
    },
    revertDeductionAmount: { type: Number, default: 0 },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const PaymentComplaint = mongoose.model("PaymentComplaint", PaymentComplaintSchema);
