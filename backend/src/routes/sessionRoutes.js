import express from "express";
import mongoose from "mongoose";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { PlatformConfig } from "../models/PlatformConfig.js";
import { Transaction } from "../models/Transaction.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/createNotification.js";
import { GroupChat } from "../models/GroupChat.js";

const router = express.Router();

// Public: Request board - list all pending learning requests
router.get("/requests", async (req, res) => {
  try {
    const { skill, minBudget, maxBudget } = req.query;

    const query = { status: "Pending", kind: "Request" };
    if (skill) {
      query.skillName = { $regex: skill, $options: "i" };
    }
    if (minBudget) {
      query.budget = { ...(query.budget || {}), $gte: Number(minBudget) };
    }
    if (maxBudget) {
      query.budget = { ...(query.budget || {}), $lte: Number(maxBudget) };
    }

    const sessions = await Session.find(query)
      .populate("learnerId", "name country profilePic")
      .sort({ createdAt: -1 });

    return res.json({ requests: sessions });
  } catch (error) {
    console.error("List requests error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Learner: create a new help request
router.post("/requests", authRequired, async (req, res) => {
  try {
    const { skillName, details, budget, isFree, preferredTeacherId } = req.body;
    if (!skillName) {
      return res.status(400).json({ message: "skillName is required" });
    }

    let config = await PlatformConfig.findOne();
    if (!config) {
      config = await PlatformConfig.create({ platformFeePercent: 10 });
    }
    const ccMap = {};
    for (const m of (config.countryCurrency || [])) {
      if (m.countryCode && m.currencyCode) ccMap[m.countryCode.toUpperCase()] = m.currencyCode.toUpperCase();
    }
    const toCode = (value) => {
      const v = String(value || "").toUpperCase();
      if (!v) return "";
      if (ccMap[v]) return v;
      const match = (config.countries || []).find((c) => String(c.name || "").toUpperCase() === v);
      return match?.code?.toUpperCase() || "";
    };
    const initialBudgetCurrency = ccMap[(req.user.country || "").toUpperCase()] || "USD";
    const rawMembers = Array.isArray(req.body.groupMembers) ? req.body.groupMembers.slice(0, 10) : [];
    const emails = rawMembers.map((m) => String(m.email || "").trim()).filter(Boolean);
    const usersByEmail = emails.length > 0 ? await User.find({ email: { $in: emails } }).select("_id name email") : [];
    const emailMap = Object.fromEntries(usersByEmail.map((u) => [String(u.email).toLowerCase(), u]));
    const participants = rawMembers.map((m) => {
      const key = String(m.email || "").toLowerCase();
      const u = emailMap[key];
      return {
        userId: u?._id || m.userId || undefined,
        name: m.name || u?.name || "",
        email: m.email || u?.email || ""
      };
    });
    const invalidEmails = participants.filter((p) => !p.userId).map((p) => p.email).filter(Boolean);
    if ((invalidEmails || []).length > 0) {
      return res.status(400).json({ message: "Some participants are not registered", invalidEmails });
    }
    const session = await Session.create({
      learnerId: req.user._id,
      skillName,
      details: details || "",
      budget: budget || 0,
      budgetCurrency: initialBudgetCurrency,
      isFree: Boolean(isFree),
      status: "Pending",
      kind: "Request",
      groupMembers: participants,
      preferredTeacherId: preferredTeacherId || undefined
    });

    const admins = await User.find({ role: "Admin" }).select("_id");
    for (const a of admins) {
      await createNotification({
        userId: a._id,
        type: "new_request",
        title: "New learning request",
        body: `${req.user.name} requested help with "${skillName}"`,
        link: "/admin/sessions",
        relatedId: session._id,
        relatedModel: "Session"
      });
    }
    // Notify group members who are users
    for (const p of participants) {
      if (p.userId) {
        await createNotification({
          userId: p.userId,
          type: "group_added",
          title: "Added to group study",
          body: `${req.user.name} added you to "${skillName}" group session`,
          link: "/dashboard",
          relatedId: session._id,
          relatedModel: "Session"
        });
      }
    }

    return res.status(201).json({ request: session });
  } catch (error) {
    console.error("Create request error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Learner: see own requests (include teacher paymentDetails for paid sessions)
router.get("/my-requests", authRequired, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { learnerId: req.user._id },
        { groupMembers: { $elemMatch: { userId: req.user._id } } }
      ]
    })
      .populate("learnerId", "name country profilePic")
      .populate("teacherId", "name paymentDetails country profilePic")
      .populate("groupMembers.userId", "name profilePic")
      .sort({ createdAt: -1 });
    return res.json({ requests: sessions });
  } catch (error) {
    console.error("My requests error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Teacher: see sessions where they are the teacher
router.get("/my-teaching", authRequired, async (req, res) => {
  try {
    // Allow access; if no sessions yet, return empty list
    const sessions = await Session.find({ teacherId: req.user._id })
      .populate("learnerId", "name profilePic")
      .populate("groupMembers.userId", "name profilePic")
      .sort({ createdAt: -1 });
    return res.json({ sessions });
  } catch (error) {
    console.error("My teaching error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Teacher: accept a request (assign self and provide meet link + schedule)
router.post("/:id/accept", authRequired, async (req, res) => {
  try {
    const { meetingLink, scheduledFor } = req.body;

    if (!meetingLink) {
      return res.status(400).json({ message: "Meeting link is required" });
    }

    // Only verified teachers can accept
    if (!req.user.isVerified && !req.user.isTeacherVerified) {
      return res.status(403).json({ message: "Only verified teachers can accept requests. Please complete verification." });
    }
    // Should have at least one skill to teach
    if (!req.user.skillsToTeach || req.user.skillsToTeach.length === 0) {
      return res.status(403).json({ message: "Add at least one skill with pricing to accept requests." });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Request not found" });
    }
    // If the learner targeted a specific teacher, enforce that only they can accept
    if (session.preferredTeacherId && session.preferredTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the selected teacher can accept this booking." });
    }

    // Prevent a learner from accepting their own request as teacher
    if (session.learnerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: "Teachers and learners cannot be the same. You cannot accept your own request as you are the learner who posted this request." 
      });
    }
    // Prevent any group participant (learner side) from accepting as teacher
    const isGroupParticipant = (session.groupMembers || []).some((m) => String(m.userId) === String(req.user._id));
    if (isGroupParticipant) {
      return res.status(403).json({ message: "Group participants cannot accept as teacher for this request." });
    }
    if (session.status !== "Pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    session.teacherId = req.user._id;
    session.status = "Accepted";
    session.meetingLink = meetingLink;

    if (scheduledFor) {
      const date = new Date(scheduledFor);
      if (!isNaN(date.getTime())) {
        session.scheduledFor = date;
      }
    }
    await session.save();

    let chat = null;
    if ((session.groupMembers || []).length > 0) {
      const members = [
        session.learnerId,
        req.user._id,
        ...(session.groupMembers || []).map((m) => m.userId).filter(Boolean)
      ].filter(Boolean);
      const uniqueMembers = Array.from(new Set(members.map((id) => id.toString()))).map((id) => new mongoose.Types.ObjectId(id));
      const slug = `session-${session._id}`;
      chat = await GroupChat.findOne({ slug });
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
    }

    await createNotification({
      userId: session.learnerId,
      type: "request_accepted",
      title: "Request accepted",
      body: `${req.user.name} accepted your "${session.skillName}" request`,
      link: chat ? `/group/${chat._id}` : "/dashboard",
      relatedId: session._id,
      relatedModel: "Session"
    });
    // Notify group members (with userId) on acceptance
    const memberIds = (session.groupMembers || []).map((m) => m.userId).filter(Boolean);
    for (const uid of memberIds) {
      await createNotification({
        userId: uid,
        type: "request_accepted",
        title: "Group request accepted",
        body: `A teacher accepted the group session "${session.skillName}". Open the group chat.`,
        link: chat ? `/group/${chat._id}` : "/dashboard",
        relatedId: session._id,
        relatedModel: "Session"
      });
    }

    // If this is a free session, auto-record a zero transaction and mark paid to teacher
    if (session.isFree || !(session.budget > 0)) {
      try {
        const existingTx = await Transaction.findOne({ sessionId: session._id });
        if (!existingTx) {
          let config = await PlatformConfig.findOne();
          if (!config) config = await PlatformConfig.create({ platformFeePercent: 10 });
          const ccMap = {};
          for (const m of (config.countryCurrency || [])) {
            if (m.countryCode && m.currencyCode) ccMap[m.countryCode.toUpperCase()] = m.currencyCode.toUpperCase();
          }
          const toCode = (value) => {
            const v = String(value || "").toUpperCase();
            if (!v) return "";
            if (ccMap[v]) return v;
            const match = (config.countries || []).find((c) => String(c.name || "").toUpperCase() === v);
            return match?.code?.toUpperCase() || "";
          };
          const payerCurrency = session.budgetCurrency || ccMap[toCode(session.learnerId?.country)] || "USD";
          let payoutCurrency = ccMap[toCode(req.user.country)] || "USD";
          try {
            const teacher = await User.findById(session.teacherId).select("country paymentDetails");
            const teacherCountry = toCode(teacher?.country || teacher?.paymentDetails?.[0]?.country || "");
            if (teacherCountry && ccMap[teacherCountry]) {
              payoutCurrency = ccMap[teacherCountry];
            }
          } catch {}
          await Transaction.create({
            sessionId: session._id,
            learnerId: session.learnerId,
            teacherId: session.teacherId,
            skillName: session.skillName,
            amountPaid: 0,
            platformFeePercent: 0,
            platformFeeAmount: 0,
            teacherAmount: 0,
            payerCurrency,
            payoutCurrency,
            amountPaidNPR: 0,
            platformFeeAmountNPR: 0,
            teacherAmountNPR: 0,
            nprToPayoutRate: 0,
            exchangeRate: 0,
            payoutAmount: 0,
            status: "paid_to_teacher",
            paidToTeacherAt: new Date()
          });
        }
      } catch (e) {
        console.warn("Auto zero-transaction error:", e?.message);
      }
    }

    // Ensure the accepting user is treated as a teacher for this skill
    const teacher = await User.findById(req.user._id);
    if (teacher) {
      const alreadyHasSkill = (teacher.skillsToTeach || []).some(
        (s) => s.name.toLowerCase() === session.skillName.toLowerCase()
      );
      if (!alreadyHasSkill) {
        teacher.skillsToTeach.push({
          name: session.skillName,
          level: "Intermediate",
          price: session.isFree ? 0 : session.budget || 0
        });
        await teacher.save();
      }
    }

    return res.json({ session });
  } catch (error) {
    console.error("Accept request error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Learner: mark payment as done (optional; can skip until join by link)
router.post("/:id/payment-done", authRequired, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("teacherId", "name");
    if (!session) return res.status(404).json({ message: "Session not found" });
    const isMember = String(session.learnerId) === String(req.user._id) ||
      (Array.isArray(session.groupMembers) && session.groupMembers.some((m) => String(m.userId) === String(req.user._id)));
    if (!isMember) {
      return res.status(403).json({ message: "Only the learner or group member can mark payment" });
    }
    if (session.isFree || !(session.budget > 0)) {
      return res.status(400).json({ message: "Session is not a paid session" });
    }
    const existingTx = await Transaction.findOne({ sessionId: session._id });
    if (existingTx) {
      session.paymentCompletedByLearner = true;
      await session.save();
      return res.json({ session, transaction: existingTx });
    }
    let config = await PlatformConfig.findOne();
    if (!config) {
      config = await PlatformConfig.create({ platformFeePercent: 10 });
    }
    const ccMap = {};
    for (const m of (config.countryCurrency || [])) {
      if (m.countryCode && m.currencyCode) ccMap[m.countryCode.toUpperCase()] = m.currencyCode.toUpperCase();
    }
    const toCode = (value) => {
      const v = String(value || "").toUpperCase();
      if (!v) return "";
      if (ccMap[v]) return v;
      const match = (config.countries || []).find((c) => String(c.name || "").toUpperCase() === v);
      return match?.code?.toUpperCase() || "";
    };
    const buyMap = {};
    const sellMap = {};
    for (const r of (config.currencyRates || [])) {
      if (!r.code) continue;
      const code = String(r.code).toUpperCase();
      buyMap[code] = Number(r.buyToUSD ?? r.rateToUSD ?? 1) || 1;
      sellMap[code] = Number(r.sellToUSD ?? r.rateToUSD ?? 1) || 1;
    }
    const offerCurrency = String(session.budgetCurrency || "USD").toUpperCase();
    const learnerCurrency = ccMap[toCode(req.user.country)] || "USD";
    const offerBuyToUSD = buyMap[offerCurrency] || 1;
    const learnerSellToUSD = sellMap[learnerCurrency] || 1;
    const shareCount = (session.paymentSplitMode === "equal")
      ? (1 + (Array.isArray(session.groupMembers) ? session.groupMembers.length : 0))
      : 1;
    const totalUSD = (session.budget || 0) * (offerBuyToUSD || 1);
    const perShareUSD = (totalUSD || 0) / (shareCount || 1);
    const amountPaid = Math.round(((perShareUSD / (learnerSellToUSD || 1)) || 0) * 100) / 100;
    const platformFeePercent = config.platformFeePercent || 0;
    const platformFeeAmount = Math.round((amountPaid * platformFeePercent) / 100 * 100) / 100;
    const teacherAmount = Math.round((amountPaid - platformFeeAmount) * 100) / 100;
    const payerCurrency = learnerCurrency;
    let payoutCurrency = ccMap[toCode(session.teacherId?.country)] || "USD";
    if (!payoutCurrency || payoutCurrency === "USD") {
      try {
        const teacher = await User.findById(session.teacherId).select("country paymentDetails");
        const teacherCountry = toCode(teacher?.country || teacher?.paymentDetails?.[0]?.country || "");
        if (teacherCountry && ccMap[teacherCountry]) {
          payoutCurrency = ccMap[teacherCountry];
        }
      } catch (e) {
        // ignore
      }
    }
    const nprSellToUSD = sellMap["NPR"] || 1;
    const nprBuyToUSD = buyMap["NPR"] || 1;
    const amountPaidUSD = perShareUSD;
    const amountPaidNPR = nprSellToUSD > 0 ? Math.round(((amountPaidUSD / nprSellToUSD) || 0) * 100) / 100 : 0;
    const platformFeeAmountNPR = Math.round(((amountPaidNPR * platformFeePercent) / 100) * 100) / 100;
    const teacherAmountNPR = Math.max(0, Math.round(((amountPaidNPR - platformFeeAmountNPR) || 0) * 100) / 100);
    const payoutSellToUSD = sellMap[payoutCurrency] || 1;
    const nprToPayoutRate = (payoutSellToUSD > 0) ? Math.round((((nprBuyToUSD || 1) / payoutSellToUSD + Number.EPSILON)) * 1000000) / 1000000 : 1;
    const teacherAmountUSD = teacherAmountNPR * (nprBuyToUSD || 1);
    const payoutAmount = payoutSellToUSD > 0 ? Math.round(((teacherAmountUSD / payoutSellToUSD) || 0) * 100) / 100 : 0;

    const transaction = await Transaction.create({
      sessionId: session._id,
      learnerId: req.user._id,
      teacherId: session.teacherId,
      skillName: session.skillName,
      amountPaid,
      platformFeePercent,
      platformFeeAmount,
      teacherAmount,
      payerCurrency,
      payoutCurrency,
      amountPaidNPR,
      platformFeeAmountNPR,
      teacherAmountNPR,
      nprToPayoutRate,
      exchangeRate: nprToPayoutRate,
      payoutAmount,
      status: "pending_payout"
    });
    session.paymentCompletedByLearner = true;
    if (!Array.isArray(session.paidMemberIds)) session.paidMemberIds = [];
    if (!session.paidMemberIds.some((id) => String(id) === String(req.user._id))) {
      session.paidMemberIds.push(req.user._id);
    }
    await session.save();

    await createNotification({
      userId: session.teacherId._id,
      type: "payment_done",
      title: "Payment received",
      body: `${req.user.name} paid for "${session.skillName}" session`,
      link: "/dashboard",
      relatedId: transaction._id,
      relatedModel: "Transaction"
    });

    const admins = await User.find({ role: "Admin" }).select("_id");
    for (const a of admins) {
      await createNotification({
        userId: a._id,
        type: "payment_done",
        title: "New payment",
        body: `${req.user.name} paid for "${session.skillName}"`,
        link: "/admin/payments",
        relatedId: transaction._id,
        relatedModel: "Transaction"
      });
    }

    return res.json({ session, transaction });
  } catch (error) {
    console.error("Payment done error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Mark a session as completed (either side can mark)
router.post("/:id/complete", authRequired, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const actorIsLearner = session.learnerId.toString() === req.user._id.toString();
    const actorIsTeacher = session.teacherId?.toString() === req.user._id.toString();
    const actorIsGroupMember = Array.isArray(session.groupMembers) && session.groupMembers.some((m) => String(m.userId) === String(req.user._id));
    if (!actorIsLearner && !actorIsTeacher && !actorIsGroupMember) {
      return res.status(403).json({ message: "Not allowed to update this session" });
    }

    const requiresPayment = !session.isFree && (session.budget || 0) > 0;
    if (requiresPayment) {
      if (session.paymentSplitMode === "equal") {
        const total = 1 + (Array.isArray(session.groupMembers) ? session.groupMembers.length : 0);
        const paid = Array.isArray(session.paidMemberIds) ? session.paidMemberIds.length : 0;
        if (paid < total) {
          const outstandingCount = total - paid;
          return res.status(400).json({ message: `Group payment pending: ${outstandingCount} participant(s) still need to pay.` });
        }
      } else {
        if (!session.paymentCompletedByLearner) {
          return res.status(400).json({ message: "Please pay or mark as paid before completing" });
        }
      }
    }

    session.status = "Completed";
    await session.save();

    // Auto-record a 0-paid transaction if learner never marked payment done
    if (!session.isFree && (session.budget || 0) > 0) {
      const existingTx = await Transaction.findOne({ sessionId: session._id });
      if (!existingTx) {
        let config = await PlatformConfig.findOne();
        if (!config) config = await PlatformConfig.create({ platformFeePercent: 10 });
        const ccMap = {};
        for (const m of (config.countryCurrency || [])) {
          if (m.countryCode && m.currencyCode) ccMap[m.countryCode.toUpperCase()] = m.currencyCode.toUpperCase();
        }
        const toCode = (value) => {
          const v = String(value || "").toUpperCase();
          if (!v) return "";
          if (ccMap[v]) return v;
          const match = (config.countries || []).find((c) => String(c.name || "").toUpperCase() === v);
          return match?.code?.toUpperCase() || "";
        };
        const payerCurrency = session.budgetCurrency || ccMap[toCode(session.learnerId?.country)] || "USD";
        let payoutCurrency = ccMap[toCode(session.teacherId?.country)] || "USD";
        try {
          const teacher = await User.findById(session.teacherId).select("country paymentDetails");
          const teacherCountry = toCode(teacher?.country || teacher?.paymentDetails?.[0]?.country || "");
          if (teacherCountry && ccMap[teacherCountry]) {
            payoutCurrency = ccMap[teacherCountry];
          }
        } catch {}
        await Transaction.create({
          sessionId: session._id,
          learnerId: session.learnerId,
          teacherId: session.teacherId,
          skillName: session.skillName,
          amountPaid: 0,
          platformFeePercent: config.platformFeePercent || 0,
          platformFeeAmount: 0,
          teacherAmount: 0,
          payerCurrency,
          payoutCurrency,
          status: "paid_to_teacher",
          paidToTeacherAt: new Date(),
          exchangeRate: 1,
          payoutAmount: 0
        });
      }
    }

    return res.json({ session });
  } catch (error) {
    console.error("Complete session error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Teacher: update meeting link and schedule for an accepted session
router.put("/:id/meeting", authRequired, async (req, res) => {
  try {
    const { meetingLink, scheduledFor } = req.body || {};
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!session.teacherId || session.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned teacher can update meeting details" });
    }
    if (typeof meetingLink === "string") session.meetingLink = meetingLink;
    if (scheduledFor) {
      const d = new Date(scheduledFor);
      if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid date/time" });
      const now = new Date();
      if (d.getTime() < now.getTime()) {
        return res.status(400).json({ message: "Meeting cannot be in the past. Please choose a future time." });
      }
      session.scheduledFor = d;
    }
    await session.save();
    return res.json({ session });
  } catch (error) {
    console.error("Update meeting error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Teacher: update pricing for an accepted session (allow lower cost or free)
router.patch("/:id/pricing", authRequired, async (req, res) => {
  try {
    const { isFree, budget } = req.body || {};
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!session.teacherId || session.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned teacher can update pricing" });
    }
    if (session.status !== "Accepted") {
      return res.status(400).json({ message: "Only accepted sessions can change pricing" });
    }
    const anyPayment = (Array.isArray(session.paidMemberIds) && session.paidMemberIds.length > 0) ||
      await Transaction.exists({ sessionId: session._id });
    if (anyPayment) {
      return res.status(400).json({ message: "Pricing cannot be changed after payments have started" });
    }
    let changed = false;
    if (typeof isFree === "boolean") {
      session.isFree = isFree;
      if (isFree) session.budget = 0;
      changed = true;
    }
    if (!session.isFree && typeof budget === "number" && budget >= 0) {
      if (!session.budget || budget <= session.budget) {
        session.budget = budget;
        changed = true;
      }
    }
    if (!changed) return res.status(400).json({ message: "No valid pricing change provided" });
    await session.save();
    await createNotification({
      userId: session.learnerId,
      type: "session_status_update",
      title: "Session pricing updated",
      body: `Teacher updated pricing for "${session.skillName}"`,
      link: "/dashboard",
      relatedId: session._id,
      relatedModel: "Session",
      status: session.isFree || !(session.budget > 0) ? "Accepted" : "Accepted"
    });
    return res.json({ session });
  } catch (error) {
    console.error("Update pricing error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Learner: edit/delete own request (only while Pending)
router.put("/requests/:id", authRequired, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Request not found" });
    if (!session.learnerId || session.learnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the requester can edit" });
    }
    if (session.status !== "Pending") return res.status(400).json({ message: "Only pending requests can be edited" });
    const { skillName, details, budget, isFree } = req.body || {};
    if (typeof skillName === "string") session.skillName = skillName;
    if (typeof details === "string") session.details = details;
    if (typeof isFree === "boolean") session.isFree = isFree;
    if (!session.isFree && typeof budget === "number" && budget >= 0) session.budget = budget;
    await session.save();
    return res.json({ request: session });
  } catch (error) {
    console.error("Edit request error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});
router.delete("/requests/:id", authRequired, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Request not found" });
    if (!session.learnerId || session.learnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the requester can delete" });
    }
    if (session.status !== "Pending") return res.status(400).json({ message: "Only pending requests can be deleted" });
    await Session.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete request error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Teacher: edit/delete own offer (only while Offer)
router.put("/offers/:id", authRequired, async (req, res) => {
  try {
    const offer = await Session.findById(req.params.id);
    if (!offer || offer.kind !== "Offer") return res.status(404).json({ message: "Offer not found" });
    if (!offer.teacherId || offer.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the posting teacher can edit" });
    }
    if (offer.status !== "Offer") return res.status(400).json({ message: "Only active offers can be edited" });
    const { skillName, details, price } = req.body || {};
    if (typeof skillName === "string") offer.skillName = skillName;
    if (typeof details === "string") offer.details = details;
    if (typeof price === "number" && price >= 0) {
      offer.budget = price;
      offer.isFree = price <= 0;
    }
    await offer.save();
    return res.json({ offer });
  } catch (error) {
    console.error("Edit offer error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});
router.delete("/offers/:id", authRequired, async (req, res) => {
  try {
    const offer = await Session.findById(req.params.id);
    if (!offer || offer.kind !== "Offer") return res.status(404).json({ message: "Offer not found" });
    if (!offer.teacherId || offer.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the posting teacher can delete" });
    }
    if (offer.status !== "Offer") return res.status(400).json({ message: "Only active offers can be deleted" });
    await Session.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete offer error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
 
// Teacher: create a teaching offer
router.post("/offers", authRequired, async (req, res) => {
  try {
    const { skillName, details, price } = req.body;
    if (!skillName) return res.status(400).json({ message: "skillName is required" });
    if (!req.user.isTeacherVerified) {
      return res.status(403).json({ message: "Only verified teachers can post offers. Please complete verification." });
    }
    // Determine teacher currency from platform config mapping and teacher country
    let config = await PlatformConfig.findOne();
    if (!config) config = await PlatformConfig.create({ platformFeePercent: 10 });
    const ccMap = {};
    for (const m of (config.countryCurrency || [])) {
      if (m.countryCode && m.currencyCode) ccMap[m.countryCode.toUpperCase()] = m.currencyCode.toUpperCase();
    }
    const teacher = await User.findById(req.user._id).select("country");
    const cur = ccMap[(teacher?.country || "").toUpperCase()] || "USD";
    const offer = await Session.create({
      teacherId: req.user._id,
      skillName,
      details: details || "",
      budget: Number(price || 0),
      budgetCurrency: cur,
      isFree: Number(price || 0) <= 0,
      kind: "Offer",
      status: "Offer"
    });
    const admins = await User.find({ role: "Admin" }).select("_id");
    for (const a of admins) {
      await createNotification({
        userId: a._id,
        type: "new_request",
        title: "New teaching offer",
        body: `${req.user.name} posted an offer to teach "${skillName}"`,
        link: "/admin/sessions",
        relatedId: offer._id,
        relatedModel: "Session"
      });
    }
    return res.status(201).json({ offer });
  } catch (error) {
    console.error("Create offer error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Public: list teaching offers
router.get("/offers", async (req, res) => {
  try {
    const { skill } = req.query;
    const query = { kind: "Offer", status: "Offer" };
    if (skill) query.skillName = { $regex: skill, $options: "i" };
    const offers = await Session.find(query)
      .populate("teacherId", "name country profilePic")
      .sort({ createdAt: -1 });
    return res.json({ offers });
  } catch (error) {
    console.error("List offers error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Learner: accept a teaching offer
router.post("/offers/:id/accept", authRequired, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid offer id" });
    }
    const offer = await Session.findById(id);
    if (!offer || offer.kind !== "Offer" || offer.status !== "Offer") {
      return res.status(404).json({ message: "Offer not found" });
    }
    if (offer.teacherId?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot accept your own teaching offer" });
    }
    offer.learnerId = req.user._id;
    offer.status = "Accepted";
    await offer.save();
    await createNotification({
      userId: offer.teacherId,
      type: "request_accepted",
      title: "Your teaching offer was accepted",
      body: `${req.user.name} accepted your offer for "${offer.skillName}"`,
      link: "/dashboard",
      relatedId: offer._id,
      relatedModel: "Session"
    });
    try {
      const slug = `session-${offer._id}`;
      let chat = await GroupChat.findOne({ slug });
      const baseMembers = [offer.learnerId, offer.teacherId];
      const gm = (offer.groupMembers || []).map((m) => m.userId).filter(Boolean);
      const memberIds = Array.from(new Set([...baseMembers, ...gm].map((x) => x?.toString()))).filter(Boolean);
      const members = memberIds.map((id) => new mongoose.Types.ObjectId(id));
      if (!chat) {
        await GroupChat.create({
          name: offer.skillName,
          slug,
          sessionId: offer._id,
          createdBy: req.user._id,
          members
        });
      } else {
        chat.members = members;
        await chat.save();
      }
    } catch (e) {
      // ignore group chat creation errors
    }
    return res.json({ session: offer });
  } catch (error) {
    console.error("Accept offer error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/remind/:memberId", authRequired, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    const isActorParticipant = String(session.learnerId) === String(req.user._id) ||
      (Array.isArray(session.groupMembers) && session.groupMembers.some((m) => String(m.userId) === String(req.user._id)));
    if (!isActorParticipant) return res.status(403).json({ message: "Only participants can send reminders" });
    const isTargetParticipant = String(session.learnerId) === String(memberId) ||
      (Array.isArray(session.groupMembers) && session.groupMembers.some((m) => String(m.userId) === String(memberId)));
    if (!isTargetParticipant) return res.status(400).json({ message: "User is not part of this group" });
    const alreadyPaid = Array.isArray(session.paidMemberIds) && session.paidMemberIds.some((pid) => String(pid) === String(memberId));
    if (alreadyPaid) return res.status(400).json({ message: "User already paid" });
    await createNotification({
      userId: memberId,
      type: "payment_reminder",
      title: "Group session payment",
      body: `${req.user.name} reminds you to pay your group session share for "${session.skillName}".`,
      link: "/dashboard",
      relatedId: session._id,
      relatedModel: "Session"
    });
    return res.json({ message: "Reminder sent" });
  } catch (error) {
    console.error("Payment reminder error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

