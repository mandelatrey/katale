// WhatsApp webhook entry point.
//
// This file is intentionally minimal. The real work lives in:
//   - providers/{twilio,meta}.js   — inbound message normalisation + outbound send
//   - router.js                     — intent → service action mapping
//   - sessions.js                   — multi-turn conversation state
//   - formatter.js                  — service result → WhatsApp text

import express from "express";
import User from "../models/User.js";
import { route } from "./router.js";
import { getSessionStore } from "./sessions.js";
import { formatReply } from "./formatter.js";
import { providerFromRequest } from "./providers/index.js";
import { runAgent } from "../ai/index.js";

// checks if the AI & Whatsapp middleware is enabled in env file.
function aiEnabled() {
  return (
    process.env.WHATSAPP_AI_MIDDLEWARE === "1" &&
    !!process.env.GEMINI_API_KEY
  );
}

const router = express.Router();

// Check whether the server is running.
router.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    webhook: "whatsapp", 
    implemented: false });
});

// Verifying Whatsapp token.
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("[whatsapp] Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.warn("[whatsapp] Webhook verification failed - token mismatch or invalid mode");
  res.status(403).json({ error: "Verification failed" });
});

// Main inbound webhook. Accepts messages from Twilio or Meta; the provider
// adapter normalises the payload.
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
    const actor = user
      ? { userId: user._id.toString(), source: "whatsapp" }
      : { userId: null, source: "whatsapp" };

    let reply;
    let nextSession;

    if (aiEnabled()) {
      try {
        const aiResult = await runAgent({ message, user, session, actor });
        reply = aiResult.reply;
        nextSession = aiResult.nextSession;
      } catch (err) {
        const cause = err?.cause;
        const detail = cause
          ? `${cause.code ?? cause.constructor?.name}: ${cause.message ?? cause}`
          : err?.message ?? String(err);
        console.error(
          `[whatsapp] AI middleware failed (${detail}), falling back to legacy router`,
        );
        const actionResult = await route({ message, user, session, actor });
        reply = formatReply(actionResult);
        nextSession = actionResult.nextSession;
      }
    } else {
      const actionResult = await route({ message, user, session, actor });
      reply = formatReply(actionResult);
      nextSession = actionResult.nextSession;
    }

    await sessions.save(message.fromPhoneE164, nextSession);
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
