// Thin wrapper over the Twilio Verify REST API (WhatsApp channel).
// We use fetch directly to match the style of ./twilio.js and avoid pulling in
// the Twilio SDK.
//
// Env required:
//   TWILIO_ACCOUNT_SID          — account credentials
//   TWILIO_AUTH_TOKEN
//   TWILIO_VERIFY_SERVICE_SID   — the Verify service (see Twilio console > Verify > Services)

const VERIFY_BASE = "https://verify.twilio.com/v2";

function assertConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error(
      "Twilio Verify not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID)",
    );
  }
  return { accountSid, authToken, serviceSid };
}

function basicAuthHeader(accountSid, authToken) {
  return "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
}

async function twilioPost(path, params) {
  const { accountSid, authToken, serviceSid } = assertConfig();
  const url = `${VERIFY_BASE}/Services/${serviceSid}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(accountSid, authToken),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.message || `Twilio Verify error: ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = body?.code;
    throw err;
  }
  return body;
}

/**
 * Start a WhatsApp OTP verification for the given E.164 phone.
 * @param {string} phoneE164
 * @returns {Promise<{ sid: string, status: string }>}
 */
export async function startVerification(phoneE164) {
  const body = await twilioPost("/Verifications", {
    To: phoneE164,
    Channel: "whatsapp",
  });
  return { sid: body.sid, status: body.status };
}

/**
 * Check an OTP code against a pending verification.
 * @param {string} phoneE164
 * @param {string} code
 * @returns {Promise<{ status: "approved" | "pending" | "canceled", valid: boolean }>}
 */
export async function checkVerification(phoneE164, code) {
  const body = await twilioPost("/VerificationCheck", {
    To: phoneE164,
    Code: code,
  });
  return { status: body.status, valid: body.status === "approved" };
}
