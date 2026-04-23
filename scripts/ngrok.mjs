#!/usr/bin/env node
// Starts an ngrok tunnel to the WhatsApp webhook server so external
// providers (Twilio sandbox, Meta Cloud API) can reach it during local
// development. Runs as part of `npm run dev`.
//
// Behaviour:
//   - Reads NGROK_AUTHTOKEN from server/.env (or the environment).
//   - Tunnels http://localhost:${WHATSAPP_WEBHOOK_PORT || 3002}.
//   - Prints the public URL + the full webhook path so it can be copied
//     straight into Twilio/Meta configuration.
//   - If NGROK_AUTHTOKEN is missing, exits 0 with an informational log
//     instead of failing — `npm run dev` should keep working without a
//     tunnel, and the dev can add the token when they need one.
//   - Honours a fixed subdomain via NGROK_DOMAIN (requires a paid plan).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Hand-rolled .env loader so this script works without an npm install at
// the repo root (dotenv lives under server/).
function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

const envPaths = [
  resolve(__dirname, "..", "server", ".env"),
  resolve(__dirname, "..", ".env"),
];
for (const p of envPaths) loadEnvFile(p);

const authtoken = process.env.NGROK_AUTHTOKEN;
const port = Number(process.env.WHATSAPP_WEBHOOK_PORT || 3002);
const domain = process.env.NGROK_DOMAIN;

if (!authtoken) {
  console.log(
    "[ngrok] NGROK_AUTHTOKEN not set — skipping tunnel.\n" +
      "  Add it to one of these files:\n" +
      envPaths.map((p) => `    ${p}`).join("\n") +
      "\n  Example line:  NGROK_AUTHTOKEN=your_token_here",
  );
  // Keep the process alive so `concurrently` doesn't flag this as a
  // failure; exiting immediately would also kill sibling processes when
  // they're started with --kill-others-on-fail.
  setInterval(() => {}, 1 << 30);
} else {
  let ngrok;
  try {
    ngrok = await import("@ngrok/ngrok");
  } catch (err) {
    console.error(
      "[ngrok] @ngrok/ngrok is not installed. Run `npm install` at the " +
        "repo root to install it, then retry `npm run dev`.",
    );
    console.error(err.message);
    process.exit(1);
  }

  try {
    const listener = await ngrok.forward({
      addr: port,
      authtoken,
      domain: domain || undefined,
    });

    const publicUrl = listener.url();
    const webhookUrl = `${publicUrl}/api/whatsapp/webhook`;

    console.log(
      [
        "",
        "[ngrok] tunnel is live",
        `  public url      ${publicUrl}`,
        `  webhook url     ${webhookUrl}`,
        `  forwarding to   http://localhost:${port}`,
        "",
        "  Point Twilio's WhatsApp sandbox 'When a message comes in' at",
        "  the webhook url above (method: POST). For Meta Cloud API, set",
        "  the callback URL to the webhook url and use META_VERIFY_TOKEN",
        "  from server/.env as the verify token.",
        "",
      ].join("\n"),
    );

    const shutdown = async (signal) => {
      console.log(`[ngrok] received ${signal}, closing tunnel`);
      try {
        await listener.close();
      } catch (err) {
        console.error("[ngrok] error closing tunnel:", err.message);
      }
      clearInterval(keepAlive);
      process.exit(0);
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    // The listener object doesn't ref the event loop on its own, so
    // without this the script returns from top-level await and Node
    // exits cleanly — taking the tunnel down with it.
    const keepAlive = setInterval(() => {}, 1 << 30);
  } catch (err) {
    console.error("[ngrok] failed to start tunnel:", err.message || err);
    process.exit(1);
  }
}
