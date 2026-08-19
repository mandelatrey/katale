// One-off backfill: mark existing admin users as phoneVerified so they can
// keep logging in with password after we start enforcing WhatsApp OTP
// verification. Non-admin users (farmer / broker / staff) are intentionally
// left as unverified — they'll be walked through the OTP flow the next time
// they interact with the app.
//
// Idempotent: safe to re-run.
//
// Run with: node server/scripts/backfillPhoneVerified.js

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";

async function main() {
  await mongoose.connect(MONGODB_URI, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log("[backfill:phoneVerified] connected to", MONGODB_URI);

  const result = await User.updateMany(
    { role: "admin" },
    { $set: { phoneVerified: true } },
  );
  console.log(
    `[backfill:phoneVerified] matched ${result.matchedCount}, modified ${result.modifiedCount}`,
  );

  const summary = {
    admins: await User.countDocuments({ role: "admin" }),
    verifiedAdmins: await User.countDocuments({ role: "admin", phoneVerified: true }),
    unverifiedNonAdmins: await User.countDocuments({
      role: { $ne: "admin" },
      phoneVerified: { $ne: true },
    }),
  };
  console.log("[backfill:phoneVerified] summary:", summary);

  await mongoose.disconnect();
  console.log("[backfill:phoneVerified] done");
}

main().catch((err) => {
  console.error("[backfill:phoneVerified] failed:", err);
  process.exit(1);
});
