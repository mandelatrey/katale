import Payment from "../models/Payment.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import { listPaymentsSchema, paymentIdSchema } from "./schemas/payments.js";

// Payments are read-only from the API layer's point of view — they are created
// as a side effect of createTransaction. The WhatsApp bot will surface
// "list my pending payments" and "show payment details".

export async function listPayments(params = {}, _actor) {
  const { status, method, limit, skip } = parse(
    listPaymentsSchema,
    params,
    "payment filter",
  );
  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;
  return Payment.find(filter)
    .populate("transaction", "transactionId commodity quantity totalAmount")
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip);
}

export async function getPaymentStats(_params = {}, _actor) {
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
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        mobileMoney: {
          $sum: { $cond: [{ $eq: ["$method", "mobile_money"] }, 1, 0] },
        },
      },
    },
  ]);
  return (
    stats[0] || {
      total: 0,
      totalCollected: 0,
      totalPending: 0,
      completed: 0,
      mobileMoney: 0,
    }
  );
}

export async function getPaymentById(params, _actor) {
  const { id } = parse(paymentIdSchema, params, "payment id");
  const payment = await Payment.findById(id).populate("transaction");
  if (!payment) throw notFound("Payment not found");
  return payment;
}
