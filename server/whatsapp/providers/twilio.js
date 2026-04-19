// Twilio WhatsApp provider — stub.
//
// Real impl will:
//   - parseInbound: read form-encoded body, extract From ("whatsapp:+2567..."),
//     Body, and NumMedia/MediaUrl0..N; strip the "whatsapp:" prefix to
//     get the E.164 phone number.
//   - sendOutbound: POST to https://api.twilio.com/2010-04-01/Accounts/
//     {TWILIO_ACCOUNT_SID}/Messages.json with Basic auth from
//     TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN, using
//     From=whatsapp:{TWILIO_WHATSAPP_FROM} and To=whatsapp:{to}.
//
// Env vars to add when wiring up:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.

export const twilioProvider = {
  async parseInbound(_req) {
    throw new Error("twilio.parseInbound: not implemented");
  },
  async sendOutbound(_msg) {
    throw new Error("twilio.sendOutbound: not implemented");
  },
};
