// OpenRouter-backed reply formatter for the WhatsApp middleware.
//
// IMPORTANT: unlike the (now-retired) Gemini agent, this module does NOT call
// tools or touch the database. The deterministic router (router.js) does all
// the work and returns a structured `result`; this module's ONLY job is to
// turn that structured result into a friendly, WhatsApp-ready message.



const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL =
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
const TIMEOUT_MS = Number(process.env.WHATSAPP_AI_TIMEOUT_MS || 15000);
const MAX_ATTEMPTS = Number(process.env.WHATSAPP_AI_MAX_ATTEMPTS || 3);
const MAX_REPLY_CHARS = 1500;

const SYSTEM_PROMPT = [
  "You are Agribridge, a WhatsApp assistant for Uganda's agricultural commodity markets.",
  "You will be given a JSON object that is the RESULT of a backend action that already ran.",
  "Your ONLY job is to turn that JSON into one short, friendly WhatsApp message.",
  "",
  "Hard rules:",
  "- Use ONLY facts present in the JSON. Never invent prices, names, IDs, quantities, or numbers.",
  "- Keep money amounts, currency codes and any IDs exactly as they appear. Do not reformat them.",
  "- If a list is empty or a field is missing, say so plainly. Do not fill gaps.",
  "- Plain text only: no markdown, no headings, no code blocks, no asterisks.",
  '- Bullet lists using "•" are fine. Keep it ideally under 300 characters.',
  "- Money is UGX unless the JSON says otherwise.",
  "- Do not mention JSON, fields, tools, or that an action ran. Just talk to the user.",
  "- Reply with the message text only — nothing before or after it.",
].join("\n");

/**
 * Turn a router result into a WhatsApp message via OpenRouter.
 * @param {{ kind: string, [key: string]: any }} result  Structured router output.
 * @param {{ userMessage?: string }} [meta]              Original user text, for tone/context only.
 * @returns {Promise<string>} the reply text
 * @throws if the key is missing or the API call ultimately fails
 */
export async function formatReplyAI(result, meta = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set — required for the WhatsApp AI formatter.",
    );
  }

  const payload = compact(result);
  const userContent =
    (meta.userMessage ? `The user said: ${meta.userMessage}\n\n` : "") +
    `Action result (JSON):\n${JSON.stringify(payload)}`;

  const body = JSON.stringify({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 500,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (process.env.OPENROUTER_SITE_URL)
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  if (process.env.OPENROUTER_SITE_NAME)
    headers["X-Title"] = process.env.OPENROUTER_SITE_NAME;

  const data = await callWithBackoff(() => postJson(headers, body));

  let text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter returned an empty message");

  if (text.length > MAX_REPLY_CHARS)
    text = text.slice(0, MAX_REPLY_CHARS) + "…";
  return text;
}

async function postJson(headers, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(
      `OpenRouter HTTP ${res.status}: ${errText.slice(0, 200)}`,
    );
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Free models rate-limit hard (HTTP 429) and 5xx blips happen. Retry those;
// let everything else (bad key, 400, abort) surface immediately.
async function callWithBackoff(fn) {
  let delay = 1500;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable =
        err?.status === 429 || (err?.status >= 500 && err?.status < 600);
      if (!retryable || attempt === MAX_ATTEMPTS) throw err;
      console.warn(
        `[whatsapp-ai/openrouter] HTTP ${err.status} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delay}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

// Strip anything the model shouldn't see or shouldn't render:
// session internals and routing metadata.
function compact(result) {
  if (!result || typeof result !== "object") return result;
  const { nextSession, intent, ...rest } = result;
  return rest;
}