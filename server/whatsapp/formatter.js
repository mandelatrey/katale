// Service result → WhatsApp reply.
// Router returns a structured `result`; this turns it into the plain-text
// body the provider will send. Template wording lives in templates.js.

import * as t from "./templates.js";

export function formatReply(result) {
  switch (result.kind) {
    case "help":
      return t.keywordHelp();

    case "unknown":
      return "Sorry, I didn't catch that.\n\n" + t.keywordHelp();

    case "not_implemented":
      if (result.intent === "list_stock") {
        return "Network stock listings are coming soon. Reply *PRICE* for today's market prices.";
      }
      return "This action isn't wired up yet. Reply *HELP* to see what's available.";

    case "session_aborted":
      return "Session cancelled. Reply *HELP* to see what I can do.";

    // ── Onboarding & control ────────────────────────────────────────────────
    case "paused":
      return t.paused();

    case "resumed":
      return t.resumed({ first_name: result.first_name });

    case "less_notifications":
      return "Got it — we'll send fewer updates. Reply *STOP* to pause entirely, *HELP* for everything else.";

    case "more_info":
      return "Reply *PRICE* for prices, *STOCK* for network stock, or *HELP* for the full list.";

    // ── Triggered (sent by the system, formatted the same way) ─────────────
    case "verification_code":
      return t.verificationCode(result);

    case "setup_confirmed":
      return t.setupConfirmed(result);

    case "daily_digest":
      return t.dailyDigest(result);

    case "weekly_summary":
      return t.weeklySummary(result);

    case "weather_warning":
      return t.weatherWarning(result);

    case "order_alert":
      return t.orderAlert(result);

    case "stock_change":
      return t.stockChange(result);

    case "quality_grade":
      return t.qualityGrade(result);

    case "payment_received":
      return t.paymentReceived(result);

    case "transaction_record":
      return t.transactionRecord(result);

    // ── Existing query results ──────────────────────────────────────────────
    case "prompt_commodity":
      return "Which commodity? e.g. maize, beans, coffee.";

    case "prompt_location":
      return 'Share your location, or reply with coordinates as "lat,lng" (e.g. 0.3476,32.5825).';

    case "price_check":
      return formatPrices(result);

    case "prompt_market_choice":
      return formatMarketChoice(result);

    case "nearby_markets":
      return formatNearbyMarkets(result.markets);

    case "list_pending_payments":
      return formatPendingPayments(result.payments);

    case "latest_statement":
      return formatUserStatement(result.statement);

    case "cancel_transaction":
      return `Transaction ${result.transaction?.transactionId ?? ""} cancelled.`.trim();

    case "error":
      return result.message || "Something went wrong. Please try again.";

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

  const top = prices.slice(0, 5).map((p) => {
    const marketName = p.marketInfo?.name ?? "Unknown";
    const district = p.marketInfo?.district ? `, ${p.marketInfo.district}` : "";
    return `• ${marketName}${district}: ${fmtMoney(p.price, p.currency)} / ${p.unit} (${p.priceType})`;
  });
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
  if (!markets?.length) return "No markets found nearby.";
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
  return `${currency} ${Math.round(Number(amount)).toLocaleString("en-US")}`;
}
