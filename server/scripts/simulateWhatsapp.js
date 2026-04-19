#!/usr/bin/env node
// Simulator for the WhatsApp webhook.
//
// Posts a fake inbound message to the local webhook so you can iterate
// on the router/formatter without hooking up a real Twilio or Meta
// account. Both payload shapes are supported; pick with --provider.
//
// Usage:
//   npm run whatsapp:simulate -- "price of maize" \
//     --from +256700000001 --provider twilio
//
// Flags:
//   --from        Sender E.164 (default +256700000001)
//   --provider    twilio | meta (default twilio)
//   --url         Webhook URL (default http://localhost:3002/api/whatsapp/webhook)
//
// The webhook returns 501 while provider stubs are unimplemented — that
// is expected and the point of this script is to exercise the rest of
// the pipeline (selector → error path → logging) until providers land.

const args = process.argv.slice(2);
const text = args.filter((a) => !a.startsWith("--")).join(" ") || "hi";

function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}

const from = flag("from", "+256700000001");
const provider = flag("provider", "twilio");
const url = flag("url", "http://localhost:3002/api/whatsapp/webhook");

function twilioBody(fromE164, body) {
  // Twilio posts application/x-www-form-urlencoded with whatsapp:+...
  const params = new URLSearchParams({
    From: `whatsapp:${fromE164}`,
    To: "whatsapp:+14155238886",
    Body: body,
    NumMedia: "0",
  });
  return { body: params.toString(), contentType: "application/x-www-form-urlencoded" };
}

function metaBody(fromE164, body) {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "SIMULATED",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { phone_number_id: "SIMULATED" },
              messages: [
                {
                  from: fromE164.replace(/^\+/, ""),
                  id: `wamid.sim.${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  return { body: JSON.stringify(payload), contentType: "application/json" };
}

async function main() {
  const { body, contentType } =
    provider === "meta" ? metaBody(from, text) : twilioBody(from, text);

  console.log(`[simulate] POST ${url}`);
  console.log(`[simulate] provider=${provider} from=${from} text=${JSON.stringify(text)}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "x-whatsapp-provider": provider,
    },
    body,
  });

  const respText = await res.text();
  console.log(`[simulate] ← ${res.status} ${res.statusText}`);
  if (respText) console.log(respText);
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error("[simulate] error:", err.message);
  process.exit(1);
});
