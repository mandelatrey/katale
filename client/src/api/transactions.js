import { api } from "./client.js";

export const listTransactions = (params) => api.get("/transactions", params);
export const getTransactionStats = () => api.get("/transactions/stats");
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (body) => api.post("/transactions", body);
export const updateTransaction = (id, body) =>
  api.put(`/transactions/${id}`, body);
export const deleteTransaction = (id) => api.del(`/transactions/${id}`);
