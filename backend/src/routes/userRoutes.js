import express from "express";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/createNotification.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

// Public: browse teachers / users with filters
router.get("/public", async (req, res) => {
  try {
    const { role, skill, q, language, onlineNow } = req.query;
    const query = { role: { $ne: "Admin" } };

    if (role === "Teacher") {
      // Teachers are users with at least one skillToTeach
      query.skillsToTeach = { $exists: true, $not: { $size: 0 } };
      // Only verified teachers are publicly listed
    query.isTeacherVerified = true;
    }

    if (skill) {
      query["skillsToTeach.name"] = { $regex: skill, $options: "i" };
    }

    if (language) {
      query.teachingLanguages = { $regex: language, $options: "i" };
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
        { "skillsToTeach.name": { $regex: q, $options: "i" } }
      ];
    }

    const users = await User.find(query).select(
      "name bio profilePic skillsToTeach ratings createdAt isTeacherVerified teachingLanguages lastActiveAt"
    );

    const now = Date.now();
    const withTrustScore = users.map((u) => {
      const ratings = u.ratings || [];
      const trustScore =
        ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

      const lastActiveAt = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
      const isOnline = lastActiveAt && now - lastActiveAt < 5 * 60 * 1000; // 5 minutes

      return {
        id: u._id,
        name: u.name,
        bio: u.bio,
        profilePic: u.profilePic,
        skillsToTeach: u.skillsToTeach,
        ratings: ratings,
        trustScore: Number(trustScore.toFixed(1)),
        createdAt: u.createdAt,
        isVerified: u.isTeacherVerified,
        teachingLanguages: u.teachingLanguages,
        isOnline
      };
    });

    let filtered = withTrustScore;
    if (onlineNow === "true") {
      filtered = filtered.filter((u) => u.isOnline);
    }

    return res.json({ users: filtered });
  } catch (error) {
    console.error("Browse users error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Public: view one profile
router.get("/:id/public", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name bio profilePic skillsToTeach skillsToLearn ratings createdAt introVideoUrl socialLinks teachingLanguages masteredSubjects wishlistSkills isTeacherVerified paymentDetails country friends"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ratings = user.ratings || [];
    const trustScore =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    const friendsCount = Array.isArray(user.friends) ? user.friends.length : 0;
    return res.json({
      id: user._id,
      name: user.name,
      bio: user.bio,
      profilePic: user.profilePic,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      ratings: ratings,
      trustScore: Number(trustScore.toFixed(1)),
      createdAt: user.createdAt,
      introVideoUrl: user.introVideoUrl,
      socialLinks: user.socialLinks,
      teachingLanguages: user.teachingLanguages,
      masteredSubjects: user.masteredSubjects,
      wishlistSkills: user.wishlistSkills,
      isTeacherVerified: user.isTeacherVerified,
      paymentDetails: user.paymentDetails || [],
      country: user.country || "",
      friendsCount
    });
  } catch (error) {
    console.error("Get public profile error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Private: update own profile (CV-style)
router.put("/me", authRequired, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "bio",
      "profilePic",
      "introVideoUrl",
      "socialLinks",
      "skillsToTeach",
      "skillsToLearn",
      "teachingLanguages",
      "masteredSubjects",
      "wishlistSkills",
      "paymentDetails",
      "country",
      "verificationPhotos",
      "teacherCertificates",
      "verificationSubmittedAt"
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true
    }).select("-password");

    const friendsCount = Array.isArray(updated.friends) ? updated.friends.length : 0;
    return res.json({ user: updated, friendsCount });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Friend requests
router.post("/friends/:otherId/request", authRequired, async (req, res) => {
  try {
    const otherId = req.params.otherId;
    if (String(otherId) === String(req.user._id)) return res.status(400).json({ message: "Cannot friend yourself" });
    const me = await User.findById(req.user._id);
    const other = await User.findById(otherId);
    if (!me || !other) return res.status(404).json({ message: "User not found" });
    if ((me.friends || []).some((f) => String(f) === String(otherId))) {
      return res.json({ message: "Already friends" });
    }
    if ((other.friendRequests || []).some((fr) => String(fr.fromUserId) === String(req.user._id) && fr.status === "pending")) {
      return res.json({ message: "Request already sent" });
    }
    other.friendRequests = [ ...(other.friendRequests || []), { fromUserId: req.user._id, status: "pending" } ];
    await other.save();
    await createNotification({
      userId: other._id,
      type: "friend_request",
      title: "Friend request",
      body: `${me.name} sent you a friend request`,
      link: `/profile/${me._id}`,
      relatedId: me._id,
      relatedModel: "User"
    });
    return res.json({ message: "Request sent" });
  } catch (error) {
    console.error("Friend request error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/friends/:otherId/accept", authRequired, async (req, res) => {
  try {
    const otherId = req.params.otherId;
    const me = await User.findById(req.user._id);
    const other = await User.findById(otherId);
    if (!me || !other) return res.status(404).json({ message: "User not found" });
    const idx = (me.friendRequests || []).findIndex((fr) => String(fr.fromUserId) === String(otherId) && fr.status === "pending");
    if (idx < 0) return res.status(400).json({ message: "No pending request" });
    me.friendRequests[idx].status = "accepted";
    me.friends = [ ...(me.friends || []), other._id ];
    other.friends = [ ...(other.friends || []), me._id ];
    await Promise.all([me.save(), other.save()]);
    await createNotification({
      userId: other._id,
      type: "friend_accepted",
      title: "Friend request accepted",
      body: `${me.name} accepted your friend request`,
      link: `/profile/${me._id}`,
      relatedId: me._id,
      relatedModel: "User"
    });
    return res.json({ message: "Now friends" });
  } catch (error) {
    console.error("Friend accept error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/friends/:otherId/reject", authRequired, async (req, res) => {
  try {
    const otherId = req.params.otherId;
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ message: "User not found" });
    const idx = (me.friendRequests || []).findIndex((fr) => String(fr.fromUserId) === String(otherId) && fr.status === "pending");
    if (idx < 0) return res.status(400).json({ message: "No pending request" });
    me.friendRequests[idx].status = "rejected";
    await me.save();
    await createNotification({
      userId: otherId,
      type: "friend_rejected",
      title: "Friend request rejected",
      body: `${me.name} rejected your friend request`,
      link: `/profile/${me._id}`,
      relatedId: me._id,
      relatedModel: "User"
    });
    return res.json({ message: "Request rejected" });
  } catch (error) {
    console.error("Friend reject error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/friends", authRequired, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate("friends", "name profilePic");
    const friends = (me.friends || []).map((u) => ({ id: u._id, name: u.name, profilePic: u.profilePic }));
    return res.json({ friends, count: friends.length });
  } catch (error) {
    console.error("List friends error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/friend-requests", authRequired, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate("friendRequests.fromUserId", "name profilePic");
    const requests = (me.friendRequests || [])
      .filter((fr) => fr.status === "pending")
      .map((fr) => ({
        fromUserId: fr.fromUserId?._id || fr.fromUserId,
        name: fr.fromUserId?.name || "Unknown",
        profilePic: fr.fromUserId?.profilePic || "",
        createdAt: fr.createdAt
      }));
    return res.json({ requests });
  } catch (error) {
    console.error("List friend requests error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Check if an email is registered
router.get("/check-email", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email }).select("_id name email profilePic");
    return res.json({ exists: !!user, user });
  } catch (error) {
    console.error("Check email error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Relation status between current user and another
router.get("/relation/:otherId", authRequired, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const other = await User.findById(req.params.otherId);
    if (!me || !other) return res.status(404).json({ message: "User not found" });
    const areFriends =
      (me.friends || []).some((id) => String(id) === String(other._id)) &&
      (other.friends || []).some((id) => String(id) === String(me._id));
    if (areFriends) return res.json({ status: "friends" });
    const received = (me.friendRequests || []).some(
      (fr) => String(fr.fromUserId) === String(other._id) && fr.status === "pending"
    );
    if (received) return res.json({ status: "received" });
    const sent = (other.friendRequests || []).some(
      (fr) => String(fr.fromUserId) === String(me._id) && fr.status === "pending"
    );
    if (sent) return res.json({ status: "sent" });
    return res.json({ status: "none" });
  } catch (error) {
    console.error("Relation status error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Check if a user exists by email (minimal info; authenticated)
router.get("/exists-by-email", authRequired, async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email }).select("_id name email");
    if (!user) return res.json({ exists: false });
    return res.json({ exists: true, user: { id: user._id, name: user.name } });
  } catch (error) {
    console.error("Exists by email error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Cancel a sent friend request (revert)
router.post("/friends/:otherId/cancel", authRequired, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const other = await User.findById(req.params.otherId);
    if (!me || !other) return res.status(404).json({ message: "User not found" });
    const idx = (other.friendRequests || []).findIndex(
      (fr) => String(fr.fromUserId) === String(me._id) && fr.status === "pending"
    );
    if (idx < 0) return res.status(400).json({ message: "No pending request to cancel" });
    other.friendRequests.splice(idx, 1);
    await other.save();
    try {
      await Notification.deleteMany({
        userId: other._id,
        type: "friend_request",
        relatedId: me._id
      });
    } catch {}
    return res.json({ message: "Request canceled" });
  } catch (error) {
    console.error("Cancel friend request error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Unfriend
router.post("/friends/:otherId/unfriend", authRequired, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const other = await User.findById(req.params.otherId);
    if (!me || !other) return res.status(404).json({ message: "User not found" });
    me.friends = (me.friends || []).filter((id) => String(id) !== String(other._id));
    other.friends = (other.friends || []).filter((id) => String(id) !== String(me._id));
    await me.save();
    await other.save();
    return res.json({ message: "Unfriended" });
  } catch (error) {
    console.error("Unfriend error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});
// Private: change password
router.put("/me/password", authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { default: bcrypt } = await import("bcryptjs");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

