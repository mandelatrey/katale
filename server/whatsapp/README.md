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

## Running locally

The webhook is mounted inside the main Express server. For iteration
you can boot a second instance on a different port so the web app
(on :3001) and the webhook (on :3002) can run side by side, pointed at
the same Mongo:

```
# terminal 1 — web API on :3001
npm run dev

# terminal 2 — webhook on :3002 (point ngrok / Twilio here)
npm run dev:webhook
```

Health check:

```
curl http://localhost:3002/api/whatsapp/health
```

## Env vars (to add when wiring providers)

| var                      | used by | notes                                         |
| ------------------------ | ------- | --------------------------------------------- |
| `TWILIO_ACCOUNT_SID`     | twilio  | basic auth for the outbound send              |
| `TWILIO_AUTH_TOKEN`      | twilio  | same                                          |
| `TWILIO_WHATSAPP_FROM`   | twilio  | sandbox number, E.164                         |
| `META_ACCESS_TOKEN`      | meta    | system user token with whatsapp_business_messaging |
| `META_PHONE_NUMBER_ID`   | meta    | number to send from                           |
| `META_VERIFY_TOKEN`      | meta    | echoed on GET /webhook challenge              |
| `META_APP_SECRET`        | meta    | for X-Hub-Signature-256 validation            |

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
