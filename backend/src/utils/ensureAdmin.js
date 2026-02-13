import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export const ensureAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@skillnexus.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_NAME || "Platform Admin";

  let admin = await User.findOne({ email });
  if (!admin) {
    const hashed = await bcrypt.hash(password, 10);
    admin = await User.create({
      name,
      email,
      password: hashed,
      role: "Admin"
    });
    console.log(
      `✅ Admin user created.\nEmail: ${email}\nPassword: ${password}\n(Please change these in production.)`
    );
  } else if (admin.role !== "Admin") {
    admin.role = "Admin";
    await admin.save();
    console.log(`✅ Existing user ${email} promoted to Admin.`);
  } else {
    console.log(`✅ Admin user already present: ${email}`);
  }
};

