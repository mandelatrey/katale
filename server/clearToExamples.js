/**
 * clearToExamples.js
 * Wipes seeded data from all page collections and inserts one example
 * record per collection so the app looks populated but not fake.
 * Run: node server/clearToExamples.js
 * Requires Markets to exist (run seed.js first).
 */
import "dotenv/config";
import mongoose from "mongoose";
import Market from "./models/Market.js";
import Transaction from "./models/Transaction.js";
import Payment from "./models/Payment.js";
import Report from "./models/Report.js";
import Statement from "./models/Statement.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Fetch two real markets to use as references
  const markets = await Market.find().limit(2).lean();
  if (markets.length < 2) {
    console.error("Need at least 2 markets. Run seed.js first.");
    process.exit(1);
  }
  const [m1, m2] = markets;

  // ── Wipe all collections ──────────────────────────────────────────────────
  await Promise.all([
    Transaction.deleteMany({}),
    Payment.deleteMany({}),
    Report.deleteMany({}),
    Statement.deleteMany({}),
  ]);
  console.log("Collections cleared");

  // ── 1 Transaction ─────────────────────────────────────────────────────────
  const txn = await Transaction.create({
    transactionId: "TXN-00001",
    type: "buy",
    commodity: "maize",
    quantity: 500,
    unitPrice: 1200,
    totalAmount: 600_000,
    currency: "UGX",
    fromMarket: m1._id,
    toMarket: m2._id,
    buyer: "Your Buyer Name",
    seller: "Your Seller Name",
    status: "delivered",
    date: new Date(),
  });

  // ── 1 Payment ─────────────────────────────────────────────────────────────
  await Payment.create({
    paymentId: "PAY-00001",
    transaction: txn._id,
    amount: 600_000,
    currency: "UGX",
    method: "mobile_money",
    provider: "MTN MoMo",
    status: "completed",
    paidBy: "Your Buyer Name",
    paidTo: "Your Seller Name",
    reference: "REF-EXAMPLE-001",
    date: new Date(),
  });

  // ── 1 Report ──────────────────────────────────────────────────────────────
  await Report.create({
    reportId: "RPT-001",
    title: "Example Report — Maize Price Trend",
    type: "price_trend",
    period: "April 2026",
    region: "All",
    commodity: "maize",
    summary:
      "This is an example report. Generate your own by recording transactions and reviewing price data over time.",
    data: { avgPrice: 1200, dataPoints: 1 },
    generatedAt: new Date(),
  });

  // ── 1 Statement ───────────────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await Statement.create({
    statementId: "STMT-001",
    period: now.toLocaleString("default", { month: "long", year: "numeric" }),
    startDate: startOfMonth,
    endDate: endOfMonth,
    openingBalance: 0,
    closingBalance: 350_000,
    totalIncome: 600_000,
    totalExpenses: 250_000,
    currency: "UGX",
    entries: [
      {
        date: new Date(),
        description: "Example income — maize sale proceeds",
        type: "income",
        amount: 600_000,
        balance: 600_000,
        reference: "REF-EXAMPLE-001",
      },
      {
        date: new Date(),
        description: "Example expense — transport cost",
        type: "expense",
        amount: 250_000,
        balance: 350_000,
        reference: "REF-EXAMPLE-002",
      },
    ],
  });

  console.log("One example record inserted per collection");
  await mongoose.disconnect();
  console.log("Done. Run the app to see the example data.");
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
