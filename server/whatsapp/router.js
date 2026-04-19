// Intent → action router.
//
// Each intent maps to one or more calls into server/services/*. The
// router never touches the DB directly — that's the service layer's
// job. It returns a structured `result` that formatter.js turns into
// a WhatsApp reply.

import { parseIntent } from "./intents/parse.js";
import { listLatestPrices } from "../services/commodities.js";
import { listNearbyMarkets } from "../services/markets.js";
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
  const prices = await listLatestPrices({ commodity: args.commodity }, actor);
  return {
    kind: "price_check",
    commodity: args.commodity,
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
