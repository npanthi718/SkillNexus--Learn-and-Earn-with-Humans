import express from "express";
import { PaymentComplaint } from "../models/PaymentComplaint.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/createNotification.js";

const router = express.Router();

// Raise a complaint on a payment (learner or teacher)
router.post("/", authRequired, async (req, res) => {
  try {
    const { transactionId, reason, proofUrls } = req.body;
    const userId = req.user._id;

    const transaction = await Transaction.findById(transactionId)
      .populate("learnerId", "name")
      .populate("teacherId", "name");
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const isLearner = transaction.learnerId._id.toString() === userId.toString();
    const isTeacher = transaction.teacherId._id.toString() === userId.toString();
    if (!isLearner && !isTeacher) {
      return res.status(403).json({ message: "You can only complain on your own transactions" });
    }

    if (transaction.status === "reverted_to_learner" || transaction.status === "paid_to_teacher") {
      return res.status(400).json({ message: "Cannot raise complaint on this transaction status" });
    }

    const complaint = await PaymentComplaint.create({
      transactionId,
      raisedBy: userId,
      role: isLearner ? "learner" : "teacher",
      reason: reason || "No reason provided",
      proofUrls: Array.isArray(proofUrls) ? proofUrls : []
    });

    await Transaction.findByIdAndUpdate(transactionId, { status: "complaint_raised" });

    const admins = await User.find({ role: "Admin" }).select("_id");
    for (const a of admins) {
      await createNotification({
        userId: a._id,
        type: "complaint_raised",
        title: "Payment complaint",
        body: `${isLearner ? "Learner" : "Teacher"} raised a complaint on a transaction`,
        link: "/admin/payments",
        relatedId: complaint._id,
        relatedModel: "PaymentComplaint"
      });
    }

    const populated = await PaymentComplaint.findById(complaint._id)
      .populate("transactionId")
      .populate("raisedBy", "name");
    return res.status(201).json({ complaint: populated });
  } catch (error) {
    console.error("Create complaint error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get my complaints
router.get("/mine", authRequired, async (req, res) => {
  try {
    const complaints = await PaymentComplaint.find({ raisedBy: req.user._id })
      .populate("transactionId")
      .populate("raisedBy", "name")
      .sort({ createdAt: -1 });
    return res.json({ complaints });
  } catch (error) {
    console.error("Get my complaints error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get complaints for a transaction (learner or teacher involved can view)
router.get("/transaction/:transactionId", authRequired, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const userId = req.user._id.toString();
    const isLearner = transaction.learnerId.toString() === userId;
    const isTeacher = transaction.teacherId.toString() === userId;
    if (!isLearner && !isTeacher) {
      return res.status(403).json({ message: "Access denied" });
    }

    const complaints = await PaymentComplaint.find({ transactionId: req.params.transactionId })
      .populate("raisedBy", "name")
      .sort({ createdAt: -1 });
    return res.json({ complaints });
  } catch (error) {
    console.error("Get transaction complaints error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
