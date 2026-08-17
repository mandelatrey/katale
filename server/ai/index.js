export { formatReplyAI } from "./openrouter.js";
// export {runAgent as runAgentGemini } from "./gemini.js"
export { runAgent as runAgentOpenRouter} from './openrouter-agent.js';

export function runAgent(ctx){
    const provider = process.env.WHATSAPP_AI_PROVIDER;
    // if(provider === "gemini") return runAgentGemini(ctx);
    return runAgentOpenRouter(ctx);
}