import mongoose from 'mongoose';
import Transaction from "../models/Transaction.js";
import Payment from "../models/Payment.js";
import { parse } from "../lib/validate.js";
import { nextSeq } from '../lib/sequence.js';
import { notFound } from "../lib/errors.js";
import {
  listTransactionsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdSchema,
} from "./schemas/transactions.js";

const POPULATE_OPTS = [
  { path: "fromMarket", select: "name district" },
  { path: "toMarket", select: "name district" },
];

export async function listTransactions(params = {}, _actor) {
  const { commodity, status, type, limit, skip } = parse(
    listTransactionsSchema,
    params,
    "transaction filter",
  );
  const filter = {};
  if (commodity) filter.commodity = commodity;
  if (status) filter.status = status;
  if (type) filter.type = type;
  return Transaction.find(filter)
    .populate(POPULATE_OPTS)
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip);
}

export async function getTransactionStats(_params = {}, _actor) {
  const stats = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalVolume: { $sum: "$quantity" },
        totalValue: { $sum: "$totalAmount" },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
      },
    },
  ]);
  return (
    stats[0] || {
      total: 0,
      totalVolume: 0,
      totalValue: 0,
      pending: 0,
      delivered: 0,
    }
  );
}

export async function getTransactionById(params, _actor) {
  const { id } = parse(transactionIdSchema, params, "transaction id");
  const txn = await Transaction.findById(id).populate([
    { path: "fromMarket", select: "name district region" },
    { path: "toMarket", select: "name district region" },
  ]);
  if (!txn) throw notFound("Transaction not found");
  return txn;
}

export async function createTransaction(data, actor) {
  const body = parse(createTransactionSchema, data, "transaction");
  const totalAmount = Math.round(body.quantity * body.unitPrice);

  const session = await mongoose.startSession();

  try {
    let txnId;
    await session.withTransaction(async () => {
      const seq = await nextSeq("transaction", session);
      const transactionId = `TXN-${String(seq).padStart(5, "0")}`;

      const txn = await Transaction.create(
        [
          {
            transactionId,
            type: body.type,
            commodity: body.commodity,
            quantity: body.quantity,
            unitPrice: body.unitPrice,
            totalAmount,
            currency: body.currency,
            fromMarket: body.fromMarket,
            toMarket: body.toMarket,
            buyer: body.buyer,
            seller: body.seller,
            status: body.status || "pending",
            notes: body.notes,
            createdBy: actor?.userId || undefined,
          },
        ], { session },
      );

      if (body.paymentMethod) {
      const paySeq = await nextSeq("payment", session);
      await Payment.create(
        [
          {
            paymentId: `PAY-${String(paySeq).padStart(5, "0")}`,
            transaction: txn._id,
            amount: totalAmount,
            currency: body.currency,
            method: body.paymentMethod,
            provider: body.paymentProvider || null,
            status: "pending",
            paidBy: body.paymentPaidBy || body.buyer || undefined,
            paidTo: body.paymentPaidTo || body.seller || undefined,
            reference: `REF${Math.floor(Math.random() * 900000) + 100000}`,
          }
        ], { session },
      );
      }

      txnId = txn._id;
    });

    return Transaction.findById(txnId).populate(POPULATE_OPTS);

  } finally {
    session.endSession();
  };
};


export async function deleteTransaction(params, _actor) {
  const { id } = parse(transactionIdSchema, params, "transaction id");
  const txn = await Transaction.findByIdAndDelete(id);
  if (!txn) throw notFound("Transaction not found");
  await Payment.deleteMany({ transaction: id });
  return { ok: true };
}

export async function updateTransaction({ id, ...data }, _actor) {
  const { id: tid } = parse(transactionIdSchema, { id }, "transaction id");
  const update = parse(updateTransactionSchema, data, "transaction update");

  // Zod lets callers pass null to clear a ref; mongoose wants undefined.
  const clean = {};
  for (const [k, v] of Object.entries(update)) clean[k] = v ?? undefined;

  const txn = await Transaction.findByIdAndUpdate(tid, clean, {
    new: true,
  }).populate(POPULATE_OPTS);
  if (!txn) throw notFound("Transaction not found");
  return txn;
}
