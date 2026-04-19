import { api } from "./client.js";

export const listMarkets = (params) => api.get("/markets", params);
export const getMarket = (id) => api.get(`/markets/${id}`);
export const listNearbyMarkets = (lng, lat, maxDistance = 50000) =>
  api.get(`/markets/nearest/${lng}/${lat}`, { maxDistance });
