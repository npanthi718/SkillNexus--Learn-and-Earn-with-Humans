import mongoose from "mongoose";

const GroupChatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastRead: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const GroupChat = mongoose.model("GroupChat", GroupChatSchema);
