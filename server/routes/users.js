import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { handler } from "../lib/routeAdapter.js";
import { badRequest, HttpError } from "../lib/errors.js";

const router = express.Router();

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

// All users routes require authentication + admin role
router.use(requireAuth, requireRole("admin", "staff"));

// GET /api/users?role= — list users, optionally filtered by role
router.get(
  "/",
  handler(async (req) => {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();
    return users;
  })
);

// POST /api/users — create a new user (admin only)
router.post(
  "/",
  requireRole("admin"),
  handler(async (req, res) => {
    const { name, phoneE164, role, password, permissions } = req.body;
    if (!name?.trim()) throw badRequest("name is required");
    if (!phoneE164 || !PHONE_RE.test(phoneE164)) {
      throw badRequest("phoneE164 must be a valid E.164 number (e.g. +256700000000)");
    }
    const validRoles = ["farmer", "broker", "carrier", "staff", "admin"];
    if (!role || !validRoles.includes(role)) {
      throw badRequest(`role must be one of: ${validRoles.join(", ")}`);
    }
    const needsPassword = role === "admin" || role === "staff";
    if (needsPassword) {
      if (!password || password.length < 8) {
        throw badRequest("password must be at least 8 characters for admin/staff accounts");
      }
    }
    const exists = await User.findOne({ phoneE164 });
    if (exists) throw badRequest("Phone number already registered");

    const data = { name: name.trim(), phoneE164, role };
    if (needsPassword) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role === "staff" && permissions) {
      data.permissions = permissions;
    }
    const user = await User.create(data);
    const out = user.toObject();
    delete out.passwordHash;
    res.status(201).json(out);
  })
);

// PUT /api/users/:id — update user name, phone, active status, or permissions (admin only)
router.put(
  "/:id",
  requireRole("admin"),
  handler(async (req) => {
    const { name, phoneE164, active, permissions, role } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (phoneE164 !== undefined) {
      if (!PHONE_RE.test(phoneE164)) throw badRequest("Invalid phoneE164 format");
      update.phoneE164 = phoneE164;
    }
    if (active !== undefined) update.active = Boolean(active);
    if (role !== undefined) {
      const validRoles = ["farmer", "broker", "carrier", "staff", "admin"];
      if (!validRoles.includes(role)) throw badRequest("Invalid role");
      update.role = role;
    }
    if (permissions !== undefined) {
      update.permissions = permissions;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select("-passwordHash")
      .lean();
    if (!user) throw new HttpError(404, "User not found");
    return user;
  })
);

// DELETE /api/users/:id — remove a user (admin only)
router.delete(
  "/:id",
  requireRole("admin"),
  handler(async (req) => {
    if (req.user._id.toString() === req.params.id) {
      throw badRequest("You cannot delete your own account");
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new HttpError(404, "User not found");
    return { deleted: true };
  })
);

export default router;
