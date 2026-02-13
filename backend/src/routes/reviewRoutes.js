import express from "express";
import { Session } from "../models/Session.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a review for a completed session
router.post("/:sessionId", authRequired, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { sessionId } = req.params;

    if (!rating) {
      return res.status(400).json({ message: "Rating is required" });
    }

    const session = await Session.findById(sessionId);
    if (!session || session.status !== "Completed") {
      return res.status(400).json({ message: "Session must be completed before reviewing" });
    }

    let revieweeId;
    let role;
    if (session.learnerId.toString() === req.user._id.toString()) {
      revieweeId = session.teacherId;
      role = "Learner";
    } else if (session.teacherId?.toString() === req.user._id.toString()) {
      revieweeId = session.learnerId;
      role = "Teacher";
    } else {
      return res.status(403).json({ message: "You are not part of this session" });
    }

    if (!revieweeId) {
      return res.status(400).json({ message: "Session has no counterpart to review" });
    }

    // Prevent duplicate reviews from same reviewer for same session
    const existing = await Review.findOne({
      sessionId,
      reviewerId: req.user._id
    });
    if (existing) {
      return res.status(400).json({ message: "You already reviewed this session" });
    }

    const review = await Review.create({
      sessionId,
      reviewerId: req.user._id,
      revieweeId,
      rating,
      comment: comment || "",
      role
    });

    // Push rating into reviewee's ratings array for trust score
    await User.findByIdAndUpdate(revieweeId, { $push: { ratings: rating } });

    return res.status(201).json({ review });
  } catch (error) {
    console.error("Create review error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Public: get reviews for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate("reviewerId", "name")
      .sort({ createdAt: -1 });

    return res.json({ reviews });
  } catch (error) {
    console.error("Get user reviews error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete own review (creator only)
router.delete("/:id", authRequired, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.reviewerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own review" });
    }
    await Review.findByIdAndDelete(req.params.id);
    return res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Delete review error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

