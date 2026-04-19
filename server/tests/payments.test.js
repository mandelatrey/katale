import { describe, it, expect } from "vitest";
import Payment from "../models/Payment.js";
import { listPayments, getPaymentStats } from "../services/payments.js";
import { hasMongo } from "./setup.js";

describe("payments service", () => {
  it("listPayments filters by status", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Payment.create([
      {
        paymentId: "PAY-00001",
        amount: 1000,
        method: "mobile_money",
        status: "pending",
      },
      {
        paymentId: "PAY-00002",
        amount: 2000,
        method: "cash",
        status: "completed",
      },
    ]);
    const pending = await listPayments({ status: "pending" }, null);
    expect(pending).toHaveLength(1);
    expect(pending[0].paymentId).toBe("PAY-00001");
  });

  it("getPaymentStats aggregates totals", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Payment.create([
      { paymentId: "P1", amount: 500, method: "cash", status: "completed" },
      { paymentId: "P2", amount: 300, method: "cash", status: "pending" },
    ]);
    const stats = await getPaymentStats({}, null);
    expect(stats.totalCollected).toBe(500);
    expect(stats.totalPending).toBe(300);
  });
});
