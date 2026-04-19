import { api } from "./client.js";

export const listStatements = (params) => api.get("/statements", params);
export const getStatement = (id) => api.get(`/statements/${id}`);
