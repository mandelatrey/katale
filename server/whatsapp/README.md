# server/whatsapp

WhatsApp integration scaffold. **Nothing here is wired to a live provider
yet** — every provider method throws `not implemented` and the router
returns `not_implemented` for every intent. What's in place is the
shape: a thin orchestrator that calls the existing `server/services/*`
layer, so when we flip the switch we're only writing the intent parser
and provider adapters, not re-plumbing the app.

## Shape

```
inbound HTTP POST
  -> index.js            Express router, mounted at /api/whatsapp
  -> providers/index.js  picks twilio or meta based on payload shape
  -> provider.parseInbound(req)  -> { fromPhoneE164, text, mediaUrls? }
  -> User.findOne({ phoneE164 })
  -> sessions.load(phone)        -> multi-turn FSM state
  -> router.route(ctx)           -> intents/parse -> services/*
  -> sessions.save(phone, next)
  -> formatter.formatReply(result) -> string
  -> provider.sendOutbound({ to, text })
  -> 200 ACK
```

The router never imports Express or Mongoose directly — it calls the
service layer with an `actor = { userId, source: "whatsapp" }`, which
is the same contract the HTTP routes use. Same validation, same
ownership rules (once enforced — see `docs/auth-model.md`).

## Files

| file                     | responsibility                                              |
| ------------------------ | ----------------------------------------------------------- |
| `index.js`               | Express router; health + verification + main webhook route |
| `router.js`              | intent kind → service call; pure function                   |
| `intents/parse.js`       | text + session → intent kind + args; stub for now           |
| `sessions.js`            | load/save/clear conversation state; in-memory impl today    |
| `formatter.js`           | service result → WhatsApp-friendly text                     |
| `providers/index.js`     | pick twilio vs meta based on request shape                  |
| `providers/twilio.js`    | Twilio sandbox adapter — **stub**                           |
| `providers/meta.js`      | Meta Cloud API adapter — **stub**                           |
| `../ai/agent.js`         | LLM tool-use loop (replaces router when `WHATSAPP_AI_MIDDLEWARE=1`) |
| `../ai/tools.js`         | DB operations exposed as tools to the LLM                   |
| `../ai/systemPrompt.js`  | per-request system prompt (embeds sender identity)          |

## AI middleware

Set `WHATSAPP_AI_MIDDLEWARE=1` and `ANTHROPIC_API_KEY=...` and the
webhook routes inbound text through `../ai/agent.js` instead of the
keyword router. The agent calls Claude with the `server/services/*`
functions exposed as tools, loops on tool calls until it has what it
needs, then composes the WhatsApp reply directly. Multi-turn context
(last `WHATSAPP_AI_HISTORY_TURNS` exchanges) is persisted on the
session by phone. If the agent throws, the webhook silently falls back
to the keyword router so a flaky LLM call never bricks delivery.

## Running locally

`npm run dev` at the repo root boots everything in one shot:

| process | port | notes                                               |
| ------- | ---- | --------------------------------------------------- |
| api     | 3001 | main Express server (also mounts the webhook)       |
| web     | 5173 | Vite client                                         |
| wa      | 3002 | second Express instance running only the webhook    |
| ngrok   | —    | public tunnel → http://localhost:3002 (if token set)|

The ngrok process prints the public webhook URL at startup — drop it
into Twilio's sandbox "When a message comes in" field (method `POST`)
or into the Meta Cloud API callback URL. With no `NGROK_AUTHTOKEN`
set, ngrok is skipped and the rest of `npm run dev` keeps working;
you can still exercise the pipeline locally via the simulator below.

If you only need the web app, run `npm run dev:api-only` to skip the
webhook + tunnel.

Health check:

```
curl http://localhost:3002/api/whatsapp/health
```

Simulate an inbound message without leaving the machine:

```
npm run whatsapp:simulate "price of maize" --from +256700000001 --provider twilio
```

## Env vars (to add when wiring providers)

| var                      | used by | notes                                         |
| ------------------------ | ------- | --------------------------------------------- |
| `WHATSAPP_WEBHOOK_PORT`  | dev     | defaults to 3002; ngrok reads the same value  |
| `NGROK_AUTHTOKEN`        | dev     | required to open the tunnel; skipped if blank |
| `NGROK_DOMAIN`           | dev     | optional fixed subdomain (paid plans)         |
| `TWILIO_ACCOUNT_SID`     | twilio  | basic auth for the outbound send              |
| `TWILIO_AUTH_TOKEN`      | twilio  | same                                          |
| `TWILIO_WHATSAPP_FROM`   | twilio  | sandbox number, E.164                         |
| `META_ACCESS_TOKEN`      | meta    | system user token with whatsapp_business_messaging |
| `META_PHONE_NUMBER_ID`   | meta    | number to send from                           |
| `META_VERIFY_TOKEN`      | meta    | echoed on GET /webhook challenge              |
| `META_APP_SECRET`        | meta    | for X-Hub-Signature-256 validation            |
| `WHATSAPP_AI_MIDDLEWARE` | ai      | set to `1` to route inbound messages through the LLM agent (`server/ai/`) instead of the keyword router |
| `ANTHROPIC_API_KEY`      | ai      | required when the AI middleware is on         |
| `ANTHROPIC_MODEL`        | ai      | optional override (default `claude-opus-4-7`) |
| `WHATSAPP_AI_MAX_ITERATIONS` | ai  | optional cap on tool-call rounds per message (default 8) |
| `WHATSAPP_AI_HISTORY_TURNS`  | ai  | optional rolling history depth per phone (default 6 turns) |

`.env` is already loaded by `server/index.js` via `dotenv/config`.

## Handoff points

What's left to do before this talks to a phone:

1. **`providers/twilio.js`** — implement `parseInbound` (form-encoded
   body; strip `whatsapp:` prefix from `From`) and `sendOutbound` (POST
   to `api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json`).
2. **`providers/meta.js`** — implement the Cloud API equivalents and
   the verification challenge in `index.js` GET /webhook.
3. **`intents/parse.js`** — keyword + numbered-menu parser against the
   current session state. An LLM-based parser can replace this later
   without changing the router contract.
4. **`router.js`** — fill the switch. For each intent, call one or
   more functions from `server/services/*` with
   `actor = { userId, source: "whatsapp" }`. Return
   `{ kind, ...payload, nextSession }`.
5. **`formatter.js`** — add a case per `result.kind` the router emits;
   keep messages short (WhatsApp ~1600 char limit, but aim for <300).
6. **`sessions.js`** — replace `createInMemoryStore` with a
   Mongoose-backed store: collection `whatsapp_sessions`, unique index
   on `phoneE164`, TTL index on `updatedAt` ~30 min.
7. **Signup flow** — `index.js` currently passes a `null` user through
   the pipeline when `phoneE164` isn't registered. Router should
   special-case that to prompt the user to sign up (name + role) and
   create a `User` record on confirmation.

## Why a stub this shaped

- The file boundaries match the integration's actual seams (provider,
  parse, route, format, send), so each future PR stays small.
- Every stub is behind a small named function, so tests can mock one
  piece without pulling in the whole chain.
- The webhook route in `index.js` is the *only* place that knows about
  Express; everything below it is plain functions that the upcoming
  `scripts/simulateWhatsapp.js` can exercise without starting an HTTP
  server.
