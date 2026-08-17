# Agribridge auth model

Short reference for the identity model that lets the web app and the
WhatsApp webhook share the same API layer.

## Today (prep state)

- No session auth, no JWT, no cookies.
- Services accept an `actor = { userId, source }` argument; routes build
  it from an `x-actor-id` header (`actorFromRequest` in `server/lib/routeAdapter.js`).
- If no header is set, `actor` is `{ userId: null, source: "anonymous" }`
  and mutations still succeed — this is fine for local dev but the
  deployment plan below tightens it.

## User model

`server/models/User.js`

| field        | notes                                                |
| ------------ | ---------------------------------------------------- |
| `_id`        | ObjectId                                             |
| `name`       | required                                             |
| `phoneE164`  | required, unique, indexed — primary identity         |
| `role`       | `farmer` / `broker` / `staff` / `admin`              |
| `active`     | bool, defaults true                                  |
| `createdAt`  | Date                                                 |

One User per phone number. No separate phone-identities table: Meta and
Twilio both key off E.164 and we only ever have one Agribridge account
per WhatsApp number. If that changes we add a `PhoneIdentity` collection
later — the current `phoneE164` field stays as the canonical.

## User refs on mutable collections

All nullable, all backwards-compatible with existing seeded data.

| collection    | new fields                                  |
| ------------- | ------------------------------------------- |
| `Transaction` | `createdBy`, `buyerUser`, `sellerUser`      |
| `Payment`     | `paidByUser`, `paidToUser`                  |

The existing string fields (`buyer`, `seller`, `paidBy`, `paidTo`) stay:
they're human display labels and the current seed scripts populate them.
New writes from a known actor populate both.

## Access rules per table (proposed)

Since there is no Postgres + RLS, these rules live in the service layer.
Phase 1 wired the `actor` parameter through — Phase 2+ enforces it.

| collection    | SELECT                 | INSERT                      | UPDATE                              | DELETE                              |
| ------------- | ---------------------- | --------------------------- | ----------------------------------- | ----------------------------------- |
| `Market`      | public (any actor)     | staff only                  | staff only                          | staff only                          |
| `Price`       | public                 | staff / ingestion job       | staff                               | staff                               |
| `Insight`     | public                 | staff                       | staff                               | staff                               |
| `Report`      | public                 | staff                       | staff                               | staff                               |
| `Statement`   | public                 | staff                       | staff                               | staff                               |
| `Transaction` | public (today)         | any authenticated actor     | `createdBy === actor` OR staff      | `createdBy === actor` OR staff      |
| `Payment`     | public (today)         | internal (auto on txn POST) | staff only                          | staff only                          |
| `User`        | self + staff           | self-signup via WhatsApp    | self + staff                        | staff only                          |

"public" = any actor, including anonymous. Today's behaviour.

Steps to enforce (not done yet):

1. Add `requireActor(role?)` middleware that rejects anonymous on
   mutating endpoints except those explicitly public.
2. Add `assertOwnership(resource, actor)` helper used inside mutating
   services after the Zod parse succeeds.
3. Add a lightweight web auth flow (phone OTP → JWT) that sets the
   `x-actor-id` header client-side.

## WhatsApp resolution flow

```
inbound WhatsApp message
  -> provider-specific adapter (server/whatsapp/providers/{twilio,meta}.ts)
     normalises to { fromPhoneE164, text, mediaUrls }
  -> router resolves fromPhoneE164 -> User via User.findOne({ phoneE164 })
     - if no match: reply with signup prompt, store pending session
  -> intent parser -> service call with actor = { userId, source: "whatsapp" }
  -> formatter turns the service result into WhatsApp-friendly text
```

The webhook never bypasses the service layer. Same validation, same
ownership checks.

## Migration

`server/scripts/addUsers.js` — run with `npm run migrate:users`. It is
idempotent: creates the `users` collection, syncs new indexes on
Transaction / Payment, and optionally seeds 2 demo users when
`RUN_DEV_SEED=1`.
