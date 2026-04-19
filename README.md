# Uganda Agricultural Market Map

Interactive map showing Uganda's agricultural markets with real-time commodity prices.

## Features

- Interactive map of Uganda with market locations
- Real-time prices for matooke, maize, beans, and coffee
- Find nearest markets using GPS
- Compare prices across locations
- Transport cost estimates between markets
- Price trend charts

## Quick Start

```bash
# Install dependencies
npm run install:all

# Seed database with sample data
npm run seed

# Start development servers
npm run dev
```

## Tech Stack

- **Frontend**: React + Vite + OpenLayers
- **Backend**: Node.js + Express
- **Database**: MongoDB with geospatial queries
- **Charts**: Chart.js

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/markets | List all markets |
| GET /api/markets/nearest/:lng/:lat | Find nearest markets |
| GET /api/prices/latest | Get latest prices |
| GET /api/prices/compare/:commodity | Compare prices across markets |
| GET /api/prices/transport/:fromId/:toId | Estimate transport costs |
| GET /api/prices/history/:commodity | Get price history |

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/uganda-markets
PORT=3001
```

## WhatsApp integration — prep status

Work-in-progress scaffolding to let brokers, carriers, and farmers hit
the same API from WhatsApp (Twilio sandbox → Meta Cloud API). **Nothing
is live yet** — there are no outbound messages and no provider
credentials in the tree.

What's in place:

- **Service layer** (`server/services/*`): per-domain modules, Zod-validated
  at the boundary, take an explicit `actor = { userId, source }`. The
  same functions are used by REST routes today and will be called by
  the webhook tomorrow.
- **User model** (`server/models/User.js`): `phoneE164` keyed identity.
  Run `npm run migrate:users` (or `RUN_DEV_SEED=1 npm run migrate:users`
  for three demo users). See `docs/auth-model.md` for the per-table
  access matrix.
- **Webhook scaffold** (`server/whatsapp/`): Express router mounted at
  `/api/whatsapp`. Provider/intent/router/formatter/session stubs are
  wired together — every handler returns `not_implemented` until the
  Twilio and Meta adapters land. See `server/whatsapp/README.md`.
- **Tests** (`npm test` in `server/`): Vitest + mongodb-memory-server.
  Pure-unit tests (validation, route adapter, provider selector,
  formatter, session store) run without a DB; service tests spin up an
  ephemeral Mongo. Tests skip gracefully when the Mongo binary isn't
  available locally.
- **Simulator**: `npm run whatsapp:simulate -- "hi" --provider twilio`
  posts a fake inbound to the local webhook (expects `dev:webhook` on
  :3002).

What's still to do before production WhatsApp traffic:

1. Implement `server/whatsapp/providers/{twilio,meta}.js` (parseInbound,
   sendOutbound, Meta verification).
2. Fill `server/whatsapp/intents/parse.js` and the `switch` in
   `server/whatsapp/router.js` — start with the top intents listed in
   `server/whatsapp/README.md`.
3. Replace the in-memory session store with a Mongoose-backed store
   (TTL ~30 min).
4. Enforce ownership rules in the service layer per
   `docs/auth-model.md` and add a signup flow for unknown numbers.