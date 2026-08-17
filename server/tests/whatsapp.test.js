import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { formatReply } from "../whatsapp/formatter.js";
import { parseIntent } from "../whatsapp/intents/parse.js";
import { route } from "../whatsapp/router.js";
import {
  getSessionStore,
  setSessionStore,
} from "../whatsapp/sessions.js";
import Market from "../models/Market.js";
import Price from "../models/Price.js";
import Payment from "../models/Payment.js";
import Transaction from "../models/Transaction.js";
import { hasMongo } from "./setup.js";

describe("whatsapp intent parser", () => {
  it("maps greetings to help", () => {
    expect(parseIntent("hi", null).kind).toBe("help");
    expect(parseIntent("HELP", null).kind).toBe("help");
    expect(parseIntent("menu", null).kind).toBe("help");
  });

  it("maps price queries with and without a commodity", () => {
    expect(parseIntent("prices", null)).toEqual({
      kind: "price_check",
      args: {},
    });
    expect(parseIntent("price of maize", null)).toEqual({
      kind: "price_check",
      args: { commodity: "maize" },
    });
  });

  it("maps market queries and parses coordinates", () => {
    expect(parseIntent("markets near me", null)).toEqual({
      kind: "nearby_markets",
      args: {},
    });
    expect(
      parseIntent("nearby markets 0.3476, 32.5825", null),
    ).toEqual({
      kind: "nearby_markets",
      args: { lat: 0.3476, lng: 32.5825 },
    });
  });

  it("maps payment / statement keywords", () => {
    expect(parseIntent("pending payments", null).kind).toBe(
      "list_pending_payments",
    );
    expect(parseIntent("latest statement", null).kind).toBe(
      "latest_statement",
    );
  });

  it("uses session state to interpret a follow-up reply", () => {
    expect(
      parseIntent("beans", { state: "awaiting_price_commodity", data: {} }),
    ).toEqual({ kind: "price_check", args: { commodity: "beans" } });
  });
});

describe("whatsapp router (no DB paths)", () => {
  it("routes unknown text back to an unknown result", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "lkjahsdf" },
      user: null,
      session: { state: "idle", data: {} },
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("unknown");
    expect(result.nextSession).toEqual({ state: "idle", data: {} });
  });

  it("prompts for a commodity when none was provided", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "prices" },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("prompt_commodity");
    expect(result.nextSession.state).toBe("awaiting_price_commodity");
  });

  it("prompts for a location when markets are asked for without coords", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "markets near me" },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("prompt_location");
    expect(result.nextSession.state).toBe("awaiting_nearby_location");
  });

  it("returns help for greetings", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "hi" },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("help");
  });
});

describe.skipIf(!hasMongo())("whatsapp router (DB-backed)", () => {
  beforeEach(async () => {
    // seed a market + a price + a pending payment
    const market = await Market.create({
      name: "Nakasero",
      location: { type: "Point", coordinates: [32.5825, 0.3476] },
      region: "Central",
      district: "Kampala",
    });
    await Price.create({
      market: market._id,
      commodity: "maize",
      price: 2000,
      unit: "kg",
      currency: "UGX",
      priceType: "retail",
    });
    const txn = await Transaction.create({
      transactionId: "TXN-00001",
      type: "buy",
      commodity: "maize",
      quantity: 100,
      unitPrice: 2000,
      totalAmount: 200000,
    });
    await Payment.create({
      paymentId: "PAY-00001",
      transaction: txn._id,
      amount: 200000,
      method: "mobile_money",
      status: "pending",
    });
  });

  it("returns latest prices for a commodity", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "price of maize" },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("price_check");
    expect(result.prices).toHaveLength(1);
    expect(result.prices[0].marketInfo.name).toBe("Nakasero");
    expect(formatReply(result)).toMatch(/Nakasero/);
  });

  it("returns markets near the given coordinates", async () => {
    const result = await route({
      message: {
        fromPhoneE164: "+256700000001",
        text: "nearby markets 0.3476, 32.5825",
      },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("nearby_markets");
    expect(result.markets[0].name).toBe("Nakasero");
  });

  it("lists pending payments", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "pending payments" },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("list_pending_payments");
    expect(result.payments).toHaveLength(1);
    expect(formatReply(result)).toMatch(/TXN-00001/);
  });

  it("cancels a transaction by id", async () => {
    const txn = await Transaction.findOne({ transactionId: "TXN-00001" });
    const result = await route({
      message: {
        fromPhoneE164: "+256700000001",
        text: `cancel ${txn._id.toString()}`,
      },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("cancel_transaction");
    expect(result.transaction.status).toBe("cancelled");
  });
});

describe("whatsapp formatter", () => {
  it("renders known kinds and falls back for unknown ones", () => {
    expect(formatReply({ kind: "help" })).toMatch(/price of/i);
    expect(formatReply({ kind: "unknown" })).toMatch(/HELP/);
    expect(formatReply({ kind: "not_implemented" })).toMatch(/isn't wired/);
    expect(formatReply({ kind: "error", message: "boom" })).toBe("boom");
    expect(formatReply({ kind: "mystery" })).toMatch(/didn't understand/);
  });

  it("formats a price list with a money string", () => {
    const out = formatReply({
      kind: "price_check",
      commodity: "maize",
      prices: [
        {
          price: 2000,
          unit: "kg",
          currency: "UGX",
          priceType: "retail",
          marketInfo: { name: "Nakasero", district: "Kampala" },
        },
      ],
    });
    expect(out).toMatch(/UGX 2,000/);
    expect(out).toMatch(/Nakasero, Kampala/);
  });
});

describe("whatsapp session store", () => {
  it("in-memory store round-trips a session", async () => {
    const store = getSessionStore();
    await store.save("+256700000002", {
      state: "awaiting_price_commodity",
      data: { commodity: "Maize" },
    });
    const loaded = await store.load("+256700000002");
    expect(loaded.state).toBe("awaiting_price_commodity");
    expect(loaded.updatedAt).toBeTypeOf("number");
    await store.clear("+256700000002");
    expect(await store.load("+256700000002")).toBeNull();
  });

  it("setSessionStore swaps the impl", async () => {
    const prev = getSessionStore();
    const fake = {
      load: async () => ({ state: "x", data: {} }),
      save: async () => {},
      clear: async () => {},
    };
    setSessionStore(fake);
    expect(await getSessionStore().load("+")).toEqual({ state: "x", data: {} });
    setSessionStore(prev);
  });
});

// Keep mongoose reference alive so the import isn't tree-shaken.
void mongoose;
