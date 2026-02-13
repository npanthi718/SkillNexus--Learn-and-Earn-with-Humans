import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET || "skillnexus-dev-secret";
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, agreedToTerms, accountType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!agreedToTerms) {
      return res.status(400).json({ message: "You must agree to the Privacy Policy and Terms of Service to sign up" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const at = ["Learner", "Teacher", "Both"].includes(accountType) ? accountType : "Learner";
    const user = await User.create({ name, email, password: hashed, accountType: at, isTeacherMode: at !== "Learner" });

    const token = createToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        isTeacherMode: user.isTeacherMode,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        isTeacherMode: user.isTeacherMode,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", authRequired, async (req, res) => {
  return res.status(200).json({ user: req.user });
});

// Toggle teacher mode
router.patch("/toggle-teacher-mode", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const nextMode = !user.isTeacherMode;
    if (nextMode && !user.isTeacherVerified) {
      return res.status(403).json({ message: "Get teacher verification to enable teacher mode" });
    }
    user.isTeacherMode = nextMode;
    await user.save();

    return res.status(200).json({
      message: "Teacher mode updated",
      isTeacherMode: user.isTeacherMode
    });
  } catch (error) {
    console.error("Toggle teacher mode error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Request verification (learner or teacher)
router.post("/verification/request", authRequired, async (req, res) => {
  try {
    const { role, message } = req.body;
    if (!["Learner", "Teacher"].includes(role)) {
      return res.status(400).json({ message: "Role must be Learner or Teacher" });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.verificationRequests = [
      ...(user.verificationRequests || []),
      { role, status: "pending", message: message || "" }
    ];
    await user.save();
    const admins = await User.find({ role: "Admin" }).select("_id name");
    for (const a of admins) {
      const { createNotification } = await import("../utils/createNotification.js");
      await createNotification({
        userId: a._id,
        type: "verification_requested",
        title: "Verification requested",
        body: `${user.name} requested ${role.toLowerCase()} verification`,
        link: `/admin/users?focus=${user._id}`,
        relatedId: user._id,
        relatedModel: "User"
      });
    }
    return res.json({ message: "Verification requested", requests: user.verificationRequests });
  } catch (error) {
    console.error("Verification request error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Security questions setup (authenticated)
router.put("/security-questions", authRequired, async (req, res) => {
  try {
    const { questions } = req.body; // [{question, answer}]
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Provide at least one security question" });
    }
    const hashedQs = await Promise.all(
      questions.map(async (q) => ({
        question: String(q.question || "").trim(),
        answerHash: await bcrypt.hash(String(q.answer || ""), 10)
      }))
    );
    const user = await User.findByIdAndUpdate(req.user._id, { securityQuestions: hashedQs }, { new: true }).select("-password");
    return res.json({ message: "Security questions saved", user });
  } catch (error) {
    console.error("Security questions error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Forgot password - start
router.post("/forgot/start", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(400).json({ message: "Security questions not set. Contact support." });
    }
    const questions = user.securityQuestions.map((q, idx) => ({ id: idx, question: q.question }));
    return res.json({ questions });
  } catch (error) {
    console.error("Forgot start error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Forgot password - verify and reset
router.post("/forgot/verify", async (req, res) => {
  try {
    const { email, answers, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(400).json({ message: "Security questions not set. Contact support." });
    }
    if (!Array.isArray(answers) || answers.length !== user.securityQuestions.length) {
      return res.status(400).json({ message: "Answer all security questions" });
    }
    for (let i = 0; i < user.securityQuestions.length; i++) {
      const provided = String(answers[i] || "");
      const ok = await bcrypt.compare(provided, user.securityQuestions[i].answerHash);
      if (!ok) return res.status(400).json({ message: "Incorrect answers" });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Forgot verify error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Google sign-in/signup via ID token
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!resp.ok) return res.status(400).json({ message: "Invalid Google token" });
    const info = await resp.json();
    const aud = process.env.GOOGLE_CLIENT_ID;
    if (aud && info.aud !== aud) return res.status(400).json({ message: "Token audience mismatch" });
    const email = info.email;
    const name = info.name || email.split("@")[0];
    let user = await User.findOne({ email });
    if (!user) {
      const randomPass = await bcrypt.hash(jwt.sign({ email }, process.env.JWT_SECRET), 10);
      user = await User.create({ name, email, password: randomPass });
    }
    const token = createToken(user._id);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        isTeacherMode: user.isTeacherMode,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Google auth error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

