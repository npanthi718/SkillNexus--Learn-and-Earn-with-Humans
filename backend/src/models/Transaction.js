import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName: { type: String, default: "" },
    // Amount learner paid (to platform)
    amountPaid: { type: Number, required: true, min: 0 },
    platformFeePercent: { type: Number, default: 0, min: 0, max: 100 },
    platformFeeAmount: { type: Number, default: 0, min: 0 },
    teacherAmount: { type: Number, required: true, min: 0 },
    payerCurrency: { type: String, default: "USD" },
    payoutCurrency: { type: String, default: "USD" },
    // NPR-based accounting fields
    amountPaidNPR: { type: Number, default: 0, min: 0 },
    platformFeeAmountNPR: { type: Number, default: 0, min: 0 },
    teacherAmountNPR: { type: Number, default: 0, min: 0 },
    nprToPayoutRate: { type: Number },
    exchangeRate: { type: Number },
    payoutAmount: { type: Number },
    exchangeRateHistory: [
      {
        at: { type: Date, default: Date.now },
        rate: { type: Number },
        payoutAmount: { type: Number },
        note: { type: String, default: "" },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ],
    status: {
      type: String,
      enum: ["pending_payout", "paid_to_teacher", "complaint_raised", "reverted_to_learner"],
      default: "pending_payout"
    },
    paidAt: { type: Date, default: Date.now },
    paidToTeacherAt: { type: Date },
    revertedAt: { type: Date },
    revertDeductionAmount: { type: Number, default: 0 },
    revertRefundAmount: { type: Number }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", TransactionSchema);
