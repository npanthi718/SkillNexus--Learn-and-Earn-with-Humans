import mongoose from "mongoose";

const PaymentDetailSchema = new mongoose.Schema(
  {
    bankName: { type: String, default: "" },
    country: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
    qrCodeUrl: { type: String, default: "" },
    type: { type: String, enum: ["national", "international"], default: "national" }
  },
  { _id: false }
);

const PlatformConfigSchema = new mongoose.Schema(
  {
    // Platform fee percentage (e.g. 10 = 10%)
    platformFeePercent: { type: Number, default: 10, min: 0, max: 100 },
    // Company bank details for learners to pay (national/international)
    paymentDetails: { type: [PaymentDetailSchema], default: [] },
    // Platform logo URL (from Cloudinary)
    logoUrl: { type: String, default: "" },
    // OAuth: Google client id for Identity Services
    googleClientId: { type: String, default: "" },
    // Admin-managed currency list with editable rates to USD
    currencyRates: {
      type: [
        {
          code: { type: String, required: true }, // e.g., USD, NPR
          name: { type: String, default: "" },
          rateToUSD: { type: Number, default: 1, min: 0 },
          buyToUSD: { type: Number, default: 1, min: 0 },
          sellToUSD: { type: Number, default: 1, min: 0 }
        }
      ],
      default: []
    },
    // Admin-managed mapping from country code to currency code
    countryCurrency: {
      type: [
        {
          countryCode: { type: String, required: true }, // e.g., US, NP
          currencyCode: { type: String, required: true } // e.g., USD, NPR
        }
      ],
      default: []
    },
    // Admin-managed country list with names
    countries: {
      type: [
        {
          code: { type: String, required: true }, // e.g., US, NP
          name: { type: String, default: "" } // e.g., United States, Nepal
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const PlatformConfig = mongoose.model("PlatformConfig", PlatformConfigSchema);
