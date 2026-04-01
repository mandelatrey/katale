import mongoose from "mongoose";
import Insight from "../models/Insight.js";
import Price from "../models/Price.js";
import Market from "../models/Market.js";

// --- Insights ---

export async function getInsights() {
  return Insight.find().sort({ createdAt: -1 });
}

// --- Prices ---

export async function getLatestPrices({ commodity, marketId } = {}) {
  const match = {};
  if (commodity) match.commodity = commodity;
  if (marketId) match.market = marketId;

  return Price.aggregate([
    { $match: match },
    { $sort: { recordedAt: -1 } },
    { $group: { _id: "$market", price: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$price" } },
    { $lookup: { from: "markets", localField: "market", foreignField: "_id", as: "marketInfo" } },
    { $unwind: "$marketInfo" },
  ]);
}

export async function getPriceHistory(commodity, { days = 30, marketId } = {}) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const match = { commodity, recordedAt: { $gte: startDate } };
  if (marketId) match.market = new mongoose.Types.ObjectId(marketId);

  return Price.aggregate([
    { $match: match },
    { $sort: { recordedAt: 1 } },
    { $lookup: { from: "markets", localField: "market", foreignField: "_id", as: "market" } },
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

export async function getMarketPrices(marketId, { limit = 30 } = {}) {
  return Price.aggregate([
    { $match: { market: new mongoose.Types.ObjectId(marketId) } },
    { $sort: { recordedAt: -1 } },
    { $group: { _id: "$commodity", records: { $push: "$$ROOT" } } },
    { $project: { records: { $slice: ["$records", Number(limit)] } } },
    { $unwind: "$records" },
    { $replaceRoot: { newRoot: "$records" } },
    { $sort: { commodity: 1, recordedAt: -1 } },
  ]);
}

export async function comparePrices(commodity) {
  return Price.aggregate([
    { $match: { commodity, recordedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: "$market",
        latestPrice: { $first: "$price" },
        marketInfo: { $first: "$market" },
      },
    },
    { $lookup: { from: "markets", localField: "_id", foreignField: "_id", as: "marketDetails" } },
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

export async function getTransportPrice(fromId, toId) {
  const [from, to] = await Promise.all([
    Market.findById(fromId),
    Market.findById(toId),
  ]);

  if (!from || !to) throw Object.assign(new Error("Market not found"), { status: 404 });

  // Haversine formula for distance
  const R = 6371; // Earth's radius in km
  const dLat = (to.location.coordinates[1] - from.location.coordinates[1]) * Math.PI / 180;
  const dLng = (to.location.coordinates[0] - from.location.coordinates[0]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.location.coordinates[1] * Math.PI / 180) *
      Math.cos(to.location.coordinates[1] * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Transport cost estimate (rough calculation)
  const costPerKm = 500; // UGX per km
  const estimatedCost = Math.round(distance * costPerKm);

  return {
    from: { name: from.name, district: from.district },
    to: { name: to.name, district: to.district },
    distance: Math.round(distance),
    estimatedCost,
    travelTime: Math.round(distance / 60), // Assuming 60km/h average
  };
}
