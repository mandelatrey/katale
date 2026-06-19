// PROVIDER SELECTOR.

import { twilioProvider } from "./twilio.js";
import { metaProvider } from "./meta.js";

/**
 * @param {import("express").Request} req
 */
export function providerFromRequest(req) {

  //IMPORTANT: investigate this override during prodn.
  const override = req.get("x-whatsapp-provider");
  if (override === "twilio") return twilioProvider;
  if (override === "meta") return metaProvider;

  if (req.body?.object === "whatsapp_business_account") return metaProvider;
  if (typeof req.body?.From === "string") return twilioProvider;

  // Default to Twilio during dev.
  return twilioProvider;
}
