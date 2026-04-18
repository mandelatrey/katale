import { describe, it, expect } from "vitest";
import { formatReply } from "../whatsapp/formatter.js";
import { parseIntent } from "../whatsapp/intents/parse.js";
import { route } from "../whatsapp/router.js";
import {
  getSessionStore,
  setSessionStore,
} from "../whatsapp/sessions.js";

describe("whatsapp router (stub phase)", () => {
  it("parseIntent returns unknown for any text (stub)", () => {
    expect(parseIntent("prices", null)).toEqual({ kind: "unknown" });
  });

  it("route returns not_implemented and preserves session", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "hi" },
      user: null,
      session: { state: "idle", data: {} },
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.kind).toBe("not_implemented");
    expect(result.nextSession).toEqual({ state: "idle", data: {} });
  });

  it("route seeds an empty session when none exists", async () => {
    const result = await route({
      message: { fromPhoneE164: "+256700000001", text: "hi" },
      user: null,
      session: null,
      actor: { userId: null, source: "whatsapp" },
    });
    expect(result.nextSession).toEqual({ state: "idle", data: {} });
  });

  it("formatReply covers known kinds and falls back gracefully", () => {
    expect(formatReply({ kind: "not_implemented" })).toMatch(/preview/);
    expect(formatReply({ kind: "error", message: "boom" })).toBe("boom");
    expect(formatReply({ kind: "mystery" })).toMatch(/didn't understand/);
  });
});

describe("whatsapp session store", () => {
  it("in-memory store round-trips a session", async () => {
    const store = getSessionStore();
    await store.save("+256700000001", { state: "awaiting_quantity", data: { commodity: "Maize" } });
    const loaded = await store.load("+256700000001");
    expect(loaded.state).toBe("awaiting_quantity");
    expect(loaded.updatedAt).toBeTypeOf("number");
    await store.clear("+256700000001");
    expect(await store.load("+256700000001")).toBeNull();
  });

  it("setSessionStore swaps the impl", async () => {
    const prev = getSessionStore();
    const fake = { load: async () => ({ state: "x", data: {} }), save: async () => {}, clear: async () => {} };
    setSessionStore(fake);
    expect(await getSessionStore().load("+")).toEqual({ state: "x", data: {} });
    setSessionStore(prev);
  });
});
