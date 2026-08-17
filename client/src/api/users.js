import { api } from "./client.js";

export const listUsers = (params) => api.get("/users", params);
export const createUser = (body) => api.post("/users", body);
export const updateUser = (id, body) => api.put(`/users/${id}`, body);
export const deleteUser = (id) => api.del(`/users/${id}`);
