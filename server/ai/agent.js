// AI middleware for the WhatsApp webhook.
//
// Replaces the keyword-based router with a manual Anthropic tool-use loop:
// the LLM picks tools (read/write the DB) and keeps calling them until it
// has enough to compose a reply. The tools are defined in ./tools.js.
//
// We use the *manual* loop (not the SDK's tool runner) so we can:
//   - apply per-tool authorization (handlers see ctx.user / ctx.actor)
//   - serialise / cap large tool results before they hit the context
//   - cap iterations to keep WhatsApp turnaround bounded
//   - fall back gracefully on errors
//
// Multi-turn context is kept in the WhatsApp session as `history`: a
// rolling window of recent (user, assistant) text pairs. We replay
// those on every request so the LLM has short-term memory across
// messages without us needing a separate conversation store.

import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions, executeTool } from "./tools.js";
import { buildSystemPrompt } from "./systemPrompt.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const MAX_ITERATIONS = Number(process.env.WHATSAPP_AI_MAX_ITERATIONS || 8);
const MAX_TOKENS = Number(process.env.WHATSAPP_AI_MAX_TOKENS || 16000);
const HISTORY_TURNS = Number(process.env.WHATSAPP_AI_HISTORY_TURNS || 6);
const TOOL_RESULT_CHAR_CAP = 16000;

let cachedClient = null;
function getClient() {
  if (!cachedClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set — required for the WhatsApp AI middleware.",
      );
    }
    cachedClient = new Anthropic();
  }
  return cachedClient;
}

/**
 * Run the LLM agent for one inbound WhatsApp message.
 *
 * @param {{
 *   message: { fromPhoneE164: string, text: string, mediaUrls?: string[] },
 *   user: any | null,
 *   session: { state: string, data: any, history?: Array<{role: "user"|"assistant", text: string}> } | null,
 *   actor: { userId: string | null, source: "whatsapp" }
 * }} ctx
 * @returns {Promise<{ reply: string, nextSession: object }>}
 */
export async function runAgent(ctx) {
  const client = getClient();
  const history = Array.isArray(ctx.session?.history)
    ? ctx.session.history
    : [];

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.text })),
    { role: "user", content: ctx.message.text },
  ];

  const system = buildSystemPrompt(ctx);

  let finalText = "";
  let stoppedCleanly = false;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      tools: toolDefinitions,
      messages,
    });

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        try {
          const result = await executeTool(block.name, block.input, ctx);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: serialiseToolResult(result),
          });
        } catch (err) {
          console.warn(
            `[whatsapp-ai] tool ${block.name} failed:`,
            err.message,
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({
              error: err.message || "tool execution failed",
              code: err.code,
            }),
            is_error: true,
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    if (response.stop_reason === "end_turn") {
      finalText = extractText(response.content);
      stoppedCleanly = true;
      break;
    }

    if (response.stop_reason === "max_tokens") {
      finalText = extractText(response.content);
      console.warn("[whatsapp-ai] hit max_tokens before end_turn");
      stoppedCleanly = true;
      break;
    }

    if (response.stop_reason === "refusal") {
      finalText = "Sorry, I can't help with that.";
      stoppedCleanly = true;
      break;
    }

    // Unknown stop reason — bail out of the loop.
    console.warn(
      `[whatsapp-ai] unexpected stop_reason: ${response.stop_reason}`,
    );
    finalText = extractText(response.content);
    break;
  }

  if (!finalText) {
    finalText = stoppedCleanly
      ? "Sorry, I couldn't put together a reply. Try rephrasing?"
      : "That request took too many steps. Try breaking it into smaller asks.";
  }

  // Trim to a WhatsApp-safe length. The provider would split or truncate
  // anyway; doing it here keeps the persisted history compact too.
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

function extractText(content) {
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function serialiseToolResult(value) {
  if (value === undefined) return "null";
  // Mongoose documents stringify via their toJSON; ObjectIds become hex.
  // Cap the payload so a giant query doesn't blow the context window.
  let json;
  try {
    json = JSON.stringify(value);
  } catch (err) {
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
