// Route-level tests for /api/auth — focused on the WhatsApp OTP flow added
// by the phone-verification work. We mock the Twilio Verify provider so no
// network calls happen.
import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import User from "../models/User.js";
import { hasMongo } from "./setup.js";

vi.mock("../whatsapp/providers/twilioVerify.js", () => ({
  startVerification: vi.fn(async () => ({ sid: "VE_test", status: "pending" })),
  checkVerification: vi.fn(async (_phone, code) => ({
    status: code === "123456" ? "approved" : "pending",
    valid: code === "123456",
  })),
}));

// Import after the mock is registered so the auth router picks up the stubs.
const authRoutes = (await import("../routes/auth.js")).default;
const {
  startVerification: startMock,
  checkVerification: checkMock,
} = await import("../whatsapp/providers/twilioVerify.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

describe("POST /api/auth/verify/start", () => {
  beforeEach(() => {
    startMock.mockClear();
    checkMock.mockClear();
  });

  it("400s when phone is missing or malformed", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const app = makeApp();
    const bad = await request(app).post("/api/auth/verify/start").send({});
    expect(bad.status).toBe(400);
    const malformed = await request(app)
      .post("/api/auth/verify/start")
      .send({ phoneE164: "0700000000" });
    expect(malformed.status).toBe(400);
    expect(startMock).not.toHaveBeenCalled();
  });

  it("400s when no user exists for the phone", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/verify/start")
      .send({ phoneE164: "+256700000099" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no account/i);
    expect(startMock).not.toHaveBeenCalled();
  });

  it("sends a verification code for an existing user", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await User.create({ name: "Test", phoneE164: "+256700000010", role: "farmer" });
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/verify/start")
      .send({ phoneE164: "+256700000010" });
    expect(res.status).toBe(200);
    expect(startMock).toHaveBeenCalledWith("+256700000010");
  });
});

describe("POST /api/auth/verify/check", () => {
  beforeEach(() => {
    startMock.mockClear();
    checkMock.mockClear();
  });

  it("marks phoneVerified and issues a JWT for a farmer", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const user = await User.create({
      name: "Farmer F",
      phoneE164: "+256700000020",
      role: "farmer",
    });
    expect(user.phoneVerified).toBe(false);

    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/verify/check")
      .send({ phoneE164: "+256700000020", code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.role).toBe("farmer");

    const refreshed = await User.findById(user._id);
    expect(refreshed.phoneVerified).toBe(true);
  });

  it("marks phoneVerified for a broker and issues a JWT", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await User.create({
      name: "Broker B",
      phoneE164: "+256700000021",
      role: "broker",
    });
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/verify/check")
      .send({ phoneE164: "+256700000021", code: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("marks phoneVerified but does NOT issue a JWT for staff/admin", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await User.create({
      name: "Staff S",
      phoneE164: "+256700000022",
      role: "staff",
    });
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/verify/check")
      .send({ phoneE164: "+256700000022", code: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.token).toBeUndefined();
  });

  it("rejects an invalid code", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await User.create({
      name: "Farmer F",
      phoneE164: "+256700000023",
      role: "farmer",
    });
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/verify/check")
      .send({ phoneE164: "+256700000023", code: "999999" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid|expired/i);
    const refreshed = await User.findOne({ phoneE164: "+256700000023" });
    expect(refreshed.phoneVerified).toBe(false);
  });

  it("400s when the code is not the expected digit shape", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await User.create({
      name: "Farmer F",
      phoneE164: "+256700000024",
      role: "farmer",
    });
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/verify/check")
      .send({ phoneE164: "+256700000024", code: "abc" });
    expect(res.status).toBe(400);
    expect(checkMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/login", () => {
  it("rejects an admin whose phone is not verified", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash("password123", 10);
    await User.create({
      name: "Admin A",
      phoneE164: "+256700000030",
      role: "admin",
      passwordHash,
      phoneVerified: false,
    });
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phoneE164: "+256700000030", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not verified/i);
  });

  it("still rejects a verified admin when FORCE_OTP_FOR_ADMINS is on", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash("password123", 10);
    await User.create({
      name: "Admin A",
      phoneE164: "+256700000032",
      role: "admin",
      passwordHash,
      phoneVerified: true,
    });
    process.env.FORCE_OTP_FOR_ADMINS = "1";
    try {
      const app = makeApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ phoneE164: "+256700000032", password: "password123" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not verified/i);
    } finally {
      delete process.env.FORCE_OTP_FOR_ADMINS;
    }
  });

  it("issues a JWT for admin on verify/check when FORCE_OTP_FOR_ADMINS is on", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await User.create({
      name: "Admin A",
      phoneE164: "+256700000033",
      role: "admin",
      phoneVerified: true,
    });
    process.env.FORCE_OTP_FOR_ADMINS = "1";
    try {
      const app = makeApp();
      const res = await request(app)
        .post("/api/auth/verify/check")
        .send({ phoneE164: "+256700000033", code: "123456" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    } finally {
      delete process.env.FORCE_OTP_FOR_ADMINS;
    }
  });

  it("logs in an admin whose phone is verified", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash("password123", 10);
    await User.create({
      name: "Admin A",
      phoneE164: "+256700000031",
      role: "admin",
      passwordHash,
      phoneVerified: true,
    });
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phoneE164: "+256700000031", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("admin");
  });
});
