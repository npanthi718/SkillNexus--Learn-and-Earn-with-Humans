import mongoose from "mongoose";

const GroupMessageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupChat", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const GroupMessage = mongoose.model("GroupMessage", GroupMessageSchema);
