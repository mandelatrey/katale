import { parseIntent } from "./intents/parse.js";
import { listLatestPrices } from "../services/commodities.js";
import { listMarkets, listNearbyMarkets } from "../services/markets.js";
import { listPayments } from "../services/payments.js";
import { listStatements } from "../services/statements.js";
import { updateTransaction } from "../services/transactions.js";
import User from "../models/User.js";

const IDLE = { state: "idle", data: {} };

/**
 * @param {{
 *   message: { fromPhoneE164: string, text: string, mediaUrls?: string[] },
 *   user: import("mongoose").Document | null,
 *   session: { state: string, data: any } | null,
 *   actor: { userId: string | null, source: "whatsapp" }
 * }} ctx
 */
export async function route(ctx) {
  const intent = parseIntent(ctx.message.text, ctx.session);

  const { actor, user } = ctx;

  try {
    switch (intent.kind) {
      case "help":
        return { kind: "help", nextSession: IDLE };

      case "price_check":
        return await handlePriceCheck(intent.args ?? {}, actor);

      case "choose_price_market":
        return await handleChoosePriceMarket(
          intent.args ?? {},
          ctx.session,
          actor,
        );

      case "nearby_markets":
        return await handleNearbyMarkets(intent.args ?? {}, actor);

      case "list_pending_payments":
        return await handlePendingPayments(actor);

      case "latest_statement":
        return await handleLatestStatement(actor);

      case "cancel_transaction":
        return await handleCancelTransaction(intent.args ?? {}, actor);

      case "create_transaction":
        // Multi-step form not wired yet — tell the user and bail.
        return {
          kind: "not_implemented",
          intent: intent.kind,
          nextSession: IDLE,
        };
      case "abort_session":
        return { kind: "session_aborted", nextSession: IDLE };

      case "opt_out":
        return await handleOptOut(user, actor);

      case "opt_in":
        return await handleOptIn(user, actor);

      case "less_notifications":
        return { kind: "less_notifications", nextSession: IDLE };

      case "more_info":
        return { kind: "more_info", nextSession: IDLE };

      case "list_stock":
        return { kind: "not_implemented", intent: "list_stock", nextSession: IDLE };

      case "confirm_yes":
      case "confirm_no":
      case "request_call":
        // These are session-contextual — fall through to unknown for now
        // until the triggering flows (order alerts, stock changes) are wired.
        return { kind: "unknown", nextSession: IDLE };

      case "unknown":
      default:
        return {
          kind: "unknown",
          nextSession: ctx.session ?? IDLE,
        };
    }
  } catch (err) {
    return {
      kind: "error",
      message: err.message || "Something went wrong.",
      nextSession: IDLE,
    };
  }
}

async function handlePriceCheck(args, actor) {
  if (!args.commodity) {
    return {
      kind: "prompt_commodity",
      nextSession: { state: "awaiting_price_commodity", data: {} },
    };
  }

  // No market mentioned → prices across all markets (previous behaviour).
  if (!args.market) {
    const prices = await listLatestPrices({ commodity: args.commodity }, actor);
    return {
      kind: "price_check",
      commodity: args.commodity,
      prices,
      nextSession: IDLE,
    };
  }

  // Resolve the market name against the DB.
  const matches = (await listMarkets({ name: args.market }, actor)) ?? [];

  if (matches.length === 0) {
    // Unknown market: don't dead-end the user — show all-market prices
    // and say we couldn't find the one they named.
    const prices = await listLatestPrices({ commodity: args.commodity }, actor);
    return {
      kind: "price_check",
      commodity: args.commodity,
      marketNotFound: args.market,
      prices,
      nextSession: IDLE,
    };
  }

  if (matches.length > 1) {
    const options = matches.slice(0, 5).map((m) => ({
      id: m._id.toString(),
      name: m.name,
      district: m.district,
    }));
    return {
      kind: "prompt_market_choice",
      query: args.market,
      options,
      nextSession: {
        state: "awaiting_price_market_choice",
        data: { commodity: args.commodity, options },
      },
    };
  }

  const market = matches[0];
  const prices = await listLatestPrices(
    { commodity: args.commodity, marketId: market._id.toString() },
    actor,
  );
  return {
    kind: "price_check",
    commodity: args.commodity,
    market: market.name,
    prices,
    nextSession: IDLE,
  };
}

// The user replied with a number after prompt_market_choice.
async function handleChoosePriceMarket(args, session, actor) {
  const data = session?.data ?? {};
  const options = Array.isArray(data.options) ? data.options : [];
  const pick = options[args.index];

  if (!pick || !data.commodity) {
    if (!options.length || !data.commodity) {
      // Session was lost or malformed — start over cleanly.
      return { kind: "unknown", nextSession: IDLE };
    }
    // Number out of range — re-show the list, keep the session alive.
    return {
      kind: "prompt_market_choice",
      query: data.commodity,
      options,
      invalidChoice: true,
      nextSession: session,
    };
  }

  const prices = await listLatestPrices(
    { commodity: data.commodity, marketId: pick.id },
    actor,
  );
  return {
    kind: "price_check",
    commodity: data.commodity,
    market: pick.name,
    prices,
    nextSession: IDLE,
  };
}

async function handleNearbyMarkets(args, actor) {
  if (args.lat == null || args.lng == null) {
    return {
      kind: "prompt_location",
      nextSession: { state: "awaiting_nearby_location", data: {} },
    };
  }
  const markets = await listNearbyMarkets(
    { lat: args.lat, lng: args.lng, maxDistance: 50000 },
    actor,
  );
  return { kind: "nearby_markets", markets, nextSession: IDLE };
}

async function handlePendingPayments(actor) {
  const payments = await listPayments({ status: "pending", limit: 5 }, actor);
  return { kind: "list_pending_payments", payments, nextSession: IDLE };
}

async function handleLatestStatement(actor) {
  const [statement] = await listStatements({ limit: 1 }, actor);
  return { kind: "latest_statement", statement: statement ?? null, nextSession: IDLE };
}

async function handleOptOut(user, _actor) {
  if (user) {
    await User.findByIdAndUpdate(user._id, { active: false });
  }
  return { kind: "paused", nextSession: IDLE };
}

async function handleOptIn(user, _actor) {
  if (user) {
    await User.findByIdAndUpdate(user._id, { active: true });
  }
  const first_name = user?.name?.split(" ")[0] ?? null;
  return { kind: "resumed", first_name, nextSession: IDLE };
}

async function handleCancelTransaction(args, actor) {
  const ref = args.ref;
  // updateTransaction expects a Mongo ObjectId. TXN-XXXXX codes would
  // need a service-layer lookup we haven't written yet, so accept the
  // raw id for now and let the service reject anything else.
  if (!ref || /^TXN-/i.test(ref)) {
    return {
      kind: "error",
      message:
        "Tell me which transaction to cancel using its 24-character id.",
      nextSession: IDLE,
    };
  }
  const txn = await updateTransaction({ id: ref, status: "cancelled" }, actor);
  return { kind: "cancel_transaction", transaction: txn, nextSession: IDLE };
}
