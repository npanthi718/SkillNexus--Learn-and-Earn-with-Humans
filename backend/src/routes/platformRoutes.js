import express from "express";
import { PlatformConfig } from "../models/PlatformConfig.js";
import { LegalContent } from "../models/LegalContent.js";

const router = express.Router();

// Public: get company payment details (for learners to pay platform)
router.get("/payment-details", async (req, res) => {
  try {
    let config = await PlatformConfig.findOne();
    if (!config) {
      config = await PlatformConfig.create({ platformFeePercent: 10 });
    }
    return res.json({
      paymentDetails: config.paymentDetails || [],
      platformFeePercent: config.platformFeePercent ?? 10,
      logoUrl: config.logoUrl || "",
      googleClientId: config.googleClientId || ""
    });
  } catch (error) {
    console.error("Platform payment details error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Public: get currency rates and country mapping
router.get("/currencies", async (req, res) => {
  try {
    let config = await PlatformConfig.findOne();
    if (!config) {
      config = await PlatformConfig.create({ platformFeePercent: 10 });
    }
    return res.json({
      currencyRates: config.currencyRates || [],
      countryCurrency: config.countryCurrency || []
    });
  } catch (error) {
    console.error("Platform currencies error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Public: get legal content (privacy, terms)
router.get("/legal/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (!["privacy", "terms"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    let doc = await LegalContent.findOne({ type });
    if (!doc) {
      const defaults = {
        privacy: { title: "Privacy Policy", content: "We collect and use your information to provide our services. We do not share your data with third parties without consent. You can request deletion of your data at any time." },
        terms: { title: "Terms of Service", content: "By using SkillNexus you agree to our terms. Use the platform responsibly. We reserve the right to suspend accounts that violate our policies." }
      };
      doc = await LegalContent.create({ type, ...defaults[type] });
    }
    return res.json(doc);
  } catch (error) {
    console.error("Legal content error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
