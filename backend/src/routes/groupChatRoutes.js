import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import { Session } from "../models/Session.js";
import { GroupChat } from "../models/GroupChat.js";
import { GroupMessage } from "../models/GroupMessage.js";

const router = express.Router();

router.get("/my", authRequired, async (req, res) => {
  try {
    const chats = await GroupChat.find({ members: req.user._id })
      .populate("members", "_id name profilePic")
      .sort({ updatedAt: -1 });
    const items = [];
    for (const chat of chats) {
      const lastMsg = await GroupMessage.findOne({ groupId: chat._id, isDeleted: { $ne: true } })
        .populate("senderId", "_id name profilePic")
        .sort({ createdAt: -1 })
        .lean();
      const lr = (chat.lastRead || []).find((x) => String(x.userId) === String(req.user._id));
      const lastReadAt = lr?.at || new Date(0);
      const unread = await GroupMessage.countDocuments({
        groupId: chat._id,
        isDeleted: { $ne: true },
        createdAt: { $gt: lastReadAt },
        senderId: { $ne: req.user._id }
      });
      items.push({
        id: chat._id,
        name: chat.name,
        members: (chat.members || []).map((m) => ({ id: m._id, name: m.name, profilePic: m.profilePic })),
        lastMessage: lastMsg
          ? { content: lastMsg.content, createdAt: lastMsg.createdAt, sender: { id: lastMsg.senderId?._id || lastMsg.senderId, name: lastMsg.senderId?.name } }
          : null,
        unread
      });
    }
    return res.json({ chats: items });
  } catch (error) {
    console.error("List my group chats error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});
// Create or get group chat for a session
router.post("/session/:sessionId/create", authRequired, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status !== "Accepted") {
      return res.status(400).json({ message: "Group chat is available after acceptance" });
    }
    const members = [
      session.learnerId,
      session.teacherId,
      ...(session.groupMembers || []).map((m) => m.userId).filter(Boolean)
    ];
    const uniqueMembers = Array.from(new Set(members.map((id) => id?.toString()))).filter(Boolean);
    const slug = `session-${session._id}`;
    let chat = await GroupChat.findOne({ slug });
    if (!chat) {
      chat = await GroupChat.create({
        name: session.skillName,
        slug,
        sessionId: session._id,
        createdBy: req.user._id,
        members: uniqueMembers
      });
    } else {
      chat.members = uniqueMembers;
      await chat.save();
    }
    return res.json({ chat });
  } catch (error) {
    console.error("Create group chat error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// List messages in a group chat
router.get("/:groupId/messages", authRequired, async (req, res) => {
  try {
    const chat = await GroupChat.findById(req.params.groupId).populate("members", "_id name profilePic");
    if (!chat) return res.status(404).json({ message: "Group chat not found" });
    const isMember = (chat.members || []).some((id) => id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this group chat" });
    const messages = await GroupMessage.find({ groupId: chat._id, isDeleted: { $ne: true } })
      .populate("senderId", "_id name profilePic")
      .sort({ createdAt: 1 })
      .lean();
    const now = new Date();
    const idx = (chat.lastRead || []).findIndex((x) => String(x.userId) === String(req.user._id));
    if (idx >= 0) chat.lastRead[idx].at = now;
    else chat.lastRead.push({ userId: req.user._id, at: now });
    await chat.save();
    const members = (chat.members || []).map((m) => ({
      id: (m?._id || m).toString(),
      name: m?.name || "Member",
      profilePic: m?.profilePic || ""
    }));
    return res.json({ messages, chat: { id: chat._id, name: chat.name, members } });
  } catch (error) {
    console.error("List group messages error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Send a message to group
router.post("/:groupId/messages", authRequired, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Message content is required" });
    const chat = await GroupChat.findById(req.params.groupId);
    if (!chat) return res.status(404).json({ message: "Group chat not found" });
    const isMember = (chat.members || []).some((id) => id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this group chat" });
    const msg = await GroupMessage.create({
      groupId: chat._id,
      senderId: req.user._id,
      content
    });
    return res.status(201).json({ message: msg });
  } catch (error) {
    console.error("Send group message error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Edit a group message (sender within 15 minutes)
router.put("/messages/:messageId", authRequired, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Message content is required" });
    const message = await GroupMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({ message: "Messages can only be edited within 15 minutes of sending" });
    }
    message.content = content;
    message.isEdited = true;
    await message.save();
    return res.json({ message });
  } catch (error) {
    console.error("Edit group message error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete own group message
router.delete("/messages/:messageId", authRequired, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }
    await GroupMessage.findByIdAndDelete(req.params.messageId);
    return res.json({ message: "Message deleted permanently" });
  } catch (error) {
    console.error("Delete group message error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
