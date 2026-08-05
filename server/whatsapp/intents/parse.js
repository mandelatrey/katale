/**
 * @param {string} text
 * @param {{ state: string, data: any } | null} session
 * @returns {{ kind: string, args?: Record<string, unknown> }}
 */

const INTENTS = [
  // ── Design-spec reply keywords (exact bare-word, highest priority) ─────────
  {
    kind: "opt_out",
    match: (t) => /^stop\s*$/i.test(t),
    score: 30,
  },
  {
    kind: "opt_in",
    match: (t) => /^start\s*$/i.test(t),
    score: 30,
  },
  {
    kind: "less_notifications",
    match: (t) => /^less\s*$/i.test(t),
    score: 25,
  },
  {
    kind: "more_info",
    match: (t) => /^more\s*$/i.test(t),
    score: 25,
  },
  {
    kind: "list_stock",
    match: (t) => /^stock\s*$/i.test(t),
    score: 25,
  },
  {
    // Greetings + explicit help. "start"/"stop" are separate intents above.
    kind: "help",
    match: (t) =>
      /^(help|menu|\?|commands?)\b/i.test(t) ||
      /^(hi|hello|hey|yo|sup|hallo|habari)\b/i.test(t),
    score: 20,
  },
  {
    kind: "create_transaction",
    match: (t) =>
      /\b(buy|sell|create\s+(a\s+)?transaction|new\s+transaction)\b/i.test(t),
    score: 12,
  },
  {
    kind: "cancel_transaction",
    match: (t) => /\bcancel\s+(TXN-\d+|[0-9a-f]{24})\b/i.exec(t),
    score: 12,
    extract: (m) => ({ ref: m[1] }),
  },
  {
    // "markets near me", "nearby markets", "market near me 0.34,32.58"
    kind: "nearby_markets",
    match: (t) =>
      /\bnearby\b/i.test(t) ||
      /\bnear\s+me\b/i.test(t) ||
      /\bmarkets?\s+near\b/i.test(t) ||
      /\bnear(?:by)?\s+markets?\b/i.test(t),
    score: 8,
    // Coordinates are optional here — if absent, the router will prompt for them.
    extract: (_m, t) => parseCoords(t) ?? {},
  },
  {
    kind: "price_check",
    match: (t) => /\bprices?\b/i.test(t),
    score: 7,
    extract: (_m, t) => {
      const commodity = extractCommodity(t);
      const market = extractMarket(t);
      const args = {};
      if (commodity) args.commodity = commodity;
      if (market) args.market = market;
      return args;
    },
  },
  {
    kind: "update_carrier_status",
    match: (t) =>
      /\b(set|update)\s+(status|carrier)\b/i.test(t) ||
      /\bstatus\s+(to\s+)?(on\s+the\s+way|loading|waiting|unloading)\b/i.test(t),
    score: 6,
    extract: (_m, t) => {
      const status = parseCarrierStatus(t);
      return status ? { status } : {};
    },
  },
  {
    kind: "list_pending_payments",
    match: (t) => /\bpending\s+payments?\b|\bpayments?\s+pending\b/i.test(t),
    score: 6,
  },
  {
    kind: "list_my_carriers",
    match: (t) => /\b(my\s+)?(carriers?|trucks?|vans?|vehicles?)\b/i.test(t),
    score: 5,
  },
  {
    kind: "latest_statement",
    match: (t) => /\b(statements?|balance)\b/i.test(t),
    score: 5,
  },
  {
    kind: "list_my_assets",
    match: (t) => /\b(my\s+)?(assets?|inventory|warehouses?)\b/i.test(t),
    score: 4,
  },
];

export function parseIntent(text, session) {
  const raw = (text ?? "").trim();
  if(!raw) return { kind: "unknown" };

  // STOP/CANCEL/BACK/EXIT abort an in-flight session.
  // "start" no longer aborts — it routes to opt_in via the INTENTS array.
  if (session?.state && /^(cancel|stop|back|menu|exit)\s*$/i.test(raw)) {
    return { kind: "abort_session" };
  }

  if (session?.state) {
    const follow = matchSessionFollowup(session.state, raw);
    if (follow) return follow;
  }

  let best = null;

  for (const intent of INTENTS){
    const m = intent.match(raw);
    if(m && (!best || intent.score > best.intent.score)){
      best = {intent, m} 
    } 
  }

  if(!best) return { kind: "unknown"};

  return {
    kind: best.intent.kind,
    args:best.intent.extract 
      ? best.intent.extract(best.m, raw) 
      : undefined,
  };
}
  // return { kind: "unknown" };
// }

function matchSessionFollowup(state, raw) {
  const lower = raw.toLowerCase();
  switch (state) {
    case "awaiting_price_commodity": {
      // Accept either "maize" or "maize in nakasero" — same char rules as
      // the main parser (leading letters/spaces only).
      const m = lower
        .replace(/[?!.,;:]+\s*$/g, "")
        .match(/^([a-z][a-z ]*?)(?:\s+(?:in|at)\s+([a-z][a-z ]+))?$/);
      if (!m) return null;
      const args = { commodity: m[1].trim() };
      const market = cleanMarketName(m[2]);
      if (market) args.market = market;
      return { kind: "price_check", args };
    }
    case "awaiting_price_market_choice": {
      // User was shown a numbered list of matching markets.
      const n = Number(raw);
      if (Number.isInteger(n) && n >= 1) {
        return { kind: "choose_price_market", args: { index: n - 1 } };
      }
      return null; // not a number — treat as a fresh command
    }
    case "awaiting_nearby_location": {
      const coords = parseCoords(raw);
      return coords ? { kind: "nearby_markets", args: coords } : null;
    }
    case "awaiting_carrier_status": {
      const status = parseCarrierStatus(lower);
      return status ? { kind: "update_carrier_status", args: { status } } : null;
    }
    case "awaiting_order_confirmation": {
      if (/^yes\s*$/i.test(raw)) return { kind: "confirm_yes" };
      if (/^no\s*$/i.test(raw)) return { kind: "confirm_no" };
      return null;
    }
    case "awaiting_call_confirmation": {
      if (/^call\s*$/i.test(raw)) return { kind: "request_call" };
      return null;
    }
    default:
      return null;
  }
}



function extractCommodity(text) {
  if (!text) return undefined;

  // Normalize: drop trailing punctuation and polite fillers so "price of
  // maize, please?" and "price of maize" extract identically.
  const cleaned = text
    .toLowerCase()
    .replace(/[?!.,;:]+\s*$/g, "")
    .replace(/\s+(please|thanks|thank you|now|today)\s*$/g, "")
    .trim();

  // "price of maize", "prices for beans", "what is the price of maize in nakasero"
  // Capture stops at " in "/" at "/" near " so locations don't pollute the commodity.
  const m =
    cleaned.match(/\bprices?\s+(?:of|for)\s+([a-z][a-z ]*?)(?:\s+(?:in|at|near)\s+.*)?$/) ||
    cleaned.match(/\bprices?\s+([a-z][a-z ]*?)(?:\s+(?:in|at|near)\s+.*)?$/) ||
    cleaned.match(/\b([a-z][a-z ]*?)\s+prices?(?:\s+(?:in|at|near)\s+.*)?$/);

  return m?.[1]?.trim() || undefined;
}

/**
 * Pull a market name out of a price query: the words after " in " / " at ".
 *   "what is the price of maize in Nakasero?"  → "nakasero"
 *   "beans price at owino market"              → "owino"
 * Mirrors extractCommodity's normalisation so the two stay in sync.
 */
function extractMarket(text) {
  if (!text) return undefined;

  const cleaned = text
    .toLowerCase()
    .replace(/[?!.,;:]+\s*$/g, "")
    .replace(/\s+(please|thanks|thank you|now|today)\s*$/g, "")
    .trim();

  // Anchor on the price phrasing so "markets near me" never lands here.
  const m = cleaned.match(/\bprices?\b.*?\s(?:in|at)\s+([a-z][a-z ]+)$/);
  return cleanMarketName(m?.[1]);
}

/** "the nakasero market" → "nakasero" (so it matches the DB name search). */
function cleanMarketName(name) {
  if (!name) return undefined;
  const out = name
    .toLowerCase()
    .replace(/\b(the|market|markets)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return out || undefined;
}

function parseCoords(text) {
  if(!text) return undefined;
  // Require decimal points in both numbers so that integer pairs like prices
  // ("12,000 for 5"), dates ("2023-12-05"), or IDs ("TXN-00003 2023") are
  // never mistaken for coordinates. Only comma or semicolon are accepted as
  // separators — a plain space is too ambiguous.
  const m = text.match(/(-?\d+\.\d+)\s*[,;]\s*(-?\d+\.\d+)/);
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
  if(!lower) return undefined;
  if (/\bon\s+the\s+way\b/.test(lower)) return "ON THE WAY";
  if (/\bunloading\b/.test(lower)) return "UNLOADING";
  if (/\bloading\b/.test(lower)) return "LOADING";
  if (/\bwaiting\b/.test(lower)) return "WAITING";
  return null;
}