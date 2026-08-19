import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../lib/jwt.js";
import { handler } from "../lib/routeAdapter.js";
import { badRequest, HttpError } from "../lib/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  startVerification,
  checkVerification,
} from "../whatsapp/providers/twilioVerify.js";

const router = express.Router();

const PHONE_RE = /^\+[1-9]\d{7,14}$/;
// Roles that log in via OTP only (no password). On successful verify these
// receive a JWT so the OTP flow doubles as login for them. Brokers were
// moved to password auth alongside admin/staff — see /login role filter.
const OTP_ONLY_ROLES = new Set(["farmer"]);
// Roles that log in with a password on the web dashboard.
const PASSWORD_ROLES = ["admin", "staff", "broker"];

// TEMPORARY — WhatsApp OTP is paused while Twilio reviews our business
// profile. Flip to `false` once approval lands. Also flip the matching
// constant in client/src/components/AuthScreen.jsx.
const OTP_DISABLED = true;
const OTP_PAUSED_MESSAGE =
  "WhatsApp verification is temporarily unavailable. Please try again soon.";

// Dev-only override: when truthy, admin logins always require OTP even if the
// account is already phoneVerified. Lets developers exercise the OTP path as
// themselves without resetting their admin. Never enable in production.
function forceAdminOtp() {
  const v = process.env.FORCE_OTP_FOR_ADMINS;
  return v === "1" || v === "true";
}

// POST /api/auth/signup — farmer registration (phone + name, no password)
router.post(
  "/signup",
  handler(async (req) => {
    // Farmer signup depends on OTP verification to complete. While OTP is
    // paused, block the endpoint entirely rather than leaving unverified
    // accounts hanging.
    if (OTP_DISABLED) throw new HttpError(503, OTP_PAUSED_MESSAGE);
    const { name, phoneE164, messagingConsent } = req.body;
    if (!name?.trim()) throw badRequest("name is required");
    if (!phoneE164 || !PHONE_RE.test(phoneE164)) {
      throw badRequest(
        "phoneE164 must be a valid E.164 number (e.g. +256700000000)"
      );
    }
    const exists = await User.findOne({ phoneE164 });
    if (exists) throw badRequest("Phone number already registered");
    const consent = messagingConsent?.optedIn
      ? {
          optedIn: true,
          optedInAt: new Date(),
          copy: String(messagingConsent.copy || "").slice(0, 500),
          channel: "whatsapp",
        }
      : { optedIn: false, channel: "whatsapp" };
    const user = await User.create({
      name: name.trim(),
      phoneE164,
      role: "farmer",
      messagingConsent: consent,
    });
    return {
      message: "Account created",
      user: { id: user._id, name: user.name, role: user.role },
    };
  })
);

// POST /api/auth/login — admin login → JWT
router.post(
  "/login",
  handler(async (req) => {
    const { phoneE164, password } = req.body;
    if (!phoneE164 || !password) {
      throw badRequest("phoneE164 and password are required");
    }
    // Select passwordHash explicitly since it has select:false
    const user = await User.findOne({ phoneE164, role: { $in: PASSWORD_ROLES } }).select(
      "+passwordHash"
    );
    if (!user || !user.active) throw badRequest("Invalid credentials");
    const valid = await bcrypt.compare(password, user.passwordHash || "");
    if (!valid) throw badRequest("Invalid credentials");
    // While OTP is paused, password alone is sufficient — we can't gate on
    // phoneVerified when there's no way to verify.
    const mustVerify =
      !OTP_DISABLED &&
      (!user.phoneVerified || (user.role === "admin" && forceAdminOtp()));
    if (mustVerify) throw badRequest("Phone not verified");
    const token = signToken({ userId: user._id, role: user.role });
    return {
      token,
      user: { id: user._id, name: user.name, role: user.role },
    };
  })
);

// GET /api/auth/me — current user from token
router.get(
  "/me",
  requireAuth,
  handler(async (req) => ({
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role,
      phoneE164: req.user.phoneE164,
      active: req.user.active,
      createdAt: req.user.createdAt,
      permissions: req.user.permissions,
    },
  }))
);

// POST /api/auth/admin — create an admin account (requires ADMIN_CREATION_SECRET)
router.post(
  "/admin",
  handler(async (req) => {
    const { name, phoneE164, password, secret } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_CREATION_SECRET;
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
      throw new HttpError(403, "Invalid admin creation secret");
    }
    if (!name?.trim()) throw badRequest("name is required");
    if (!phoneE164 || !PHONE_RE.test(phoneE164)) {
      throw badRequest(
        "phoneE164 must be a valid E.164 number (e.g. +256700000000)"
      );
    }
    if (!password || password.length < 8) {
      throw badRequest("password must be at least 8 characters");
    }
    const exists = await User.findOne({ phoneE164 });
    if (exists) throw badRequest("Phone number already registered");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      phoneE164,
      role: "admin",
      passwordHash,
    });
    return {
      message: "Admin account created",
      user: { id: user._id, name: user.name, role: user.role },
    };
  })
);

// POST /api/auth/verify/start — send a WhatsApp OTP to an existing user.
//
// Enumeration-safe: we always respond identically whether or not the phone
// is registered, so an attacker probing numbers can't tell which are real
// accounts. If the number belongs to a real active user, we fire the Twilio
// call; otherwise we silently do nothing. Twilio errors are swallowed for
// the same reason — a real user will simply retry.
router.post(
  "/verify/start",
  handler(async (req) => {
    if (OTP_DISABLED) throw new HttpError(503, OTP_PAUSED_MESSAGE);
    const { phoneE164 } = req.body;
    if (!phoneE164 || !PHONE_RE.test(phoneE164)) {
      throw badRequest("phoneE164 must be a valid E.164 number (e.g. +256700000000)");
    }
    const user = await User.findOne({ phoneE164 });
    if (user && user.active) {
      try {
        await startVerification(phoneE164);
      } catch (err) {
        console.error("[auth] startVerification failed:", err);
      }
    }
    return { message: "If this number has an Agribridge account, a code has been sent on WhatsApp" };
  })
);

// POST /api/auth/verify/check — check an OTP; marks phoneVerified and, for
// no-password roles (farmer/broker), issues a JWT so the flow doubles as login.
router.post(
  "/verify/check",
  handler(async (req) => {
    if (OTP_DISABLED) throw new HttpError(503, OTP_PAUSED_MESSAGE);
    const { phoneE164, code } = req.body;
    if (!phoneE164 || !PHONE_RE.test(phoneE164)) {
      throw badRequest("phoneE164 must be a valid E.164 number (e.g. +256700000000)");
    }
    if (!code || typeof code !== "string" || !/^\d{4,10}$/.test(code.trim())) {
      throw badRequest("code must be the digits sent via WhatsApp");
    }
    const user = await User.findOne({ phoneE164 });
    // Merge "unknown phone" and "bad code" into one response so attackers
    // can't distinguish registered vs unregistered numbers by feeding bad
    // codes to a specific phone.
    if (!user || !user.active) {
      throw badRequest("Invalid or expired code");
    }
    let result;
    try {
      result = await checkVerification(phoneE164, code.trim());
    } catch (err) {
      console.error("[auth] checkVerification failed:", err);
      throw new HttpError(502, "Could not verify code, please try again");
    }
    if (!result.valid) {
      throw badRequest("Invalid or expired code");
    }
    if (!user.phoneVerified) {
      user.phoneVerified = true;
      await user.save();
    }
    const publicUser = {
      id: user._id,
      name: user.name,
      role: user.role,
      phoneE164: user.phoneE164,
    };
    // Farmer/broker get a JWT so the OTP flow doubles as login. Admins do
    // too, but only when FORCE_OTP_FOR_ADMINS is set (dev switch) — otherwise
    // they still complete their normal password login next.
    const issueToken =
      OTP_ONLY_ROLES.has(user.role) ||
      (user.role === "admin" && forceAdminOtp());
    if (issueToken) {
      const token = signToken({ userId: user._id, role: user.role });
      return { verified: true, token, user: publicUser };
    }
    return { verified: true, user: publicUser };
  })
);

export default router;
