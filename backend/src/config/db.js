import mongoose from "mongoose";

export const connectDB = async (mongoUri) => {
  try {
    const uri = mongoUri || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

