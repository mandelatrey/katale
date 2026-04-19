// WhatsApp webhook entry point.
//
// This file is intentionally minimal. The real work lives in:
//   - providers/{twilio,meta}.js   — inbound message normalisation + outbound send
//   - router.js                     — intent → service action mapping
//   - sessions.js                   — multi-turn conversation state
//   - formatter.js                  — service result → WhatsApp text
//
// Today every handler returns 501 Not Implemented. The next session
// replaces these bodies with real logic; the API layer they call into
// (server/services/*) is ready.

import express from "express";
import User from "../models/User.js";
import { route } from "./router.js";
import { getSessionStore } from "./sessions.js";
import { formatReply } from "./formatter.js";
import { providerFromRequest } from "./providers/index.js";

const router = express.Router();

// Health check — useful for Twilio/Meta "is the webhook up" pings.
router.get("/health", (_req, res) => {
  res.json({ status: "ok", webhook: "whatsapp", implemented: false });
});

// Provider verification challenge (Meta Cloud API uses GET for this).
// Left as a stub: real impl will compare req.query["hub.verify_token"]
// against process.env.META_VERIFY_TOKEN.
router.get("/webhook", (_req, res) => {
  res.status(501).json({ error: "verification not implemented" });
});

// Main inbound webhook. Accepts messages from Twilio or Meta; the provider
// adapter normalises the payload. We keep the route below as a thin
// orchestrator so the actual plumbing (provider → session → router →
// service → formatter → provider.send) is visible at a glance.
router.post("/webhook", async (req, res) => {
  try {
    const provider = providerFromRequest(req);
    const message = await provider.parseInbound(req);
    if (!message) {
      // Provider couldn't parse — ack so upstream doesn't retry.
      return res.status(200).end();
    }

    const user = await User.findOne({ phoneE164: message.fromPhoneE164 });
    const sessions = getSessionStore();
    const session = await sessions.load(message.fromPhoneE164);

    const actionResult = await route({
      message,
      user,
      session,
      actor: user
        ? { userId: user._id.toString(), source: "whatsapp" }
        : { userId: null, source: "whatsapp" },
    });

    await sessions.save(message.fromPhoneE164, actionResult.nextSession);

    const reply = formatReply(actionResult);
    await provider.sendOutbound({ to: message.fromPhoneE164, text: reply });

    // 200 ACK tells the provider the delivery succeeded. The actual user
    // reply goes out via sendOutbound above.
    res.status(200).end();
  } catch (err) {
    // Returning 501 here keeps the provider from retrying and flooding
    // logs while the webhook is still a stub.
    console.error("[whatsapp] webhook error:", err);
    res.status(501).json({ error: err.message || "not implemented" });
  }
});

export default router;
