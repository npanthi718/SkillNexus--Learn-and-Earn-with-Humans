import mongoose from "mongoose";

const SkillToTeachSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    bio: { type: String, default: "" },
    profilePic: { type: String, default: "" },

    // Optional intro video URL (YouTube, Loom, etc.)
    introVideoUrl: { type: String, default: "" },

    // Social links for identity verification and branding
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      website: { type: String, default: "" },
      twitter: { type: String, default: "" }
    },

    // Languages this user can comfortably teach in
    teachingLanguages: { type: [String], default: [] },

    // Simple availability slots; can be expanded into a full calendar
    availabilitySlots: {
      type: [
        {
          dayOfWeek: { type: String }, // e.g. "Monday"
          from: { type: String }, // "18:00"
          to: { type: String } // "20:00"
        }
      ],
      default: []
    },

    // Account type chosen at signup
    accountType: { type: String, enum: ["Learner", "Teacher", "Both"], default: "Learner" },

    role: { type: String, enum: ["Admin", "User"], default: "User" },

    // Skill marketplace data
    skillsToTeach: { type: [SkillToTeachSchema], default: [] },
    skillsToLearn: { type: [String], default: [] },

    // Optional learner side: track what they have already mastered
    masteredSubjects: { type: [String], default: [] },

    // Wishlist of skills they want to learn
    wishlistSkills: { type: [String], default: [] },

    // Whether the dashboard is currently in teacher mode or learner mode
    isTeacherMode: { type: Boolean, default: false },

    // Simple rating array; trust score is computed from these
    ratings: { type: [Number], default: [] },

    // Home country for currency display (e.g. NP, US, IN)
    country: { type: String, default: "NP", trim: true },

    // Identity and trust
    isVerified: { type: Boolean, default: false },
    // Separate verification states
    isLearnerVerified: { type: Boolean, default: false },
    isTeacherVerified: { type: Boolean, default: false },
    // Verification workflow
    verificationRequests: {
      type: [
        {
          role: { type: String, enum: ["Learner", "Teacher"], required: true },
          status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
          message: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
          decidedAt: { type: Date }
        }
      ],
      default: []
    },

    // Verification documents - learner: ID/photo proof; teacher: certificates
    verificationPhotos: { type: [{ url: String }], default: [] },
    teacherCertificates: { type: [{ url: String }], default: [] },
    verificationSubmittedAt: { type: Date },
    verificationFeedback: {
      type: [
        {
          role: { type: String, enum: ["Learner", "Teacher"], required: true },
          message: { type: String, required: true },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    // Friends
    friends: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
    friendRequests: {
      type: [
        {
          fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },

    // Security questions for password reset (answers are hashed)
    securityQuestions: {
      type: [
        {
          question: { type: String },
          answerHash: { type: String }
        }
      ],
      default: []
    },

    // Presence tracking for "online now"
    lastActiveAt: { type: Date, default: Date.now },

    // Admin-awarded badges
    badges: { type: [String], default: [] },

    // Payment details for paid teachers (QR, bank info)
    paymentDetails: {
      type: [
        {
          bankName: { type: String, default: "" },
          country: { type: String, default: "" },
          bankDetails: { type: String, default: "" },
          qrCodeUrl: { type: String, default: "" }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
