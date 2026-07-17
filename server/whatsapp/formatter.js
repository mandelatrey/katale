// Service result → WhatsApp reply.
//
// Router returns a structured `result`; this file turns it into the
// plain-text body the provider will send. 

const HELP_BODY = [
  "Agribridge commands:",
  "• price of <commodity> — latest market prices",
  "• markets near me <lat,lng> — 10 closest markets",
  "• pending payments — your open payments",
  "• my carriers — your vehicles",
  "• set status <on the way|loading|waiting|unloading>",
  "• my assets — your registered assets",
  "• latest statement — most recent statement summary",
  "• cancel <transaction-id>",
].join("\n");

/**
 * @param {{ kind: string, [key: string]: any }} result
 * @returns {string}
 */
export function formatReply(result) {
  switch (result.kind) {
    case "help":
      return HELP_BODY;

    case "unknown":
      return "Sorry, I didn't catch that. Reply HELP to see what I can do.";

    case "not_implemented":
      return (
        "This action isn't wired up yet. Reply HELP to see what's available."
      );

    case "prompt_commodity":
      return "Which commodity? e.g. maize, beans, coffee.";

    case "prompt_location":
      return "Share your location, or reply with coordinates as \"lat,lng\" (e.g. 0.3476,32.5825).";

    case "prompt_carrier_status":
      return "What's the new status? Reply: ON THE WAY, LOADING, WAITING, or UNLOADING.";

    case "price_check":
      return formatPrices(result);

    case "prompt_market_choice":
      return formatMarketChoice(result);

    case "nearby_markets":
      return formatNearbyMarkets(result.markets);

    case "list_pending_payments":
      return formatPendingPayments(result.payments);

    case "list_my_carriers":
      return formatCarriers(result.carriers);

    case "update_carrier_status":
      return `Carrier ${result.carrier?.name ?? ""} is now ${result.carrier?.status ?? "updated"}.`.trim();

    case "list_my_assets":
      return formatUserAssets(result.assets);

    case "latest_statement":
      return formatUserStatement(result.statement);

    case "cancel_transaction":
      return `Transaction ${result.transaction?.transactionId ?? ""} cancelled.`.trim();

    case "error":
      return result.message || "Something went wrong. Please try again.";
      
    case "session_aborted":
      return "Session cancelled. Reply HELP to see what I can do.";

    default:
      return "Sorry, I didn't understand that.";
  }
}

function formatPrices({ commodity, market, marketNotFound, prices }) {
  if (!prices?.length) {
    return market
      ? `No recent prices found for ${commodity} at ${market}.`
      : `No recent prices found for ${commodity}.`;
  }

  const top = prices.slice(0, 5).map(
    (p) => {
      const marketName = p.marketInfo?.name ?? "Unknown";
      const district = p.marketInfo?.district ? `, ${p.marketInfo.district}` : "";
      return `• ${marketName}${district}: ${fmtMoney(p.price, p.currency)} / ${p.unit} (${p.priceType})`;
    }
  );
  const note = marketNotFound
    ? `I couldn't find a market called "${marketNotFound}", so here are prices across all markets.\n`
    : "";
  const header = market
    ? `Latest ${commodity} prices at ${market}:`
    : `Latest ${commodity} prices:`;
  const footer = prices.length > 5 ? `\n…and ${prices.length - 5} more.` : "";

  return note + [header, ...top].join("\n") + footer;
}

function formatMarketChoice({ query, options, invalidChoice }) {
  const lines = (options ?? []).map((o, i) => {
    const district = o.district ? ` — ${o.district}` : "";
    return `${i + 1}. ${o.name}${district}`;
  });
  const header = invalidChoice
    ? "Please pick one of these numbers:"
    : `I found ${lines.length} markets matching "${query}". Which one?`;
  return [header, ...lines, "Reply with a number, or CANCEL."].join("\n");
}

function formatNearbyMarkets(markets) {
  if (!markets?.length) return "No markets found nearby. Check for another item?";

  const lines = markets.slice(0, 10).map((m) => {
    const tag = m.marketType ? ` [${m.marketType}]` : "";
    return `• ${m.name} — ${m.district}, ${m.region}${tag}`;
  });

  return ["These are the markets near you:", ...lines].join("\n");
}

function formatPendingPayments(payments) {
  if (!payments?.length) return "You have no pending payments.";

  const lines = payments.map((p) => {
    const txn = p.transaction?.transactionId ?? p.paymentId;
    return `• ${txn}: ${fmtMoney(p.amount, p.currency)} via ${p.method}`;
  });

  return ["Pending payments:", ...lines].join("\n");
}

function formatCarriers(carriers) {
  if (!carriers?.length) return "No carriers registered.";

  const lines = carriers.slice(0, 10).map((c) => {
    const veh = c.vehicleModel ? ` (${c.vehicleModel})` : "";
    return `• ${c.name}${veh} — ${c.status}`;
  });
  const footer = carriers.length > 10 ? `\n…and ${carriers.length - 10} more.` : "";

  return ["Carriers available:", ...lines].join("\n") + footer;
}

function formatUserAssets(assets) {
  if (!assets?.length) return "No assets registered.";

  const lines = assets.slice(0, 10).map((a) => {
    const loc = a.market?.name ? ` @ ${a.market.name}` : "";
    return `• ${a.name} [${a.type}]${loc} — ${a.status}`;
  });
  const footer = assets.length > 10 ? `\n…and ${assets.length - 10} more.` : "";

  return ["Your assets:", ...lines].join("\n") + footer;
}

function formatUserStatement(stmt) {
  if (!stmt) return "No statements available yet.";
  return [
    `Statement ${stmt.statementId} — ${stmt.period}`,
    `Opening: ${fmtMoney(stmt.openingBalance, stmt.currency)}`,
    `Income: ${fmtMoney(stmt.totalIncome, stmt.currency)}`,
    `Expenses: ${fmtMoney(stmt.totalExpenses, stmt.currency)}`,
    `Closing: ${fmtMoney(stmt.closingBalance, stmt.currency)}`,
  ].join("\n");
}

function fmtMoney(amount, currency = "UGX") {
  if (amount == null || Number.isNaN(Number(amount))) return `${currency} —`;
  const rounded = Math.round(Number(amount));
  return `${currency} ${rounded.toLocaleString("en-US")}`;
}