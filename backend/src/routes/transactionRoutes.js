import express from "express";
import { Transaction } from "../models/Transaction.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// My wallet (as learner: payments I made; as teacher: earnings and payout status)
router.get("/wallet", authRequired, async (req, res) => {
  try {
    const asLearner = await Transaction.find({ learnerId: req.user._id })
      .populate("teacherId", "name")
      .sort({ paidAt: -1 });
    const asTeacher = await Transaction.find({ teacherId: req.user._id })
      .populate("learnerId", "name")
      .sort({ paidAt: -1 });
    return res.json({
      asLearner: asLearner || [],
      asTeacher: asTeacher || []
    });
  } catch (error) {
    console.error("Wallet error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
