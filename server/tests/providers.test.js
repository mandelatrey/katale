import { describe, it, expect } from "vitest";
import { providerFromRequest } from "../whatsapp/providers/index.js";
import { twilioProvider } from "../whatsapp/providers/twilio.js";
import { metaProvider } from "../whatsapp/providers/meta.js";

const fakeReq = ({ headers = {}, body = {} } = {}) => ({
  get: (name) => headers[name.toLowerCase()],
  body,
});

describe("providerFromRequest", () => {
  it("selects meta for Meta Cloud API payloads", () => {
    expect(
      providerFromRequest(
        fakeReq({ body: { object: "whatsapp_business_account" } }),
      ),
    ).toBe(metaProvider);
  });

  it("selects twilio for Twilio form payloads", () => {
    expect(
      providerFromRequest(fakeReq({ body: { From: "whatsapp:+256..." } })),
    ).toBe(twilioProvider);
  });

  it("honours x-whatsapp-provider override", () => {
    expect(
      providerFromRequest(
        fakeReq({ headers: { "x-whatsapp-provider": "meta" } }),
      ),
    ).toBe(metaProvider);
  });

  it("defaults to twilio for unknown shapes", () => {
    expect(providerFromRequest(fakeReq())).toBe(twilioProvider);
  });

  it("parseInbound returns null for unrecognised body shapes", async () => {
    // empty body → no whatsapp: prefix → null (not a throw)
    expect(await twilioProvider.parseInbound({})).toBeNull();
    expect(await metaProvider.parseInbound({})).toBeNull();
  });

  it("sendOutbound throws when credentials are missing", async () => {
    await expect(metaProvider.sendOutbound({ to: "+256700000001", text: "hi" }))
      .rejects.toThrow(/not configured/);
  });
});
