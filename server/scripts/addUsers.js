// Migration: creates the users collection + backfills indexes on existing
// collections that now carry optional User refs.
//
// This script is IDEMPOTENT — safe to run repeatedly. It does NOT touch
// existing data (transactions/payments keep their string buyer/seller/
// paidBy/paidTo fields intact). It only:
//
//   1. Ensures the `users` collection exists with the right indexes.
//   2. Creates the new indexes on Transaction / Payment that the updated
//      schemas declare.
//   3. (Optionally) seeds a small set of dev users when RUN_DEV_SEED=1
//      so you can locally test the WhatsApp webhook end-to-end.
//
// Run with: npm run migrate:users
//           RUN_DEV_SEED=1 npm run migrate:users    (adds 2 demo users)

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Payment from "../models/Payment.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";

async function main() {
  await mongoose.connect(MONGODB_URI, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log("[migrate:users] connected to", MONGODB_URI);

  // 1. Ensure collection + indexes exist.
  await User.init();
  await Transaction.syncIndexes();
  await Payment.syncIndexes();
  console.log("[migrate:users] synced indexes on User / Transaction / Payment");

  // 2. Report counts.
  const counts = {
    users: await User.countDocuments(),
    transactions: await Transaction.countDocuments(),
    transactionsWithCreator: await Transaction.countDocuments({
      createdBy: { $exists: true, $ne: null },
    }),
  };
  console.log("[migrate:users] counts:", counts);

  // 3. Optional dev seed — two archetype users with fake E.164 numbers.
  if (process.env.RUN_DEV_SEED === "1") {
    const seed = [
      { name: "Ismail M. (Broker)", phoneE164: "+256700000001", role: "broker" },
      { name: "Nabirye F. (Farmer)", phoneE164: "+256700000002", role: "farmer" },
    ];
    for (const u of seed) {
      const existing = await User.findOne({ phoneE164: u.phoneE164 });
      if (existing) {
        console.log(`[migrate:users] skip ${u.phoneE164} — already exists`);
        continue;
      }
      await User.create(u);
      console.log(`[migrate:users] seeded ${u.phoneE164} (${u.role})`);
    }
  }

  await mongoose.disconnect();
  console.log("[migrate:users] done");
}

main().catch((err) => {
  console.error("[migrate:users] failed:", err);
  process.exit(1);
});
