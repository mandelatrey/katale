import { api } from "./client.js";

export const listAssets = (params) => api.get("/assets", params);
export const getAssetStats = () => api.get("/assets/stats");
export const getAsset = (id) => api.get(`/assets/${id}`);
