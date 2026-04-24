/**
 * MCP-callable service functions — importable from plain Node without Express or React context.
 *
 * carriers:
 *   getCarriers(filters)        — list carriers with optional search/category/status filters
 *   getCarrierStats()           — aggregated carrier status/category distribution + total count
 *   getCarrierById(id)          — single carrier by MongoDB ID
 *   createCarrier(data)         — create a new carrier document
 *   updateCarrier(id, data)     — update carrier fields by ID
 *   deleteCarrier(id)           — delete carrier by ID
 *
 * assets:
 *   getAssets(filters)          — list assets with optional type/status/region filters
 *   getAssetStats()             — aggregated asset type/status counts + total value
 *   getAssetById(id)            — single asset by MongoDB ID
 *
 * markets:
 *   getMarkets(filters)         — list markets with optional region/district/marketType filters
 *   getMarketById(id)           — single market by MongoDB ID
 *   getNearbyMarkets(lng, lat, maxDistance) — geospatial nearest-market query
 *   getMarketsInBounds(minLng, maxLng, minLat, maxLat) — markets within bounding box
 *
 * transactions:
 *   getTransactions(filters)    — list transactions with optional commodity/status/type/limit/skip
 *   getTransactionStats()       — aggregated transaction totals (volume, value, pending, delivered)
 *   getTransactionById(id)      — single transaction with populated references
 *   createTransaction(data)     — create transaction with optional auto-linked payment
 *   updateTransaction(id, data) — update allowed transaction fields
 *
 * payments:
 *   getPayments(filters)        — list payments with optional status/method/limit/skip
 *   getPaymentStats()           — aggregated payment totals (collected, pending, completed)
 *   getPaymentById(id)          — single payment with populated transaction
 *
 * commodities:
 *   getLatestPrices(filters)    — latest price per market with optional commodity/marketId filter
 *   getPriceHistory(commodity, options) — time-series price aggregation
 *   getMarketPrices(marketId, options)  — latest N price records per commodity for a market
 *   comparePrices(commodity)    — cross-market price comparison (last 7 days)
 *   getTransportPrice(fromId, toId) — Haversine distance + cost estimate between markets
 *
 * insights:
 *   getInsights()               — all insights sorted by creation date
 *
 * statements:
 *   getStatements(filters)      — list financial statements with optional limit
 *   getStatementById(id)        — single statement by MongoDB ID
 *
 * reports:
 *   getReports(filters)         — list market reports with optional type/region/limit filters
 *   getReportById(id)           — single report by MongoDB ID
 */

export {
  listCarriers as getCarriers,
  getCarrierStats,
  getCarrierById,
  createCarrier,
  updateCarrier,
  deleteCarrier,
} from "./services/carriers.js";

export {
  listAssets as getAssets,
  getAssetStats,
  getAssetById,
} from "./services/assets.js";

export {
  listMarkets as getMarkets,
  getMarketById,
  listNearbyMarkets as getNearbyMarkets,
  listMarketsInBounds as getMarketsInBounds,
} from "./services/markets.js";

export {
  listTransactions as getTransactions,
  getTransactionStats,
  getTransactionById,
  createTransaction,
  updateTransaction,
} from "./services/transactions.js";

export {
  listPayments as getPayments,
  getPaymentStats,
  getPaymentById,
} from "./services/payments.js";

export {
  listLatestPrices as getLatestPrices,
  getPriceHistory,
  getMarketPrices,
  comparePrices,
  getTransportEstimate as getTransportPrice,
} from "./services/commodities.js";

export {
  listInsights as getInsights,
} from "./services/insights.js";

export {
  listStatements as getStatements,
  getStatementById,
} from "./services/statements.js";

export {
  listReports as getReports,
  getReportById,
} from "./services/reports.js";
