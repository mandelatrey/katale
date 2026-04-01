import Payment from "../models/Payment.js";

export async function getPayments({ status, method, limit = 50, skip = 0 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;
  return Payment.find(filter)
    .populate("transaction", "transactionId commodity quantity totalAmount")
    .sort({ date: -1 })
    .limit(Number(limit))
    .skip(Number(skip));
}

export async function getPaymentStats() {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalCollected: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] },
        },
        totalPending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] },
        },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        mobileMoney: {
          $sum: { $cond: [{ $eq: ["$method", "mobile_money"] }, 1, 0] },
        },
      },
    },
  ]);
  return stats[0] || { total: 0, totalCollected: 0, totalPending: 0, completed: 0, mobileMoney: 0 };
}

export async function getPaymentById(id) {
  const payment = await Payment.findById(id).populate("transaction");
  if (!payment) throw Object.assign(new Error("Payment not found"), { status: 404 });
  return payment;
}
