import { api } from "./client.js";

export const listInsights = () => api.get("/insights");
