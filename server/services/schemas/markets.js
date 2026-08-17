import { z } from "zod";
import { objectId } from "./common.js";

export const listMarketsSchema = z.object({
  name: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).optional(),
  marketType: z.enum(["wholesale", "retail", "collection"]).optional(),
});

export const nearbyMarketsSchema = z.object({
  lng: z.coerce.number().gte(-180).lte(180),
  lat: z.coerce.number().gte(-90).lte(90),
  maxDistance: z.coerce.number().positive().max(500000).default(50000),
});

export const boundsMarketsSchema = z.object({
  minLng: z.coerce.number().gte(-180).lte(180),
  maxLng: z.coerce.number().gte(-180).lte(180),
  minLat: z.coerce.number().gte(-90).lte(90),
  maxLat: z.coerce.number().gte(-90).lte(90),
});

export const marketIdSchema = z.object({ id: objectId });
