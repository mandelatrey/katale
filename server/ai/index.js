// AI provider router for the WhatsApp middleware.
//
// Selects between Anthropic Claude and Google Gemini based on env vars, then
// delegates to the provider-specific runAgent implementation. Both providers
// expose the same runAgent(ctx) interface so the caller never needs to know
// which one is active.
//
// Configuration:
//   WHATSAPP_AI_PROVIDER=gemini|anthropic
//     Explicit override. When omitted the router auto-detects:
//       GEMINI_API_KEY set    → gemini   (default)
//       ANTHROPIC_API_KEY set → anthropic
//
//   GEMINI_API_KEY    / GEMINI_MODEL     — Google Gemini settings
//   ANTHROPIC_API_KEY / ANTHROPIC_MODEL  — Anthropic Claude settings
//
// To switch providers at runtime, change WHATSAPP_AI_PROVIDER (or swap which
// API key is defined) and restart the server — no code change required.

import { runAgent as runAnthropicAgent } from "./agent.js";
import { runAgent as runGeminiAgent } from "./gemini.js";

function resolveProvider() {
  const explicit = process.env.WHATSAPP_AI_PROVIDER?.toLowerCase().trim();
  if (explicit === "gemini" || explicit === "anthropic") return explicit;
  // Auto-detect from whichever key is set.
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  // Default to gemini — will surface a missing-key error at call time.
  return "gemini";
}

export function runAgent(ctx) {
  const provider = resolveProvider();
  if (provider === "gemini") {
    console.log("[whatsapp-ai] provider: gemini (" + (process.env.GEMINI_MODEL || "gemini-2.0-flash") + ")");
    return runGeminiAgent(ctx);
  }
  console.log("[whatsapp-ai] provider: anthropic (" + (process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6") + ")");
  return runAnthropicAgent(ctx);
}
