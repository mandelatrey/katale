import { api } from "./client.js";

export const login = (phoneE164, password) =>
  api.post("/auth/login", { phoneE164, password });

export const signup = (name, phoneE164) =>
  api.post("/auth/signup", { name, phoneE164 });

export const me = () => api.get("/auth/me");
