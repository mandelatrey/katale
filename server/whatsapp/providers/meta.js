// Meta Cloud API WhatsApp provider — stub.
//
// Real impl will:
//   - parseInbound: walk req.body.entry[].changes[].value.messages[]; the
//     first text message yields { fromPhoneE164: "+" + msg.from, text:
//     msg.text.body }. Image/audio/document messages need a second call
//     to the media endpoint to resolve mediaUrls.
//   - sendOutbound: POST to https://graph.facebook.com/v19.0/
//     {META_PHONE_NUMBER_ID}/messages with Bearer META_ACCESS_TOKEN,
//     body { messaging_product: "whatsapp", to, type: "text",
//     text: { body: text } }.
//   - Also: the GET /webhook verification in server/whatsapp/index.js
//     needs to compare req.query["hub.verify_token"] === META_VERIFY_TOKEN
//     and echo hub.challenge.
//
// Env vars to add when wiring up:
//   META_ACCESS_TOKEN, META_PHONE_NUMBER_ID, META_VERIFY_TOKEN,
//   META_APP_SECRET (for X-Hub-Signature-256 validation).

export const metaProvider = {
  async parseInbound(_req) {
    throw new Error("meta.parseInbound: not implemented");
  },
  async sendOutbound(_msg) {
    throw new Error("meta.sendOutbound: not implemented");
  },
};
