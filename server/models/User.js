import mongoose from "mongoose";

// A single User covers every actor in the system: brokers, carriers,
// farmers, Agribridge staff. Phone number (E.164) is the stable identity
// used to resolve WhatsApp messages to a user.
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
      enum: ["farmer", "broker", "carrier", "staff", "admin"],
      default: "farmer",
    },
    // Hashed password — only set for admin users (farmers authenticate via WhatsApp/phone).
    passwordHash: { type: String, select: false },
    // Optional — links this user to a Carrier record so a carrier driver's
    // WhatsApp messages update their own vehicle status without having to
    // specify an id.
    carrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrier",
    },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: true },
);

export default mongoose.model("User", userSchema);
