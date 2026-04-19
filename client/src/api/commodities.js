import { api } from "./client.js";

export const latestPrices = (params) => api.get("/prices/latest", params);
export const priceHistory = (commodity, params) =>
  api.get(`/prices/history/${encodeURIComponent(commodity)}`, params);
export const marketPrices = (marketId, params) =>
  api.get(`/prices/market/${marketId}`, params);
export const comparePrices = (commodity) =>
  api.get(`/prices/compare/${encodeURIComponent(commodity)}`);
export const transportEstimate = (fromId, toId) =>
  api.get(`/prices/transport/${fromId}/${toId}`);
