import { api } from "./client.js";

export const listReports = (params) => api.get("/reports", params);
export const getReport = (id) => api.get(`/reports/${id}`);
