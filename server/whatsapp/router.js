import { parseIntent } from "./intents/parse.js";
import { listLatestPrices } from "../services/commodities.js";
import { listMarkets, listNearbyMarkets } from "../services/markets.js";
import { listPayments } from "../services/payments.js";
import { listCarriers, updateCarrier } from "../services/carriers.js";
import { listAssets } from "../services/assets.js";
import { listStatements } from "../services/statements.js";
import { updateTransaction } from "../services/transactions.js";

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

      case "list_my_carriers":
        return await handleListCarriers(actor);

      case "update_carrier_status":
        return await handleUpdateCarrierStatus(
          intent.args ?? {},
          user,
          actor,
        );

      case "list_my_assets":
        return await handleListAssets(actor);

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

async function handleListCarriers(actor) {
  const carriers = await listCarriers({}, actor);
  return { kind: "list_my_carriers", carriers, nextSession: IDLE };
}

async function handleUpdateCarrierStatus(args, user, actor) {
  if (!user?.carrier) {
    return {
      kind: "error",
      message:
        "Your account isn't linked to a carrier vehicle. Ask an admin to link one.",
      nextSession: IDLE,
    };
  }
  if (!args.status) {
    return {
      kind: "prompt_carrier_status",
      nextSession: { state: "awaiting_carrier_status", data: {} },
    };
  }
  const carrier = await updateCarrier(
    { id: user.carrier.toString(), status: args.status },
    actor,
  );
  return { kind: "update_carrier_status", carrier, nextSession: IDLE };
}

async function handleListAssets(actor) {
  const assets = await listAssets({}, actor);
  return { kind: "list_my_assets", assets, nextSession: IDLE };
}

async function handleLatestStatement(actor) {
  const [statement] = await listStatements({ limit: 1 }, actor);
  return { kind: "latest_statement", statement: statement ?? null, nextSession: IDLE };
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