import { z } from "zod";
import { objectId } from "./common.js";

const typeEnum = z.enum([
  "price_trend",
  "trade_volume",
  "market_activity",
  "regional_summary",
]);

export const listReportsSchema = z.object({
  type: typeEnum.optional(),
  region: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(200).default(20),
});

export const reportIdSchema = z.object({ id: objectId });
