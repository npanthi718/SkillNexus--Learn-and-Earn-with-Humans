import express from "express";
import { Notification } from "../models/Notification.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });
    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/read", authRequired, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: "Notification not found" });
    return res.json({ notification: n });
  } catch (error) {
    console.error("Mark read error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/read-all", authRequired, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true });
    return res.json({ message: "All marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
