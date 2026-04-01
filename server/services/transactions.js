import Transaction from "../models/Transaction.js";
import Payment from "../models/Payment.js";

const POPULATE_OPTS = [
  { path: "fromMarket", select: "name district" },
  { path: "toMarket",   select: "name district" },
  { path: "carrier",    select: "name phone vehicleModel vehicleType" },
  { path: "asset",      select: "name type" },
];

export async function getTransactions({ commodity, status, type, limit = 50, skip = 0 } = {}) {
  const filter = {};
  if (commodity) filter.commodity = commodity;
  if (status) filter.status = status;
  if (type) filter.type = type;
  return Transaction.find(filter)
    .populate(POPULATE_OPTS)
    .sort({ date: -1 })
    .limit(Number(limit))
    .skip(Number(skip));
}

export async function getTransactionStats() {
  const stats = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalVolume: { $sum: "$quantity" },
        totalValue: { $sum: "$totalAmount" },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
      },
    },
  ]);
  return stats[0] || { total: 0, totalVolume: 0, totalValue: 0, pending: 0, delivered: 0 };
}

export async function getTransactionById(id) {
  const txn = await Transaction.findById(id).populate([
    { path: "fromMarket", select: "name district region" },
    { path: "toMarket",   select: "name district region" },
    { path: "carrier",    select: "name phone vehicleModel vehicleType" },
    { path: "asset",      select: "name type status" },
  ]);
  if (!txn) throw Object.assign(new Error("Transaction not found"), { status: 404 });
  return txn;
}

export async function createTransaction(data) {
  const {
    type, commodity, quantity, unitPrice, currency = "UGX",
    fromMarket, toMarket, buyer, seller, carrier, asset, status, notes,
    paymentMethod, paymentProvider, paymentPaidBy, paymentPaidTo,
  } = data;

  if (!type || !commodity || !quantity || !unitPrice) {
    throw Object.assign(new Error("type, commodity, quantity, and unitPrice are required"), { status: 400 });
  }

  const count = await Transaction.countDocuments();
  const transactionId = `TXN-${String(count + 1).padStart(5, "0")}`;
  const totalAmount = Math.round(Number(quantity) * Number(unitPrice));

  const txn = await Transaction.create({
    transactionId,
    type,
    commodity,
    quantity: Number(quantity),
    unitPrice: Number(unitPrice),
    totalAmount,
    currency,
    fromMarket: fromMarket || undefined,
    toMarket:   toMarket   || undefined,
    buyer:   buyer   || undefined,
    seller:  seller  || undefined,
    carrier: carrier || undefined,
    asset:   asset   || undefined,
    status:  status  || "pending",
    notes:   notes   || undefined,
  });

  // Auto-create a linked payment when method is provided
  if (paymentMethod) {
    const payCount = await Payment.countDocuments();
    await Payment.create({
      paymentId: `PAY-${String(payCount + 1).padStart(5, "0")}`,
      transaction: txn._id,
      amount: totalAmount,
      currency,
      method: paymentMethod,
      provider: paymentProvider || null,
      status: "pending",
      paidBy: paymentPaidBy || buyer || undefined,
      paidTo: paymentPaidTo || seller || undefined,
      reference: `REF${Math.floor(Math.random() * 900000) + 100000}`,
    });
  }

  return Transaction.findById(txn._id).populate(POPULATE_OPTS);
}

export async function updateTransaction(id, body) {
  const allowed = ["status", "carrier", "asset", "buyer", "seller", "notes"];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key] || undefined;
  }
  const txn = await Transaction.findByIdAndUpdate(id, update, { new: true })
    .populate(POPULATE_OPTS);
  if (!txn) throw Object.assign(new Error("Transaction not found"), { status: 404 });
  return txn;
}
