// AI entry point for the WhatsApp middleware.
//
// Provider: OpenRouter. Set OPENROUTER_API_KEY in server/.env.
// Override the model with OPENROUTER_MODEL (default:
// meta-llama/llama-3.3-70b-instruct:free).

export { formatReplyAI } from "./openrouter.js";
