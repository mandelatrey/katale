// Intent parser.
//
// Keyword + session-state matching. The router treats the returned
// { kind, args } as an opaque token, so an LLM-based parser can replace
// this file later without touching the router contract.

// Keywords that must always fall through to the main parser so users can
// escape a session dialog at any time.
const ESCAPE_RE = /^(help|menu|\?|commands?|start|cancel|stop)\b/;

/**
 * @param {string} text
 * @param {{ state: string, data: any } | null} session
 * @returns {{ kind: string, args?: Record<string, unknown> }}
 */
export function parseIntent(text, session) {
  const raw = (text ?? "").trim();
  const lower = raw.toLowerCase();

  // Session follow-ups take priority — the router previously asked a
  // question and this message is the answer.
  // Exception: escape keywords always bypass the session so the user can
  // abort a dialog or ask for help at any point.
  if (session?.state && raw && !ESCAPE_RE.test(lower)) {
    const follow = matchSessionFollowup(session.state, raw, lower);
    if (follow) return follow;
  }

  if (!lower) return { kind: "unknown" };

  if (/^(help|menu|\?|commands?|start)\b/.test(lower) ||
      /^(hi|hello|hey|sup|yo)\b/.test(lower)) {
    return { kind: "help" };
  }

  // Markets near the user — checked before price_check so that combined
  // queries like "market prices" are treated as a location intent, not a
  // commodity lookup. An optional "lat,lng" pair can be appended.
  if (/\b(markets?|nearby|near\s+me)\b/.test(lower)) {
    const coords = parseCoords(raw);
    return { kind: "nearby_markets", args: coords ?? {} };
  }

  // Price check: "price", "prices", "price of maize", "prices for beans".
  if (/\bprices?\b/.test(lower)) {
    const m = lower.match(/prices?\s+(?:of|for)\s+([a-z][a-z ]*)\s*$/);
    const commodity = m ? m[1].trim() : undefined;
    return { kind: "price_check", args: commodity ? { commodity } : {} };
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

  // Cancel a transaction — "cancel TXN-00003" or "cancel <24-char-hex>".
  // The ref must immediately follow "cancel" to avoid matching unrelated
  // hex strings that happen to appear elsewhere in the message.
  if (/\bcancel\b/.test(lower)) {
    const m = raw.match(/\bcancel\s+(TXN-\d+)\b/i)
             || raw.match(/\bcancel\s+([0-9a-f]{24})\b/i);
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

function parseCoords(text) {
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

// Returns a lowercase slug so downstream comparisons are case-insensitive
// by construction and consistent with all other intent args.
function parseCarrierStatus(lower) {
  if (/\bon\s+the\s+way\b/.test(lower)) return "on_the_way";
  if (/\bloading\b/.test(lower)) return "loading";
  if (/\bunloading\b/.test(lower)) return "unloading";
  if (/\bwaiting\b/.test(lower)) return "waiting";
  return null;
}
