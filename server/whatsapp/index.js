// WhatsApp webhook entry point.
//
// This file is intentionally minimal. The real work lives in:
//   - providers/{twilio,meta}.js   — inbound message normalisation + outbound send
//   - router.js                     — intent → service action mapping (does the work)
//   - sessions.js                   — multi-turn conversation state
//   - formatter.js                  — deterministic result → WhatsApp text (fallback)
//   - ../ai/openrouter.js           — LLM result → friendly WhatsApp text (when enabled)

import express from "express";
import User from "../models/User.js";
import { route } from "./router.js";
import { getSessionStore } from "./sessions.js";
import { formatReply } from "./formatter.js";
import { providerFromRequest } from "./providers/index.js";
import { formatReplyAI } from "../ai/index.js";

const FALLBACK_REPLY =
  "Sorry, something went wrong on our end. Please try again in a moment.";

// AI formatting is ON by default; set WHATSAPP_AI_MIDDLEWARE=0 to disable it,
// and it silently stays off if no OpenRouter key is configured.
function aiEnabled() {
  return (
    process.env.WHATSAPP_AI_MIDDLEWARE !== "0" &&
    !!process.env.OPENROUTER_API_KEY
  );
}

const router = express.Router();

// Check whether the server is running.
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    webhook: "whatsapp",
    implemented: true,
  });
});

// Verifying Whatsapp token (Meta Cloud API webhook verification).
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("[whatsapp] Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.warn(
    "[whatsapp] Webhook verification failed - token mismatch or invalid mode",
  );
  res.status(403).json({ error: "Verification failed" });
});

// Main inbound webhook. Accepts messages from Twilio or Meta; the provider
// adapter normalises the payload.
router.post("/webhook", async (req, res) => {
  let provider;
  let message;

  // --- Phase 1: identify provider + parse the inbound message ---------------
  try {
    provider = providerFromRequest(req);
    message = await provider.parseInbound(req);
  } catch (err) {
    console.error("[whatsapp] parseInbound failed:", err);
    return res.status(200).end();
  }

  if (!message) {
    // Provider couldn't parse (status callback, non-message event, etc.).
    return res.status(200).end();
  }

  // --- Phase 2: build the reply ---------------------------------------------
  // The router always runs and does the actual work (DB reads/writes, session
  // state, confirmations). When AI is enabled, the model only translates the
  // router's structured result into friendlier text; if that call fails we
  // fall back to the deterministic formatter. The model never touches tools.
  let reply = FALLBACK_REPLY;
  let nextSession;

  try {
    const sessions = getSessionStore();
    const [user, session] = await Promise.all([
      User.findOne({ phoneE164: message.fromPhoneE164 }),
      sessions.load(message.fromPhoneE164),
    ]);

    const actor = user
      ? { userId: user._id.toString(), source: "whatsapp" }
      : { userId: null, source: "whatsapp" };

    const actionResult = await route({ message, user, session, actor });
    nextSession = actionResult.nextSession;

    if (aiEnabled()) {
      try {
        reply = await formatReplyAI(actionResult, {
          userMessage: message.text,
        });
      } catch (err) {
        console.error(
          `[whatsapp] AI formatting failed (${err?.message ?? err}), using deterministic formatter`,
        );
        reply = formatReply(actionResult);
      }
    } else {
      reply = formatReply(actionResult);
    }
  } catch (err) {
    // DB blip, handler crash, etc. `reply` stays as FALLBACK_REPLY.
    console.error("[whatsapp] handler error:", err);
  }

  // --- Phase 3: persist session (best-effort) --------------------------------
  if (nextSession) {
    try {
      const sessions = getSessionStore();
      await sessions.save(message.fromPhoneE164, nextSession);
    } catch (err) {
      console.error("[whatsapp] session save failed:", err);
    }
  }

  // --- Phase 4: deliver the reply (best-effort) ------------------------------
  try {
    await provider.sendOutbound({ to: message.fromPhoneE164, text: reply });
  } catch (err) {
    console.error("[whatsapp] sendOutbound failed:", err);
  }

  // Always ACK 200 so the provider doesn't retry.
  res.status(200).end();
});

// Twilio status callbacks — one POST per message lifecycle transition
// (queued → sent → delivered, or failed/undelivered with an ErrorCode).
// NOTE: this must be a top-level route, NOT inside the /webhook handler.
router.post("/status", (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body ?? {};
  console.log("[twilio] status:", MessageSid, MessageStatus, ErrorCode ?? "");
  res.status(200).end();
});

export default router;