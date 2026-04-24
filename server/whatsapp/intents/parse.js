// Intent parser.
//
// Keyword + session-state matching. The router treats the returned
// { kind, args } as an opaque token, so an LLM-based parser can replace
// this file later without touching the router contract.

/**
 * @param {string} text
 * @param {{ state: string, data: any } | null} session
 * @returns {{ kind: string, args?: Record<string, unknown> }}
 */
export function parseIntent(text, session) {
  const raw = (text ?? "").trim();
  const lower = raw.toLowerCase();
  const commodity = detectCommodity(lower);

  // Session follow-ups take priority — the router previously asked a
  // question and this message is the answer.
  if (session?.state && raw) {
    const follow = matchSessionFollowup(session.state, raw, lower);
    if (follow) return follow;
  }

  if (!lower) return { kind: "unknown" };

  if (/^(help|menu|\?|commands?|start)\b/.test(lower) ||
      /^(hi|hello|hey|sup|yo)\b/.test(lower)) {
    return { kind: "help" };
  }

  // Price check: "price", "prices", "price of maize", "prices for beans".
  if (/\bprices?\b/.test(lower)) {
    return { kind: "price_check", args: commodity ? { commodity } : {} };
  }

  // Markets near the user. An optional "lat,lng" pair can be appended.
  if (/\b(markets?|nearby|near\s+me)\b/.test(lower)) {
    const coords = parseCoords(raw);
    return { kind: "nearby_markets", args: coords ?? {} };
  }

  // Payments
  if (/\b(pending|payments?)\b/.test(lower)) {
    return { kind: "list_pending_payments" };
  }

  // Carrier status update — "status on the way", "set loading", etc.
  if (/\b(set|update)\s+(status|carrier)\b/.test(lower) ||
      /\bstatus\s+(to\s+)?(on\s+the\s+way|loading|waiting|unloading)\b/.test(lower)) {
    const status = parseCarrierStatus(lower);
    return { kind: "update_carrier_status", args: status ? { status } : {} };
  }

  // Carriers list
  if (/\b(my\s+)?(carriers?|trucks?|vans?|vehicles?)\b/.test(lower)) {
    return { kind: "list_my_carriers" };
  }

  // Assets
  if (/\b(my\s+)?(assets?|inventory|warehouses?)\b/.test(lower)) {
    return { kind: "list_my_assets" };
  }

  // Statements
  if (/\b(statement|latest\s+statement|balance)\b/.test(lower)) {
    return { kind: "latest_statement" };
  }

  // Cancel a transaction — "cancel TXN-00003".
  if (/\bcancel\b/.test(lower)) {
    const m = raw.match(/\b(TXN-\d+|[0-9a-f]{24})\b/i);
    return {
      kind: "cancel_transaction",
      args: m ? { ref: m[1] } : {},
    };
  }

  // Create transaction — delegate the multi-step flow to the router.
  if (/\b(buy|sell|create\s+transaction|new\s+transaction)\b/.test(lower)) {
    return { kind: "create_transaction", args: {} };
  }

  return { kind: "unknown" };
}

function matchSessionFollowup(state, raw, lower) {
  switch (state) {
    case "awaiting_price_commodity":
      return { kind: "price_check", args: { commodity: raw.toLowerCase() } };
    case "awaiting_nearby_location": {
      const coords = parseCoords(raw);
      return coords ? { kind: "nearby_markets", args: coords } : null;
    }
    case "awaiting_carrier_status": {
      const status = parseCarrierStatus(lower);
      return status ? { kind: "update_carrier_status", args: { status } } : null;
    }
    default:
      return null;
  }
}

function parseCoords(text) {
  const m = text.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  // Uganda sits roughly at 0N 32E, so the second number is usually >10
  // (longitude) and the first ~0 (latitude). Be liberal: accept either
  // order by picking the one where |lat|<=90 and |lng|<=180.
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b };
  if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return { lat: b, lng: a };
  return null;
}

function parseCarrierStatus(lower) {
  if (/\bon\s+the\s+way\b/.test(lower)) return "ON THE WAY";
  if (/\bloading\b/.test(lower)) return "LOADING";
  if (/\bunloading\b/.test(lower)) return "UNLOADING";
  if (/\bwaiting\b/.test(lower)) return "WAITING";
  return null;
}

const KNOWN_COMMODITIES = [
  "maize",
  "beans",
  "coffee",
  "rice",
  "matooke",
  "groundnuts",
  "cassava",
  "sweet potatoes",
  "sweet_potatoes",
  "sorghum",
];

function detectCommodity(lower) {
  const normalized = lower
    .replace(/[^a-z\s_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const direct = KNOWN_COMMODITIES.find((c) =>
    new RegExp(`\\b${c.replace(/\s+/g, "\\s+")}\\b`).test(normalized),
  );
  if (!direct) return undefined;
  return direct.replace(/\s+/g, "_");
}

