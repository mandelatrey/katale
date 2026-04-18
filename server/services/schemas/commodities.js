import { z } from "zod";
import { objectId } from "./common.js";

// Commodities are surfaced through the Price model today — there is no
// separate Commodity collection. These schemas cover the read surface used
// by the map, dashboard, and the WhatsApp "check price" intent.

export const latestPricesSchema = z.object({
  commodity: z.string().trim().min(1).optional(),
  marketId: objectId.optional(),
});

export const priceHistorySchema = z.object({
  commodity: z.string().trim().min(1),
  days: z.coerce.number().int().positive().max(365).default(30),
  marketId: objectId.optional(),
});

export const comparePricesSchema = z.object({
  commodity: z.string().trim().min(1),
});

export const transportSchema = z.object({
  fromId: objectId,
  toId: objectId,
});

export const marketPricesSchema = z.object({
  marketId: objectId,
  limit: z.coerce.number().int().positive().max(200).default(30),
});
