import express from "express";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { Review } from "../models/Review.js";
import { Message } from "../models/Message.js";
import { PlatformConfig } from "../models/PlatformConfig.js";
import { PlatformExpenditure } from "../models/PlatformExpenditure.js";
import { LegalContent } from "../models/LegalContent.js";
import { Transaction } from "../models/Transaction.js";
import { PaymentComplaint } from "../models/PaymentComplaint.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/createNotification.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All admin routes are protected and admin-only
router.use(authRequired, adminOnly);

// Stats overview
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalSessions, pendingSessions, completedSessions, totalReviews] =
      await Promise.all([
        User.countDocuments(),
        Session.countDocuments(),
        Session.countDocuments({ status: "Pending" }),
        Session.countDocuments({ status: "Completed" }),
        Review.countDocuments()
      ]);

    // Simple "top skills" metric from sessions
    const topSkillsAgg = await Session.aggregate([
      { $group: { _id: "$skillName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return res.json({
      totalUsers,
      totalSessions,
      pendingSessions,
      completedSessions,
      totalReviews,
      topSkills: topSkillsAgg.map((s) => ({ name: s._id, count: s.count }))
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Users CRUD
router.get("/users", async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return res.json({ users });
});

router.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
});

router.put("/users/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Hash password if provided
    if (updates.password) {
      const { default: bcrypt } = await import("bcryptjs");
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    console.error("Update user error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ message: "User deleted" });
});

// Verify / unverify identities per role
router.post("/users/:id/verify", async (req, res) => {
  const { role } = req.body; // "Learner" | "Teacher"
  if (!["Learner", "Teacher"].includes(role)) {
    return res.status(400).json({ message: "Role must be Learner or Teacher" });
  }
  const updates = {};
  if (role === "Learner") updates.isLearnerVerified = true;
  if (role === "Teacher") updates.isTeacherVerified = true;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  await createNotification({
    userId: user._id,
    type: "verification_approved",
    title: "Verification approved",
    body: `Your ${role.toLowerCase()} verification has been approved`,
    link: "/me/profile",
    relatedId: user._id,
    relatedModel: "User"
  });
  return res.json({ user });
});

router.post("/users/:id/unverify", async (req, res) => {
  const { role } = req.body; // "Learner" | "Teacher"
  if (!["Learner", "Teacher"].includes(role)) {
    return res.status(400).json({ message: "Role must be Learner or Teacher" });
  }
  const updates = {};
  if (role === "Learner") updates.isLearnerVerified = false;
  if (role === "Teacher") updates.isTeacherVerified = false;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
});

// Send verification feedback / rejection message
router.post("/users/:id/verification-feedback", async (req, res) => {
  const { role, message, reject } = req.body;
  if (!["Learner", "Teacher"].includes(role)) {
    return res.status(400).json({ message: "Role must be Learner or Teacher" });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.verificationFeedback = [
    ...(user.verificationFeedback || []),
    { role, message: String(message || "").slice(0, 500) }
  ];
  if (reject === true) {
    const idx = (user.verificationRequests || []).findIndex((r) => r.role === role && r.status === "pending");
    if (idx >= 0) {
      user.verificationRequests[idx].status = "rejected";
      user.verificationRequests[idx].decidedAt = new Date();
    }
    if (role === "Learner") user.isLearnerVerified = false;
    if (role === "Teacher") user.isTeacherVerified = false;
  }
  await user.save();
  await createNotification({
    userId: user._id,
    type: "verification_feedback",
    title: "Verification feedback",
    body: message || "Admin provided feedback on your verification",
    link: "/me/profile",
    relatedId: user._id,
    relatedModel: "User"
  });
  const updated = await User.findById(req.params.id).select("-password");
  return res.json({ user: updated });
});

// Sessions CRUD (light)
router.get("/sessions", async (req, res) => {
  const sessions = await Session.find()
    .populate("learnerId", "name")
    .populate("teacherId", "name")
    .sort({ createdAt: -1 });
  return res.json({ sessions });
});

router.put("/sessions/:id", async (req, res) => {
  const prev = await Session.findById(req.params.id).populate("teacherId", "name").populate("learnerId", "name");
  const session = await Session.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  })
    .populate("teacherId", "name")
    .populate("learnerId", "name");
  if (!session) return res.status(404).json({ message: "Session not found" });

  if (req.body.teacherId && req.body.status === "Accepted" && session.learnerId) {
    const hadTeacher = prev?.teacherId?._id || prev?.teacherId;
    const newTeacher = session.teacherId?._id || session.teacherId;
    if (String(hadTeacher) !== String(newTeacher)) {
      await createNotification({
        userId: session.learnerId._id || session.learnerId,
        type: "request_accepted",
        title: "Teacher assigned to your request",
        body: `Admin assigned a teacher for "${session.skillName}". Check your dashboard.`,
        link: "/dashboard",
        relatedId: session._id,
        relatedModel: "Session"
      });
    }
  }

  return res.json({ session });
});

router.delete("/sessions/:id", async (req, res) => {
  const session = await Session.findByIdAndDelete(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });
  return res.json({ message: "Session deleted" });
});

// Get all messages (admin can see all conversations)
router.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json({ messages });
  } catch (error) {
    console.error("Admin get messages error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get all reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("reviewerId", "name")
      .populate("revieweeId", "name")
      .populate("sessionId", "skillName")
      .sort({ createdAt: -1 });
    return res.json({ reviews });
  } catch (error) {
    console.error("Admin get reviews error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update review (admin)
router.put("/reviews/:id", async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const updates = {};
    if (typeof rating === "number" && rating >= 1 && rating <= 5) updates.rating = rating;
    if (typeof comment === "string") updates.comment = comment;
    const review = await Review.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("reviewerId", "name")
      .populate("revieweeId", "name")
      .populate("sessionId", "skillName");
    if (!review) return res.status(404).json({ message: "Review not found" });
    return res.json({ review });
  } catch (error) {
    console.error("Admin update review error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete review (admin)
router.delete("/reviews/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    return res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Admin delete review error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get user history (sessions as learner and teacher) + chats
router.get("/users/:id/history", async (req, res) => {
  try {
    const userId = req.params.id;
    const [asLearner, asTeacher, userChats] = await Promise.all([
      Session.find({ learnerId: userId })
        .populate("teacherId", "name email")
        .sort({ createdAt: -1 }),
      Session.find({ teacherId: userId })
        .populate("learnerId", "name email")
        .sort({ createdAt: -1 }),
      Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }]
      })
        .populate("senderId", "name email")
        .populate("receiverId", "name email")
        .sort({ createdAt: -1 })
    ]);
    return res.json({ asLearner, asTeacher, chats: userChats });
  } catch (error) {
    console.error("Admin get user history error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Award badges (best learner, best teacher)
router.post("/users/:id/badge", async (req, res) => {
  try {
    const { badge } = req.body; // e.g., "bestLearner", "bestTeacher"
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!user.badges) user.badges = [];
    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
      await user.save();
    }
    const updated = await User.findById(req.params.id).select("-password");
    return res.json({ user: updated });
  } catch (error) {
    console.error("Admin award badge error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Remove badge
router.delete("/users/:id/badge", async (req, res) => {
  try {
    const { badge } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.badges && user.badges.includes(badge)) {
      user.badges = user.badges.filter((b) => b !== badge);
      await user.save();
    }
    const updated = await User.findById(req.params.id).select("-password");
    return res.json({ user: updated });
  } catch (error) {
    console.error("Admin remove badge error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Platform config (company payment details + fee %)
router.get("/platform-config", async (req, res) => {
  try {
    let config = await PlatformConfig.findOne();
    if (!config) config = await PlatformConfig.create({ platformFeePercent: 10 });
    if ((config.currencyRates || []).length === 0) {
      config.currencyRates = [
        { code: "USD", name: "US Dollar", rateToUSD: 1, buyToUSD: 1, sellToUSD: 1 },
        { code: "NPR", name: "Nepalese Rupee", rateToUSD: 0.0075, buyToUSD: 0.00745, sellToUSD: 0.00755 },
        { code: "INR", name: "Indian Rupee", rateToUSD: 0.012, buyToUSD: 0.0119, sellToUSD: 0.0121 },
        { code: "PKR", name: "Pakistani Rupee", rateToUSD: 0.0036, buyToUSD: 0.00355, sellToUSD: 0.00365 },
        { code: "EUR", name: "Euro", rateToUSD: 1.08, buyToUSD: 1.079, sellToUSD: 1.081 },
        { code: "GBP", name: "British Pound", rateToUSD: 1.27, buyToUSD: 1.269, sellToUSD: 1.271 }
      ];
      await config.save();
    }
    if ((config.countries || []).length === 0) {
      config.countries = [
        { code: "US", name: "United States" },
        { code: "NP", name: "Nepal" },
        { code: "IN", name: "India" },
        { code: "PK", name: "Pakistan" },
        { code: "GB", name: "United Kingdom" },
        { code: "EU", name: "European Union" }
      ];
      await config.save();
    }
    if ((config.countryCurrency || []).length === 0) {
      config.countryCurrency = [
        { countryCode: "US", currencyCode: "USD" },
        { countryCode: "GB", currencyCode: "GBP" },
        { countryCode: "EU", currencyCode: "EUR" },
        { countryCode: "NP", currencyCode: "NPR" },
        { countryCode: "IN", currencyCode: "INR" },
        { countryCode: "PK", currencyCode: "PKR" }
      ];
      await config.save();
    }
    return res.json({ config });
  } catch (error) {
    console.error("Admin get platform config error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/platform-config", async (req, res) => {
  try {
    const { platformFeePercent, paymentDetails, logoUrl, currencyRates, countryCurrency, countries, googleClientId } = req.body;
    let config = await PlatformConfig.findOne();
    if (!config) config = await PlatformConfig.create({ platformFeePercent: 10 });
    if (typeof platformFeePercent === "number" && platformFeePercent >= 0 && platformFeePercent <= 100) {
      config.platformFeePercent = platformFeePercent;
    }
    if (Array.isArray(paymentDetails)) config.paymentDetails = paymentDetails;
    if (typeof logoUrl === "string") config.logoUrl = logoUrl;
    if (Array.isArray(currencyRates)) {
      config.currencyRates = currencyRates
        .filter((c) => c && typeof c.code === "string")
        .map((c) => ({
          code: String(c.code).toUpperCase(),
          name: typeof c.name === "string" ? c.name : "",
          rateToUSD: typeof c.rateToUSD === "number" ? Math.max(0, c.rateToUSD) : undefined,
          buyToUSD: typeof c.buyToUSD === "number" ? Math.max(0, c.buyToUSD) : undefined,
          sellToUSD: typeof c.sellToUSD === "number" ? Math.max(0, c.sellToUSD) : undefined
        }));
    }
    if (Array.isArray(countryCurrency)) {
      config.countryCurrency = countryCurrency
        .filter((m) => m && typeof m.countryCode === "string" && typeof m.currencyCode === "string")
        .map((m) => ({
          countryCode: String(m.countryCode).toUpperCase(),
          currencyCode: String(m.currencyCode).toUpperCase()
        }));
    }
    if (Array.isArray(countries)) {
      config.countries = countries
        .filter((c) => c && typeof c.code === "string")
        .map((c) => ({
          code: String(c.code).toUpperCase(),
          name: typeof c.name === "string" ? c.name : ""
        }));
    }
    if (typeof googleClientId === "string") {
      config.googleClientId = googleClientId.trim();
    }
    await config.save();
    return res.json({ config });
  } catch (error) {
    console.error("Admin update platform config error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Platform earnings statement (with date filter)
router.get("/earnings", async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.paidAt = {};
      if (from) match.paidAt.$gte = new Date(from);
      if (to) match.paidAt.$lte = new Date(to);
    }
    const transactions = await Transaction.find(match)
      .populate("learnerId", "name country")
      .populate("teacherId", "name country paymentDetails")
      .sort({ paidAt: -1 });
    const totals = transactions.reduce(
      (acc, t) => {
        if (t.status !== "reverted_to_learner") {
          acc.totalReceived += t.amountPaidNPR || 0;
          acc.platformFees += t.platformFeeAmountNPR || 0;
          acc.paidToTeachers += t.teacherAmountNPR || 0;
          const cur = t.payerCurrency || "USD";
          acc.byCurrency[cur] = acc.byCurrency[cur] || { totalReceived: 0, platformFees: 0, paidToTeachers: 0 };
          acc.byCurrency[cur].totalReceived += t.amountPaid || 0;
          acc.byCurrency[cur].platformFees += t.platformFeeAmount || 0;
          acc.byCurrency[cur].paidToTeachers += t.teacherAmount || 0;
        }
        return acc;
      },
      { totalReceived: 0, platformFees: 0, paidToTeachers: 0, byCurrency: {} }
    );
    const expMatch = {};
    if (from || to) {
      expMatch.date = {};
      if (from) expMatch.date.$gte = new Date(from);
      if (to) expMatch.date.$lte = new Date(to);
    }
    const expenditures = await PlatformExpenditure.find(expMatch);
    const totalExpenditure = expenditures.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    totals.totalExpenditure = totalExpenditure;
    totals.profitLoss = Math.round(((totals.platformFees || 0) - totalExpenditure) * 100) / 100;
    return res.json({ transactions, totals });
  } catch (error) {
    console.error("Admin earnings error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Platform expenditure CRUD
router.get("/expenditures", async (req, res) => {
  const { from, to } = req.query;
  const match = {};
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  const expenditures = await PlatformExpenditure.find(match).sort({ date: -1 });
  return res.json({ expenditures });
});

router.post("/expenditures", async (req, res) => {
  const { amount, category, description, date, tags, attachments } = req.body;
  const exp = await PlatformExpenditure.create({
    amount: Number(amount) || 0,
    category: category || "other",
    description: description || "",
    date: date ? new Date(date) : new Date(),
    tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
    attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : []
  });
  return res.status(201).json(exp);
});

router.put("/expenditures/:id", async (req, res) => {
  const updates = {};
  const b = req.body || {};
  if (typeof b.amount !== "undefined") updates.amount = Number(b.amount) || 0;
  if (typeof b.category === "string") updates.category = b.category || "other";
  if (typeof b.description === "string") updates.description = b.description || "";
  if (b.date) updates.date = new Date(b.date);
  if (Array.isArray(b.tags)) updates.tags = b.tags.filter(Boolean);
  if (Array.isArray(b.attachments)) updates.attachments = b.attachments.filter(Boolean);
  const exp = await PlatformExpenditure.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!exp) return res.status(404).json({ message: "Not found" });
  return res.json(exp);
});

router.delete("/expenditures/:id", async (req, res) => {
  await PlatformExpenditure.findByIdAndDelete(req.params.id);
  return res.json({ message: "Deleted" });
});

// Legal content CRUD (privacy, terms)
router.get("/legal", async (req, res) => {
  const docs = await LegalContent.find();
  return res.json({ legal: docs });
});

router.get("/legal/:type", async (req, res) => {
  const doc = await LegalContent.findOne({ type: req.params.type });
  if (!doc) return res.status(404).json({ message: "Not found" });
  return res.json(doc);
});

router.put("/legal/:type", async (req, res) => {
  const { type } = req.params;
  if (!["privacy", "terms"].includes(type)) return res.status(400).json({ message: "Invalid type" });
  const { title, content } = req.body;
  let doc = await LegalContent.findOne({ type });
  if (!doc) doc = await LegalContent.create({ type });
  if (typeof title === "string") doc.title = title;
  if (typeof content === "string") doc.content = content;
  await doc.save();
  return res.json(doc);
});

router.delete("/legal/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (!["privacy", "terms"].includes(type)) return res.status(400).json({ message: "Invalid type" });
    const doc = await LegalContent.findOneAndDelete({ type });
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// All transactions (wallet) - who paid how much to whom
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("learnerId", "name email")
      .populate("teacherId", "name email paymentDetails")
      .sort({ paidAt: -1 });
    return res.json({ transactions });
  } catch (error) {
    console.error("Admin get transactions error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Mark transaction as paid to teacher (payout)
router.patch("/transactions/:id/pay", async (req, res) => {
  try {
    const { exchangeRate, payoutAmount, note, overrideFeePercent } = req.body || {};
    const txBefore = await Transaction.findById(req.params.id);
    if (!txBefore) return res.status(404).json({ message: "Transaction not found" });
    // Optional override of platform fee % for this payout (recompute both payer currency and NPR)
    let platformFeePercent = txBefore.platformFeePercent;
    let platformFeeAmount = txBefore.platformFeeAmount; // payer currency
    let teacherAmount = txBefore.teacherAmount;         // payer currency
    let platformFeeAmountNPR = txBefore.platformFeeAmountNPR || 0;
    let teacherAmountNPR = txBefore.teacherAmountNPR || 0;
    if (typeof overrideFeePercent === "number" && overrideFeePercent >= 0 && overrideFeePercent <= 100) {
      platformFeePercent = overrideFeePercent;
      platformFeeAmount = Math.round(((txBefore.amountPaid * platformFeePercent) / 100) * 100) / 100;
      teacherAmount = Math.max(0, Math.round((txBefore.amountPaid - platformFeeAmount) * 100) / 100);
      platformFeeAmountNPR = Math.round(((txBefore.amountPaidNPR * platformFeePercent) / 100) * 100) / 100;
      teacherAmountNPR = Math.max(0, Math.round((txBefore.amountPaidNPR - platformFeeAmountNPR) * 100) / 100);
    }
    // Compute defaults if missing
    let computedRate = txBefore.nprToPayoutRate || txBefore.exchangeRate;
    let computedPayout = txBefore.payoutAmount;
    const needsAutoRate = !exchangeRate || exchangeRate <= 0 || Number.isNaN(exchangeRate);
    // Treat 0 as missing for paid sessions; keep 0 only when teacherAmount is 0 (free)
    const needsAutoPayout = (payoutAmount === undefined || payoutAmount === null) || ((payoutAmount === 0) && (txBefore.teacherAmount || 0) > 0);
    if (needsAutoRate || needsAutoPayout) {
      try {
        const cfg = await PlatformConfig.findOne();
        const byCode = {};
        const buyMap = {};
        const sellMap = {};
        for (const cr of (cfg?.currencyRates || [])) {
          const code = String(cr.code || "").toUpperCase();
          byCode[code] = cr;
          buyMap[code] = Number(cr.buyToUSD ?? cr.rateToUSD ?? 1) || 1;
          sellMap[code] = Number(cr.sellToUSD ?? cr.rateToUSD ?? 1) || 1;
        }
        const npr = "NPR";
        const payout = String(txBefore.payoutCurrency || "USD").toUpperCase();
        const nprBuyToUSD = buyMap[npr] || 1;
        const payoutSellToUSD = sellMap[payout] || 1;
        const amountInUSD = (teacherAmountNPR || txBefore.teacherAmountNPR || 0) * (nprBuyToUSD || 1);
        const amountInPayout = (payoutSellToUSD > 0) ? (amountInUSD / payoutSellToUSD) : 0;
        computedPayout = Math.round(amountInPayout * 100) / 100;
        computedRate = (payoutSellToUSD > 0) ? Math.round((((nprBuyToUSD || 1) / payoutSellToUSD + Number.EPSILON)) * 1000000) / 1000000 : 1;
      } catch (e) {
        computedPayout = txBefore.payoutAmount || 0;
        computedRate = 1;
      }
    }
    const updates = {
      status: "paid_to_teacher",
      paidToTeacherAt: new Date(),
      nprToPayoutRate: typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : computedRate,
      exchangeRate: typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : computedRate,
      // Use computed payout when admin leaves 0 but teacherAmount > 0; keep 0 only when teacherAmount is 0
      payoutAmount: (typeof payoutAmount === "number" && payoutAmount >= 0)
        ? ((payoutAmount === 0 && (teacherAmount || 0) > 0) ? computedPayout : payoutAmount)
        : computedPayout,
      platformFeePercent,
      platformFeeAmount,
      teacherAmount,
      platformFeeAmountNPR,
      teacherAmountNPR
    };
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("learnerId", "name")
      .populate("teacherId", "name email paymentDetails");
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    try {
      const historyEntry = {
        at: new Date(),
        rate: typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : transaction.exchangeRate,
        payoutAmount: typeof payoutAmount === "number" ? payoutAmount : transaction.payoutAmount,
        note: typeof note === "string" ? note : "",
        adminId: req.user?._id
      };
      await Transaction.findByIdAndUpdate(req.params.id, {
        $push: { exchangeRateHistory: historyEntry }
      });
    } catch (e) {
      console.warn("Could not append exchange rate history:", e.message);
    }

    await createNotification({
      userId: transaction.teacherId._id,
      type: "payout_received",
      title: "Payout received",
      body: `Your payout for "${transaction.skillName}" has been completed`,
      link: "/dashboard",
      relatedId: transaction._id,
      relatedModel: "Transaction"
    });

    return res.json({ transaction });
  } catch (error) {
    console.error("Admin mark paid error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete transaction (admin CRUD)
router.delete("/transactions/:id", async (req, res) => {
  try {
    const t = await Transaction.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: "Transaction not found" });
    return res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("Admin delete transaction error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Revert transaction to learner (with optional deduction)
router.patch("/transactions/:id/revert", async (req, res) => {
  try {
    const { deductionAmount = 0 } = req.body;
    const transaction = await Transaction.findById(req.params.id)
      .populate("learnerId", "name")
      .populate("teacherId", "name");
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    if (transaction.status === "paid_to_teacher") {
      return res.status(400).json({ message: "Cannot revert: already paid to teacher" });
    }

    const deduct = Math.max(0, Math.min(Number(deductionAmount) || 0, transaction.amountPaid));
    const refundAmount = transaction.amountPaid - deduct;

    await Transaction.findByIdAndUpdate(req.params.id, {
      status: "reverted_to_learner",
      revertDeductionAmount: deduct,
      revertRefundAmount: refundAmount,
      revertedAt: new Date()
    });

    const complaints = await PaymentComplaint.find({ transactionId: req.params.id });
    for (const c of complaints) {
      if (c.status === "open" || c.status === "proof_required") {
        c.status = "reverted";
        c.resolution = "reverted_to_learner";
        c.revertDeductionAmount = deduct;
        c.resolvedAt = new Date();
        c.resolvedBy = req.user._id;
        await c.save();
      }
    }

    const updated = await Transaction.findById(req.params.id)
      .populate("learnerId", "name")
      .populate("teacherId", "name");

    await createNotification({
      userId: updated.learnerId._id,
      type: "payment_reverted",
      title: "Payment reverted",
      body: `Your payment for "${updated.skillName}" has been reverted${deduct > 0 ? ` (${deduct} deducted)` : ""}`,
      link: "/dashboard",
      relatedId: updated._id,
      relatedModel: "Transaction"
    });

    return res.json({ transaction: updated, refundAmount, deductionAmount: deduct });
  } catch (error) {
    console.error("Admin revert transaction error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Payment complaints - admin CRUD
router.get("/complaints", async (req, res) => {
  try {
    const complaints = await PaymentComplaint.find()
      .populate("transactionId")
      .populate("raisedBy", "name email")
      .sort({ createdAt: -1 });
    const txIds = complaints.map((c) => {
      const tid = c.transactionId;
      return tid?._id || tid;
    }).filter(Boolean);
    const transactions = await Transaction.find({ _id: { $in: txIds } })
      .populate("learnerId", "name email")
      .populate("teacherId", "name email paymentDetails");
    const txMap = Object.fromEntries(transactions.map((t) => [t._id.toString(), t]));
    const enriched = complaints.map((c) => ({
      ...c.toObject(),
      transaction: txMap[c.transactionId?._id?.toString()]
    }));
    return res.json({ complaints: enriched });
  } catch (error) {
    console.error("Admin get complaints error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/complaints/:id", async (req, res) => {
  try {
    const { adminNotes, proofSubmittedByAdmin } = req.body;
    const updates = {};
    if (typeof adminNotes === "string") updates.adminNotes = adminNotes;
    if (Array.isArray(proofSubmittedByAdmin)) updates.proofSubmittedByAdmin = proofSubmittedByAdmin;
    if (proofSubmittedByAdmin && updates.proofSubmittedByAdmin?.length > 0) {
      updates.status = "proof_required";
    }
    const complaint = await PaymentComplaint.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("transactionId")
      .populate("raisedBy", "name");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    return res.json({ complaint });
  } catch (error) {
    console.error("Admin update complaint error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/complaints/:id", async (req, res) => {
  try {
    const complaint = await PaymentComplaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    return res.json({ message: "Complaint deleted" });
  } catch (error) {
    console.error("Admin delete complaint error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Resolve complaint: reassign meeting + pay teacher
router.patch("/complaints/:id/resolve-reassign", async (req, res) => {
  try {
    const { meetingLink } = req.body;
    const complaint = await PaymentComplaint.findById(req.params.id).populate("transactionId");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    const tx = complaint.transactionId;
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const session = await Session.findOne({ _id: tx.sessionId });
    if (session && meetingLink) {
      session.meetingLink = meetingLink;
      await session.save();
    }

    await Transaction.findByIdAndUpdate(tx._id, {
      status: "paid_to_teacher",
      paidToTeacherAt: new Date()
    });
    complaint.status = "resolved";
    complaint.resolution = "reassigned_meeting_paid";
    complaint.resolvedAt = new Date();
    complaint.resolvedBy = req.user._id;
    await complaint.save();

    const transaction = await Transaction.findById(tx._id)
      .populate("learnerId", "name")
      .populate("teacherId", "name");
    return res.json({ transaction, complaint });
  } catch (error) {
    console.error("Admin resolve reassign error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
