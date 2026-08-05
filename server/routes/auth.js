import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../lib/jwt.js";
import { handler } from "../lib/routeAdapter.js";
import { badRequest, HttpError } from "../lib/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

// POST /api/auth/signup — farmer registration (phone + name, no password)
router.post(
  "/signup",
  handler(async (req) => {
    const { name, phoneE164 } = req.body;
    if (!name?.trim()) throw badRequest("name is required");
    if (!phoneE164 || !PHONE_RE.test(phoneE164)) {
      throw badRequest(
        "phoneE164 must be a valid E.164 number (e.g. +256700000000)"
      );
    }
    const exists = await User.findOne({ phoneE164 });
    if (exists) throw badRequest("Phone number already registered");
    const user = await User.create({ name: name.trim(), phoneE164, role: "farmer" });
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
    const user = await User.findOne({ phoneE164, role: "admin" }).select(
      "+passwordHash"
    );
    if (!user || !user.active) throw badRequest("Invalid credentials");
    const valid = await bcrypt.compare(password, user.passwordHash || "");
    if (!valid) throw badRequest("Invalid credentials");
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

export default router;
