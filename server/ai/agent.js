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

import { toolDefinitions, executeTool } from "./tools.js";
import { buildSystemPrompt } from "./systemPrompt.js";

const AI_PROVIDER = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MODEL_FALLBACKS = (
  process.env.GEMINI_MODEL_FALLBACKS ||
  "gemini-2.0-flash,gemini-2.0-flash-lite"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const MAX_ITERATIONS = Number(process.env.WHATSAPP_AI_MAX_ITERATIONS || 8);
const MAX_TOKENS = Number(process.env.WHATSAPP_AI_MAX_TOKENS || 16000);
const HISTORY_TURNS = Number(process.env.WHATSAPP_AI_HISTORY_TURNS || 6);
const TOOL_RESULT_CHAR_CAP = 16000;
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

let cachedAnthropicClient = null;

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
  const history = Array.isArray(ctx.session?.history)
    ? ctx.session.history
    : [];
  const system = buildSystemPrompt(ctx);
  const { finalText, stoppedCleanly } =
    AI_PROVIDER === "gemini"
      ? await runGeminiAgent({ ctx, history, system })
      : await runAnthropicAgent({ ctx, history, system });

  let replyText = finalText;
  if (!replyText) {
    replyText = stoppedCleanly
      ? "Sorry, I couldn't put together a reply. Try rephrasing?"
      : "That request took too many steps. Try breaking it into smaller asks.";
  }

  // Trim to a WhatsApp-safe length. The provider would split or truncate
  // anyway; doing it here keeps the persisted history compact too.
  if (replyText.length > 1500) replyText = replyText.slice(0, 1500) + "…";

  const newHistory = [
    ...history,
    { role: "user", text: ctx.message.text },
    { role: "assistant", text: replyText },
  ].slice(-HISTORY_TURNS * 2);

  return {
    reply: replyText,
    nextSession: { state: "ai", data: {}, history: newHistory },
  };
}

async function getAnthropicClient() {
  if (!cachedAnthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set — required when AI_PROVIDER=anthropic.",
      );
    }
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    cachedAnthropicClient = new Anthropic();
  }
  return cachedAnthropicClient;
}

async function runAnthropicAgent({ ctx, history, system }) {
  const client = await getAnthropicClient();
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.text })),
    { role: "user", content: ctx.message.text },
  ];
  let finalText = "";
  let stoppedCleanly = false;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
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
      finalText = extractAnthropicText(response.content);
      stoppedCleanly = true;
      break;
    }

    if (response.stop_reason === "max_tokens") {
      finalText = extractAnthropicText(response.content);
      console.warn("[whatsapp-ai] hit max_tokens before end_turn");
      stoppedCleanly = true;
      break;
    }

    if (response.stop_reason === "refusal") {
      finalText = "Sorry, I can't help with that.";
      stoppedCleanly = true;
      break;
    }

    console.warn(
      `[whatsapp-ai] unexpected stop_reason: ${response.stop_reason}`,
    );
    finalText = extractAnthropicText(response.content);
    break;
  }

  return { finalText, stoppedCleanly };
}

async function runGeminiAgent({ ctx, history, system }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set — required when AI_PROVIDER=gemini.",
    );
  }

  const contents = [
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: ctx.message.text }] },
  ];
  let finalText = "";
  let stoppedCleanly = false;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await callGeminiWithFallback({
      apiKey,
      models: buildGeminiModelCandidates(),
      system,
      contents,
      tools: toGeminiTools(toolDefinitions),
    });

    const modelContent = response?.candidates?.[0]?.content || {
      role: "model",
      parts: [],
    };
    const parts = Array.isArray(modelContent.parts) ? modelContent.parts : [];
    contents.push({ role: "model", parts });

    const functionCalls = parts
      .map((part) => part.functionCall)
      .filter(Boolean);

    if (!functionCalls.length) {
      finalText = parts
        .map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim();
      stoppedCleanly = true;
      break;
    }

    const functionResponseParts = [];
    for (const call of functionCalls) {
      try {
        const result = await executeTool(call.name, call.args, ctx);
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { result: serialiseToolResult(result) },
          },
        });
      } catch (err) {
        console.warn(`[whatsapp-ai] tool ${call.name} failed:`, err.message);
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: {
              error: err.message || "tool execution failed",
              code: err.code,
            },
          },
        });
      }
    }
    contents.push({ role: "user", parts: functionResponseParts });
  }

  return { finalText, stoppedCleanly };
}

function buildGeminiModelCandidates() {
  const unique = [];
  for (const model of [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS]) {
    if (model && !unique.includes(model)) unique.push(model);
  }
  return unique;
}

async function callGeminiWithFallback({ apiKey, models, system, contents, tools }) {
  let lastError = null;
  for (const model of models) {
    try {
      return await callGemini({ apiKey, model, system, contents, tools });
    } catch (err) {
      lastError = err;
      const msg = (err?.message || "").toLowerCase();
      const retryable =
        msg.includes("high demand") ||
        msg.includes("resource exhausted") ||
        msg.includes("429") ||
        msg.includes("overloaded") ||
        msg.includes("quota exceeded") ||
        msg.includes("limit: 0") ||
        msg.includes("is not found for api version") ||
        msg.includes("is not supported for generatecontent");
      if (!retryable) throw err;
      console.warn(
        `[whatsapp-ai] Gemini model "${model}" unavailable for this request; trying next fallback model.`,
      );
    }
  }
  throw lastError || new Error("Gemini request failed");
}

async function callGemini({ apiKey, model, system, contents, tools }) {
  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    tools,
    contents,
  };

  // Log the request for debugging (only in development)
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[whatsapp-ai] Calling Gemini ${model} with ${tools?.[0]?.functionDeclarations?.length || 0} tools`,
    );
  }

  const response = await fetch(
    `${GEMINI_ENDPOINT}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const body = await response.json();
  if (!response.ok) {
    const message = body?.error?.message || "Gemini request failed";
    const details = body?.error?.details || [];
    
    // Log detailed error information
    console.error(`[whatsapp-ai] Gemini API error (${response.status}):`, message);
    if (details.length > 0) {
      console.error("[whatsapp-ai] Error details:", JSON.stringify(details, null, 2));
    }
    
    throw new Error(message);
  }
  return body;
}

function extractAnthropicText(content) {
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function toGeminiTools(anthropicTools) {
  return [
    {
      functionDeclarations: anthropicTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: toGeminiSchema(
          tool.input_schema || { type: "object", properties: {} },
        ),
      })),
    },
  ];
}

function toGeminiSchema(schema) {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);

  const out = {};
  for (const [key, value] of Object.entries(schema)) {
    // Gemini's function parameter schema does not accept these JSON-Schema
    // keywords, and will reject the whole request payload if included.
    // Supported: type, description, enum, properties, required, items, minimum, maximum
    // Not supported: pattern, exclusiveMinimum, exclusiveMaximum, minLength, maxLength, format
    if (
      key === "exclusiveMinimum" ||
      key === "exclusiveMaximum" ||
      key === "pattern" ||
      key === "minLength" ||
      key === "maxLength" ||
      key === "format"
    ) {
      continue;
    }
    out[key] = toGeminiSchema(value);
  }
  return out;
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
