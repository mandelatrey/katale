// Twilio WhatsApp provider.
//
// Env vars required:
//   TWILIO_ACCOUNT_SID   - Twilio account SID
//   TWILIO_AUTH_TOKEN    - Twilio auth token
//   TWILIO_WHATSAPP_FROM - Your Twilio WhatsApp number (e.g. +14155238886)

export const twilioProvider = {
  /**
   * Parse inbound webhook payload from Twilio.
   * Twilio sends application/x-www-form-urlencoded data.
   * @param {import("express").Request} req
   * @returns {Promise<{ fromPhoneE164: string, text: string, mediaUrls?: string[] } | null>}
   */
  async parseInbound(req) {
    const body = req.body ?? {};

    // Twilio sends From as "whatsapp:+256700000001"
    const rawFrom = body.From;
    if (!rawFrom || !rawFrom.startsWith("whatsapp:")) {
      return null;
    }

    const fromPhoneE164 = rawFrom.replace("whatsapp:", "");
    const text = body.Body || "";

    // Handle media attachments
    const numMedia = parseInt(body.NumMedia || "0", 10);
    const mediaUrls = [];
    for (let i = 0; i < numMedia; i++) {
      const url = body[`MediaUrl${i}`];
      if (url) mediaUrls.push(url);
    }

    return {
      fromPhoneE164,
      text,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    };
  },

  /**
   * Send outbound message via Twilio API.
   * @param {{ to: string, text: string }} msg
   */
  async sendOutbound({ to, text }) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("[twilio] Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM");
      throw new Error("Twilio WhatsApp not configured");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    // Twilio expects whatsapp: prefix
    const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const fromWhatsApp = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;

    const params = new URLSearchParams({
      From: fromWhatsApp,
      To: toWhatsApp,
      Body: text,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[twilio] sendOutbound failed:", response.status, errorBody);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("[twilio] Message sent:", result.sid);
  },
};
