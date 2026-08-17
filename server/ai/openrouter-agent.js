import { executeTool, openaiToolDeclarations } from "./tools.js";
import { buildSystemPrompt } from './systemPrompt.js';

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL =
  process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";
const MAX_ITERATIONS = Number(process.env.WHATSAPP_AI_MAX_ATTEMPTS);
const MAX_TOKENS = Number(process.env.WHATSAPP_AI_MAX_TOKENS);
const HISTORY_TURNS = Number(process.env.WHATSAPP_AI_HISTORY_TURNS);
const TIMEOUT_MS = Number(process.env.WHATSAPP_AI_TIMEOUT_MS);
const TOOL_RESULT_CHAR_CAP = 15000;

/**
 * Here we run the Openrouter agent for an inbound whatsapp message.
 * **/

export async function runAgent(ctx){
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey){
        throw new Error("OPENROUTER_API_KEY IS NOT SET - it is required for the AI middleware");
    }

    const history = Array.isArray(ctx.session?.history) ? ctx.session.history : [];

    const messages = [
        {role: "system", content: buildSystemPrompt(ctx)}, 
        ...history.map((h) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: h.text,
        })),
        {role: "user", content: ctx.message.text}
    ];

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };
    if(process.env.OPENROUTER_SITE_URL)
        headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
    if(process.env.OPENROUTER_SITE_NAME)
        headers["X-Title"] = process.env.OPENROUTER_SITE_NAME;

    let finalText = "";
    let stoppedCleanly = false;

    for (let i = 0; i < MAX_ITERATIONS; i++){
        const data = await callWithBackoff(() => postJson(
            headers, {
                model: MODEL,
                temperature: 0.2,
                max_tokens: MAX_TOKENS,
                messages,
                tools: openaiToolDeclarations,
                tool_choice: "auto",
            }
        ));

        const choice = data?.choices?.[0]
        if (!choice) throw new Error("OpenRouter returned no choices");
        const msg = choice.message ?? {};

        if (choice.finsh_reason === "content-filter"){
            finalText = "Sorry I cannot help with that";
            stoppedCleanly = true;
            break;
        }

        if(!msg.tool_calls?.length){
            finalText= (msg.content ?? "").trim();
            stoppedCleanly = true;
            break;
        }

        messages.push({
            role: "assistant",
            content: msg.content ?? null,
            tool_calls: msg.tool_calls,
        });

        for (const tc of msg.tool_calls){
            let resultText;
            try {
                const args = safeParseArgs(tc.function?.arguments);
                const raw = await executeTool(tc.function?.name, args, ctx);
                resultText = serialiseToolResult(raw);
            } catch (err) {
                console.warn(
                    `[whatsapp-ai/openrouter-agent]'s tool ${tc.function?.name} failed`,
                    err.message
                );
                resultText = JSON.stringify({
                    error: err.message || "Failed to execute tool",
                    code: err.code,
                });
                
                messages.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: resultText,
                });
            }
        }

        if(!finalText){
            finalText = stoppedCleanly ? 
                "Sorry I couldn't put together your request. Try to rephrase" 
                : "That request took too many steps. Ty to break things down" ;
        }

        if(finalText.length > 1500) finalText.slice(0, 1500) + "...";

        const newHistory = [
            ...history,
            {role: "user", text: ctx.message.text},
            {role: "assistant", text: finalText},
        ].slice(-HISTORY_TURNS * 2);

        return {
            reply: finalText,
            nextSession:{ state: "ai", data: {}, history: newHistory }
        };
    }

    async function postJson(headers, body){
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        let res;
        try {
            res = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timer);
        }

        if(!res.ok){
            const errText = await res.text().catch(() => "");
            const err = new Error(
                `OpenRouter HTTP ${res.status}: ${errText.slice(0, 200)}`,
            );
            err.status = res.status;
            throw err;
        }

        return res.json();
    }

    async function callWithBackoff(fn, maxAttempts=3){
        let delay = 1500;
        for (let attempt = 1; attempt < maxAttempts; attempt++){
            try {
                return await fn();
            } catch (err) {
                const retryable = err?.status === 429 || (err?.status >= 500 && err?.status < 600);
                if(!retryable || attempt === maxAttempts) throw err;
                console.warn(
                    `[whatsapp-ai/openrouter-agent] HTTP ${err.status} (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`
                );
                await new Promise((r) => setTimeout(r, delay))
                delay *= 2 
            }
        }
    }

    function safeParseArgs(raw){
        if (raw === null || raw === "") return {};
        if(typeof raw === "object") return raw;
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }

    function serialiseToolResult(value){
        if (value === undefined) return "null";
        let json;
        try {
            json = JSON.stringify(value)
        } catch {
            json = JSON.stringify({ error: "could not serialise result "})
        }

        if (json.length > TOOL_RESULT_CHAR_CAP) {
            return (
                json.slice(0, TOOL_RESULT_CHAR_CAP) + 
                `\n...[truncated; original length ${json.length} chars]`
            )
        }

        return json;
    }
}