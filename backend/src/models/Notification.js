import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "new_request", "request_accepted", "request_rejected",
        "new_message", "payment_done", "payout_received",
        "complaint_raised", "complaint_resolved", "payment_reverted",
        "verification_requested", "verification_feedback", "verification_approved",
        "friend_request", "friend_accepted", "friend_rejected",
        "session_status_update"
      ],
      required: true
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    relatedModel: { type: String },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
