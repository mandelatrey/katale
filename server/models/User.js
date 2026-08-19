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
    // Hashed password — required for admin/staff/broker (they log in on the
    // web dashboard with password). Farmers authenticate via WhatsApp OTP.
    passwordHash: { type: String, select: false },
    // Set to true once the phone number has been verified via Twilio Verify OTP.
    // Existing admins are backfilled to true; everyone else must verify before login.
    phoneVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    // Documented opt-in for non-transactional WhatsApp messages (price alerts,
    // daily digest, market warnings). Required by Meta's WhatsApp Business
    // Policy — `copy` stores the exact text the user agreed to at signup.
    messagingConsent: {
      optedIn:   { type: Boolean, default: false },
      optedInAt: { type: Date },
      copy:      { type: String },
      channel:   { type: String, default: "whatsapp" },
    },
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
