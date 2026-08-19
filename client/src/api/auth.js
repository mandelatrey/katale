import { api } from "./client.js";

export const login = (phoneE164, password) =>
  api.post("/auth/login", { phoneE164, password });

export const signup = (name, phoneE164, messagingConsent) =>
  api.post("/auth/signup", { name, phoneE164, messagingConsent });

export const me = () => api.get("/auth/me");

// Send a WhatsApp OTP to an existing account.
export const verifyStart = (phoneE164) =>
  api.post("/auth/verify/start", { phoneE164 });

// Check an OTP code. For farmer/broker the response also includes { token, user }.
export const verifyCheck = (phoneE164, code) =>
  api.post("/auth/verify/check", { phoneE164, code });
