import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Payment from "../models/Payment.js";
import {
  createTransaction,
  listTransactions,
} from "../services/transactions.js";
import { hasMongo } from "./setup.js";

const actor = { userId: new mongoose.Types.ObjectId().toString(), source: "whatsapp" };

describe("transactions service", () => {
  it("createTransaction persists with actor on createdBy", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const txn = await createTransaction(
      {
        type: "buy",
        commodity: "Maize",
        quantity: 100,
        unitPrice: 1200,
        buyer: "Alice",
        seller: "Bob",
      },
      actor,
    );
    expect(txn.transactionId).toMatch(/^TXN-\d{5}$/);
    expect(txn.totalAmount).toBe(120000);
    expect(txn.createdBy.toString()).toBe(actor.userId);
    expect(await Payment.countDocuments()).toBe(0);
  });

  it("createTransaction auto-creates a payment when method is supplied", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await createTransaction(
      {
        type: "sell",
        commodity: "Beans",
        quantity: 50,
        unitPrice: 3000,
        buyer: "Coop",
        seller: "Dan",
        paymentMethod: "mobile_money",
      },
      actor,
    );
    const payments = await Payment.find({});
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(150000);
    expect(payments[0].status).toBe("pending");
  });

  it("listTransactions filters by status", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Transaction.create([
      {
        transactionId: "TXN-00001",
        type: "buy",
        commodity: "Maize",
        quantity: 1,
        unitPrice: 1,
        totalAmount: 1,
        status: "pending",
      },
      {
        transactionId: "TXN-00002",
        type: "buy",
        commodity: "Maize",
        quantity: 1,
        unitPrice: 1,
        totalAmount: 1,
        status: "delivered",
      },
    ]);
    const pending = await listTransactions({ status: "pending" }, null);
    expect(pending).toHaveLength(1);
    expect(pending[0].transactionId).toBe("TXN-00001");
  });

  it("createTransaction rejects bad input with a 400 HttpError", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await expect(
      createTransaction({ type: "buy", commodity: "", quantity: -1, unitPrice: 0 }, actor),
    ).rejects.toMatchObject({ status: 400 });
  });
});
