// Service result → WhatsApp reply.
//
// Router returns a structured `result`; this file turns it into the
// plain-text body the provider will send. Keeping formatting here (and
// not in the router) means the router stays usable from other surfaces
// — e.g. a future SMS fallback or a CLI simulator.

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
      return formatPrices(result.commodity, result.prices);

    case "nearby_markets":
      return formatMarkets(result.markets);

    case "list_pending_payments":
      return formatPayments(result.payments);

    case "list_my_carriers":
      return formatCarriers(result.carriers);

    case "update_carrier_status":
      return `Carrier ${result.carrier?.name ?? ""} is now ${result.carrier?.status ?? "updated"}.`.trim();

    case "list_my_assets":
      return formatAssets(result.assets);

    case "latest_statement":
      return formatStatement(result.statement);

    case "cancel_transaction":
      return `Transaction ${result.transaction?.transactionId ?? ""} cancelled.`.trim();

    case "error":
      return result.message || "Something went wrong. Please try again.";

    default:
      return "Sorry, I didn't understand that.";
  }
}

function formatPrices(commodity, prices) {
  if (!prices?.length) {
    return `No recent prices found for ${commodity}.`;
  }
  const top = prices.slice(0, 5).map((p) => {
    const market = p.marketInfo?.name ?? "Unknown";
    const district = p.marketInfo?.district ? `, ${p.marketInfo.district}` : "";
    return `• ${market}${district}: ${fmtMoney(p.price, p.currency)} / ${p.unit} (${p.priceType})`;
  });
  const header = `Latest ${commodity} prices:`;
  const footer = prices.length > 5 ? `\n…and ${prices.length - 5} more.` : "";
  return [header, ...top].join("\n") + footer;
}

function formatMarkets(markets) {
  if (!markets?.length) return "No markets found nearby.";
  const lines = markets.slice(0, 10).map((m) => {
    const tag = m.marketType ? ` [${m.marketType}]` : "";
    return `• ${m.name} — ${m.district}, ${m.region}${tag}`;
  });
  return ["Markets near you:", ...lines].join("\n");
}

function formatPayments(payments) {
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
  return ["Your carriers:", ...lines].join("\n") + footer;
}

function formatAssets(assets) {
  if (!assets?.length) return "No assets registered.";
  const lines = assets.slice(0, 10).map((a) => {
    const loc = a.market?.name ? ` @ ${a.market.name}` : "";
    return `• ${a.name} [${a.type}]${loc} — ${a.status}`;
  });
  const footer = assets.length > 10 ? `\n…and ${assets.length - 10} more.` : "";
  return ["Your assets:", ...lines].join("\n") + footer;
}

function formatStatement(stmt) {
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
