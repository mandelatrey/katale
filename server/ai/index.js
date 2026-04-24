// AI entry point for the WhatsApp middleware.
//
// Gemini is the only supported provider. Set GEMINI_API_KEY in server/.env.
// Override the model with GEMINI_MODEL (default: gemini-2.0-flash).

export { runAgent } from "./gemini.js";
