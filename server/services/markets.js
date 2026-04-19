import Market from "../models/Market.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import {
  listMarketsSchema,
  nearbyMarketsSchema,
  boundsMarketsSchema,
  marketIdSchema,
} from "./schemas/markets.js";

// Markets are read-only today. The WhatsApp "find markets near me" intent
// will call listNearbyMarkets with a phone-resolved GPS coordinate.

export async function listMarkets(params = {}, _actor) {
  const filter = parse(listMarketsSchema, params, "market filter");
  return Market.find(filter);
}

export async function getMarketById(params, _actor) {
  const { id } = parse(marketIdSchema, params, "market id");
  const market = await Market.findById(id);
  if (!market) throw notFound("Market not found");
  return market;
}

export async function listNearbyMarkets(params, _actor) {
  const { lng, lat, maxDistance } = parse(
    nearbyMarketsSchema,
    params,
    "nearby filter",
  );
  return Market.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: maxDistance,
      },
    },
  }).limit(10);
}

export async function listMarketsInBounds(params, _actor) {
  const { minLng, maxLng, minLat, maxLat } = parse(
    boundsMarketsSchema,
    params,
    "bounds filter",
  );
  return Market.find({
    location: {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
      },
    },
  });
}
