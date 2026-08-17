// Lightweight fetch wrapper for the Agribridge REST API.
// Kept intentionally minimal — no query client, no caching, just a single
// chokepoint so every request goes through the same error normalisation.
// The WhatsApp webhook (server/whatsapp) does not use this file; it calls
// the service layer directly.

const BASE_URL = "/api";

function buildQuery(params) {
  if (!params) return "";
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : "";
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function getToken() {
  return localStorage.getItem("agribridge_token");
}

async function request(path, { method = "GET", body, params } = {}) {
  const url = `${BASE_URL}${path}${buildQuery(params)}`;
  const token = getToken();
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // empty body
  }
  if (!res.ok) {
    const msg = payload?.error || `Request failed: ${res.status}`;
    throw new ApiError(res.status, msg, payload?.details);
  }
  return payload;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};
