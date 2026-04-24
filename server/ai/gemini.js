// Gemini provider for the WhatsApp AI middleware.
//
// Implements the same runAgent(ctx) interface as agent.js (Anthropic) so the
// provider router in index.js can swap between them transparently.
//
// Function-calling loop mirrors the Anthropic one: the model picks tools,
// we execute them, send back results, and keep looping until the model
// produces a plain-text reply or we hit MAX_ITERATIONS.
//
// Env vars (all optional except GEMINI_API_KEY):
//   GEMINI_API_KEY          — Google AI Studio key (required for this provider)
//   GEMINI_MODEL            — model name, default "gemini-2.0-flash"
//   WHATSAPP_AI_MAX_TOKENS  — maxOutputTokens, default 4096
//   WHATSAPP_AI_MAX_ITERATIONS — tool-loop cap, default 8
//   WHATSAPP_AI_HISTORY_TURNS  — rolling history window (turns), default 6

import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeTool, geminiToolDeclarations } from "./tools.js";
import { buildSystemPrompt } from "./systemPrompt.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MAX_ITERATIONS = Number(process.env.WHATSAPP_AI_MAX_ITERATIONS || 8);
const MAX_TOKENS = Number(process.env.WHATSAPP_AI_MAX_TOKENS || 4096);
const HISTORY_TURNS = Number(process.env.WHATSAPP_AI_HISTORY_TURNS || 6);
const TOOL_RESULT_CHAR_CAP = 16000;

let cachedGenAI = null;
function getClient() {
  if (!cachedGenAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not set — required for the WhatsApp AI middleware with Gemini.",
      );
    }
    cachedGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return cachedGenAI;
}

// Gemini rate-limit errors surface as HTTP 429 or RESOURCE_EXHAUSTED gRPC
// status. Back off and retry before giving up.
async function callWithBackoff(fn, maxAttempts = 3) {
  let delay = 2000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err?.status === 429 ||
        err?.status === "RESOURCE_EXHAUSTED" ||
        err?.message?.toLowerCase().includes("resource_exhausted") ||
        err?.message?.toLowerCase().includes("quota");
      if (!isRateLimit || attempt === maxAttempts) throw err;
      console.warn(
        `[whatsapp-ai/gemini] rate limit (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

/**
 * Run the Gemini agent for one inbound WhatsApp message.
 * Identical call-signature to the Anthropic runAgent in agent.js.
 */
export async function runAgent(ctx) {
  const genAI = getClient();
  const history = Array.isArray(ctx.session?.history) ? ctx.session.history : [];

  // Convert stored history ({role, text}) to Gemini's {role, parts} format.
  // "assistant" in our store → "model" in Gemini terminology.
  const geminiHistory = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildSystemPrompt(ctx),
    tools: geminiToolDeclarations,
    generationConfig: { maxOutputTokens: MAX_TOKENS },
  });

  const chat = model.startChat({ history: geminiHistory });

  let finalText = "";
  let stoppedCleanly = false;
  // First turn sends the user's text; subsequent turns send function responses.
  let pendingMessage = ctx.message.text;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const result = await callWithBackoff(() => chat.sendMessage(pendingMessage));
    const response = result.response;

    // Safety / content-filter block
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      finalText = "Sorry, I can't help with that.";
      stoppedCleanly = true;
      break;
    }

    const functionCalls = response.functionCalls?.() ?? [];

    if (functionCalls.length === 0) {
      // No more tool calls — extract the text reply.
      try {
        finalText = response.text();
      } catch {
        finalText = "";
      }
      stoppedCleanly = true;
      break;
    }

    // Execute every tool call in this turn, then feed results back.
    const functionResponses = [];
    for (const fc of functionCalls) {
      let resultPayload;
      try {
        const raw = await executeTool(fc.name, fc.args ?? {}, ctx);
        resultPayload = { result: serialiseToolResult(raw) };
      } catch (err) {
        console.warn(`[whatsapp-ai/gemini] tool ${fc.name} failed:`, err.message);
        resultPayload = {
          error: err.message || "tool execution failed",
          code: err.code,
        };
      }
      functionResponses.push({
        functionResponse: { name: fc.name, response: resultPayload },
      });
    }

    pendingMessage = functionResponses;
  }

  if (!finalText) {
    finalText = stoppedCleanly
      ? "Sorry, I couldn't put together a reply. Try rephrasing?"
      : "That request took too many steps. Try breaking it into smaller asks.";
  }

  if (finalText.length > 1500) finalText = finalText.slice(0, 1500) + "…";

  const newHistory = [
    ...history,
    { role: "user", text: ctx.message.text },
    { role: "assistant", text: finalText },
  ].slice(-HISTORY_TURNS * 2);

  return {
    reply: finalText,
    nextSession: { state: "ai", data: {}, history: newHistory },
  };
}

function serialiseToolResult(value) {
  if (value === undefined) return "null";
  let json;
  try {
    json = JSON.stringify(value);
  } catch {
    json = JSON.stringify({ error: "could not serialise result" });
  }
  if (json.length > TOOL_RESULT_CHAR_CAP) {
    return (
      json.slice(0, TOOL_RESULT_CHAR_CAP) +
      `\n…[truncated; original length ${json.length} chars]`
    );
  }
  return json;
}
