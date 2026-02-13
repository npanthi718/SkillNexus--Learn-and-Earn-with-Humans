import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    // Kind: learner Request or teacher Offer
    kind: { type: String, enum: ["Request", "Offer"], default: "Request" },
    // The learner who is requesting help
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // The teacher who accepts the request (optional until accepted)
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Optional: when a learner books a specific teacher, only that teacher can accept
    preferredTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // What the learner wants to learn
    skillName: { type: String, required: true },

    // Optional richer description of the request
    details: { type: String, default: "" },

    // Pricing info: learner's budget and whether they want free help
    budget: { type: Number, default: 0, min: 0 },
    budgetCurrency: { type: String, default: "USD" },
    isFree: { type: Boolean, default: false },

    // Group participants for group learning (names/emails or userIds)
    participants: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: { type: String, default: "" },
          email: { type: String, default: "" }
        }
      ],
      default: []
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Completed", "Offer"],
      default: "Pending"
    },

    // Meeting link provided by the teacher when accepting
    meetingLink: { type: String, default: "" },

    // Optional scheduled date/time for the session
    scheduledFor: { type: Date },

    // Group members invited by learner (ids/emails)
    groupMembers: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          email: { type: String, default: "" },
          name: { type: String, default: "" }
        }
      ],
      default: []
    },
    // Payment split preferences for group sessions
    paymentSplitMode: { type: String, enum: ["single", "equal"], default: "single" },
    paymentPayerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paidMemberIds: {
      type: [ { type: mongoose.Schema.Types.ObjectId, ref: "User" } ],
      default: []
    },

    // Optional: learner marks payment done (for paid sessions; can skip until join)
    paymentCompletedByLearner: { type: Boolean, default: false },

    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", SessionSchema);

