const ESCAPE_RE = /^(help|menu|\?|commands?|start|cancel|stop)\b/;

/**
 * @param {string} text
 * @param {{ state: string, data: any } | null} session
 * @returns {{ kind: string, args?: Record<string, unknown> }}
 */


const INTENTS = [
  {
    // Greetings + explicit help. Highest score so "hi, price of maize" still
    // greets rather than half-matching something else.
    kind: "help",
    match: (t) =>
      /^(help|menu|\?|commands?|start)\b/i.test(t) ||
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
      return commodity ? { commodity } : {};
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

  if(session?.state && /^(cancel|stop|back|menu|exit)\b/i.test(raw)) {
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
      // Apply the same extraction logic as the main parser: only accept
      // leading letters and spaces so punctuation or extra words are stripped.
      const commodity = lower.match(/^([a-z][a-z ]*)/)?.[1]?.trim();
      return commodity
        ? { kind: "price_check", args: { commodity } }
        : null;
    }
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
  if(!text) return undefined;
  if (/\bon\s+the\s+way\b/.test(lower)) return "ON THE WAY";
  if (/\bunloading\b/.test(lower)) return "UNLOADING";
  if (/\bloading\b/.test(lower)) return "LOADING";
  if (/\bwaiting\b/.test(lower)) return "WAITING";
  return null;
}