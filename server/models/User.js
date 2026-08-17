import mongoose from "mongoose";

// A single User covers every actor in the system: brokers, farmers,
// Agribridge staff. Phone number (E.164) is the stable identity used to
// resolve WhatsApp messages to a user.
//
// Today the web app has no auth; once web auth lands, sessions will
// populate `createdBy` / `actorUserId` on mutations the same way the
// WhatsApp webhook will. See docs/auth-model.md for the full plan.

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneE164: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // E.164: leading "+", 8-15 digits. Enforced at the Zod boundary too.
      match: /^\+[1-9]\d{7,14}$/,
    },
    role: {
      type: String,
      enum: ["farmer", "broker", "staff", "admin"],
      default: "farmer",
    },
    // Hashed password — only set for admin users (farmers authenticate via WhatsApp/phone).
    passwordHash: { type: String, select: false },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    // Granular permissions for staff/team members — ignored for admin/farmer roles
    permissions: {
      canViewCommodities:  { type: Boolean, default: true },
      canViewTransactions: { type: Boolean, default: false },
      canViewPayments:     { type: Boolean, default: false },
      canViewReports:      { type: Boolean, default: false },
      canViewStatements:   { type: Boolean, default: false },
      canAddUsers:         { type: Boolean, default: false },
    },
  },
  { minimize: false },
);

export default mongoose.model("User", userSchema);
