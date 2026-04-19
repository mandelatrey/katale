import { api } from "./client.js";

export const listPayments = (params) => api.get("/payments", params);
export const getPaymentStats = () => api.get("/payments/stats");
export const getPayment = (id) => api.get(`/payments/${id}`);
