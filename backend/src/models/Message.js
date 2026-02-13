import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);

