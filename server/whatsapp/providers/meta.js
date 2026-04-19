// Meta Cloud API WhatsApp provider.
//
// Env vars required:
//   META_ACCESS_TOKEN    - Permanent access token from Meta dashboard
//   META_PHONE_NUMBER_ID - WhatsApp Business phone number ID
//   META_VERIFY_TOKEN    - Webhook verification token (already configured)

const GRAPH_API_VERSION = "v19.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export const metaProvider = {
  /**
   * Parse inbound webhook payload from Meta Cloud API.
   * Returns normalized message or null if not a user message.
   * @param {import("express").Request} req
   * @returns {Promise<{ fromPhoneE164: string, text: string, mediaUrls?: string[] } | null>}
   */
  async parseInbound(req) {
    const body = req.body;

    // Validate basic structure
    if (body?.object !== "whatsapp_business_account") {
      return null;
    }

    // Walk entry[].changes[].value.messages[]
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages?.length) {
      // Could be a status update (delivered, read, etc.) - acknowledge but skip
      return null;
    }

    const message = value.messages[0];
    const fromPhone = message.from; // e.g. "256700000001" (no + prefix)
    const fromPhoneE164 = fromPhone.startsWith("+") ? fromPhone : `+${fromPhone}`;

    // Handle different message types
    if (message.type === "text") {
      return {
        fromPhoneE164,
        text: message.text?.body || "",
      };
    }

    // Handle media messages (image, audio, document, video)
    if (["image", "audio", "document", "video"].includes(message.type)) {
      const mediaId = message[message.type]?.id;
      const caption = message[message.type]?.caption || "";

      let mediaUrls = [];
      if (mediaId) {
        try {
          const mediaUrl = await fetchMediaUrl(mediaId);
          if (mediaUrl) mediaUrls.push(mediaUrl);
        } catch (err) {
          console.error("[meta] Failed to fetch media URL:", err.message);
        }
      }

      return {
        fromPhoneE164,
        text: caption || `[${message.type}]`,
        mediaUrls,
      };
    }

    // Handle interactive responses (button clicks, list selections)
    if (message.type === "interactive") {
      const interactive = message.interactive;
      const replyId = interactive?.button_reply?.id || interactive?.list_reply?.id || "";
      const replyTitle = interactive?.button_reply?.title || interactive?.list_reply?.title || "";
      return {
        fromPhoneE164,
        text: replyId || replyTitle,
      };
    }

    // Fallback for unsupported message types
    return {
      fromPhoneE164,
      text: `[unsupported: ${message.type}]`,
    };
  },

  /**
   * Send outbound message via Meta Cloud API.
   * @param {{ to: string, text: string }} msg
   */
  async sendOutbound({ to, text }) {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error("[meta] Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN");
      throw new Error("Meta WhatsApp not configured");
    }

    // Strip + prefix if present - Meta expects raw number
    const toNumber = to.startsWith("+") ? to.slice(1) : to;

    const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toNumber,
      type: "text",
      text: { body: text },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[meta] sendOutbound failed:", response.status, errorBody);
      throw new Error(`Meta API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("[meta] Message sent:", result.messages?.[0]?.id);
  },
};

/**
 * Fetch the actual download URL for a media file.
 * @param {string} mediaId
 * @returns {Promise<string | null>}
 */
async function fetchMediaUrl(mediaId) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) return null;

  const url = `${GRAPH_API_BASE}/${mediaId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.url || null;
}
