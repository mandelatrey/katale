import { api } from "./client.js";

export const listCarriers = (params) => api.get("/carriers", params);
export const getCarrierStats = () => api.get("/carriers/stats");
export const getCarrier = (id) => api.get(`/carriers/${id}`);
export const createCarrier = (body) => api.post("/carriers", body);
export const updateCarrier = (id, body) => api.put(`/carriers/${id}`, body);
export const deleteCarrier = (id) => api.del(`/carriers/${id}`);
