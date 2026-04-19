// Provider selector.
//
// The webhook accepts inbound messages from either Twilio (sandbox during
// dev) or Meta Cloud API (production). Both adapters implement the same
// tiny contract so the rest of the module doesn't care which one is
// serving the request:
//
//   {
//     parseInbound(req): Promise<NormalisedMessage | null>
//     sendOutbound({ to, text }): Promise<void>
//   }
//
// NormalisedMessage = { fromPhoneE164, text, mediaUrls?: string[] }

import { twilioProvider } from "./twilio.js";
import { metaProvider } from "./meta.js";

/**
 * @param {import("express").Request} req
 */
export function providerFromRequest(req) {
  // Meta Cloud API posts JSON with an "object":"whatsapp_business_account"
  // envelope. Twilio posts form-encoded bodies with a "From" field. A
  // header override lets the simulator force a provider during tests.
  const override = req.get("x-whatsapp-provider");
  if (override === "twilio") return twilioProvider;
  if (override === "meta") return metaProvider;

  if (req.body?.object === "whatsapp_business_account") return metaProvider;
  if (typeof req.body?.From === "string") return twilioProvider;

  // Default to Twilio during dev — the sandbox is what most devs will
  // point at first.
  return twilioProvider;
}
