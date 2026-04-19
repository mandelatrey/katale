import mongoose from "mongoose";
import Price from "../models/Price.js";
import Market from "../models/Market.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import {
  latestPricesSchema,
  priceHistorySchema,
  comparePricesSchema,
  transportSchema,
  marketPricesSchema,
} from "./schemas/commodities.js";

// The "commodity" domain is read-only: prices per market, history, comparisons,
// transport cost estimates. Shared by the web UI (map, dashboard, compare view)
// and the WhatsApp "price check" and "transport quote" intents.

export async function listLatestPrices(params = {}, _actor) {
  const { commodity, marketId } = parse(
    latestPricesSchema,
    params,
    "price filter",
  );
  const match = {};
  if (commodity) match.commodity = commodity;
  if (marketId) match.market = new mongoose.Types.ObjectId(marketId);

  return Price.aggregate([
    { $match: match },
    { $sort: { recordedAt: -1 } },
    { $group: { _id: "$market", price: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$price" } },
    {
      $lookup: {
        from: "markets",
        localField: "market",
        foreignField: "_id",
        as: "marketInfo",
      },
    },
    { $unwind: "$marketInfo" },
  ]);
}

export async function getPriceHistory(params, _actor) {
  const { commodity, days, marketId } = parse(
    priceHistorySchema,
    params,
    "price history filter",
  );
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const match = { commodity, recordedAt: { $gte: startDate } };
  if (marketId) match.market = new mongoose.Types.ObjectId(marketId);

  return Price.aggregate([
    { $match: match },
    { $sort: { recordedAt: 1 } },
    {
      $lookup: {
        from: "markets",
        localField: "market",
        foreignField: "_id",
        as: "market",
      },
    },
    { $unwind: "$market" },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$recordedAt" } },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function getMarketPrices(params, _actor) {
  const { marketId, limit } = parse(
    marketPricesSchema,
    params,
    "market prices filter",
  );
  return Price.aggregate([
    { $match: { market: new mongoose.Types.ObjectId(marketId) } },
    { $sort: { recordedAt: -1 } },
    { $group: { _id: "$commodity", records: { $push: "$$ROOT" } } },
    { $project: { records: { $slice: ["$records", limit] } } },
    { $unwind: "$records" },
    { $replaceRoot: { newRoot: "$records" } },
    { $sort: { commodity: 1, recordedAt: -1 } },
  ]);
}

export async function comparePrices(params, _actor) {
  const { commodity } = parse(
    comparePricesSchema,
    params,
    "compare filter",
  );
  return Price.aggregate([
    {
      $match: {
        commodity,
        recordedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: "$market",
        latestPrice: { $first: "$price" },
        marketInfo: { $first: "$market" },
      },
    },
    {
      $lookup: {
        from: "markets",
        localField: "_id",
        foreignField: "_id",
        as: "marketDetails",
      },
    },
    { $unwind: "$marketDetails" },
    {
      $project: {
        market: "$marketDetails.name",
        district: "$marketDetails.district",
        region: "$marketDetails.region",
        price: "$latestPrice",
      },
    },
    { $sort: { price: 1 } },
  ]);
}

export async function getTransportEstimate(params, _actor) {
  const { fromId, toId } = parse(transportSchema, params, "transport filter");
  const [from, to] = await Promise.all([
    Market.findById(fromId),
    Market.findById(toId),
  ]);
  if (!from || !to) throw notFound("Market not found");

  // Haversine distance (km) between the two market points.
  const R = 6371;
  const dLat =
    ((to.location.coordinates[1] - from.location.coordinates[1]) * Math.PI) /
    180;
  const dLng =
    ((to.location.coordinates[0] - from.location.coordinates[0]) * Math.PI) /
    180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.location.coordinates[1] * Math.PI) / 180) *
      Math.cos((to.location.coordinates[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Cost + travel-time figures match the previous intelligence service.
  const costPerKm = 500; // UGX per km
  const estimatedCost = Math.round(distance * costPerKm);

  return {
    from: { name: from.name, district: from.district },
    to: { name: to.name, district: to.district },
    distance: Math.round(distance),
    estimatedCost,
    travelTime: Math.round(distance / 60),
  };
}
