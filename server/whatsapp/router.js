// Intent → action router.
//
// Each intent maps to one or more calls into server/services/*. The
// router never touches the DB directly — that's the service layer's
// job. It returns a structured `result` that formatter.js turns into
// a WhatsApp reply.
//
// The switch is intentionally empty. Next session: fill in cases using
// the shortlist in the README ("prices", "list pending payments", etc.)
// and the intent parser in ./intents/.

import { parseIntent } from "./intents/parse.js";

/**
 * @param {{
 *   message: { fromPhoneE164: string, text: string, mediaUrls?: string[] },
 *   user: import("mongoose").Document | null,
 *   session: { state: string, data: any } | null,
 *   actor: { userId: string | null, source: "whatsapp" }
 * }} ctx
 */
export async function route(ctx) {
  const intent = parseIntent(ctx.message.text, ctx.session);

  switch (intent.kind) {
    case "unknown":
    case "help":
    case "price_check":
    case "nearby_markets":
    case "create_transaction":
    case "cancel_transaction":
    case "list_pending_payments":
    case "list_my_carriers":
    case "update_carrier_status":
    case "list_my_assets":
    case "latest_statement":
    default:
      return {
        kind: "not_implemented",
        intent: intent.kind,
        nextSession: ctx.session ?? { state: "idle", data: {} },
      };
  }
}
