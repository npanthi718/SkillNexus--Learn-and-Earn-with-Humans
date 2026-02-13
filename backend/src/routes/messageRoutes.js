import express from "express";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/createNotification.js";

const router = express.Router();

// Send a message to another user
router.post("/:receiverId", authRequired, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const sender = await User.findById(req.user._id).select("name");
    const msg = await Message.create({
      senderId: req.user._id,
      receiverId: req.params.receiverId,
      content
    });

    await createNotification({
      userId: req.params.receiverId,
      type: "new_message",
      title: "New message",
      body: `${sender?.name || "Someone"} sent you a message`,
      link: `/chat/${req.user._id}`,
      relatedId: msg._id,
      relatedModel: "Message"
    });

    return res.status(201).json({ message: msg });
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get conversation between current user and another user
router.get("/:otherUserId", authRequired, async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user._id }
      ],
      isDeleted: { $ne: true }
    })
      .populate("senderId", "_id name")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ messages });
  } catch (error) {
    console.error("Get conversation error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Edit a message (only sender, within 15 minutes)
router.put("/:messageId", authRequired, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    // Check if message is within 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({ message: "Messages can only be edited within 15 minutes of sending" });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    return res.json({ message });
  } catch (error) {
    console.error("Edit message error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete a message (permanent delete)
router.delete("/:messageId", authRequired, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    return res.json({ message: "Message deleted permanently" });
  } catch (error) {
    console.error("Delete message error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete all messages for current user (permanent delete)
router.delete("/", authRequired, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    await Message.deleteMany({ senderId: userId });

    return res.json({ message: "All messages deleted permanently" });
  } catch (error) {
    console.error("Delete all messages error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// List conversations for current user (for inbox)
router.get("/", authRequired, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const msgs = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .lean();

    const byOther = new Map();
    for (const m of msgs) {
      const sender = m.senderId.toString();
      const receiver = m.receiverId.toString();
      const otherId = sender === userId ? receiver : sender;
      if (!byOther.has(otherId)) {
        byOther.set(otherId, m);
      }
    }

    const otherIds = Array.from(byOther.keys());
    const users = await User.find({ _id: { $in: otherIds } }).select("name profilePic");
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const conversations = otherIds.map((oid) => {
      const last = byOther.get(oid);
      const u = userMap.get(oid);
      return {
        otherUser: {
          id: oid,
          name: u?.name || "Unknown",
          profilePic: u?.profilePic || ""
        },
        lastMessage: {
          id: last._id,
          content: last.content,
          createdAt: last.createdAt,
          isMine: last.senderId.toString() === userId
        }
      };
    });

    return res.json({ conversations });
  } catch (error) {
    console.error("List conversations error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

