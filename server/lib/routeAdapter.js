import { HttpError } from "./errors.js";

// Wraps an async service call into an Express handler. Normalises errors
// so both REST clients and the WhatsApp webhook get the same shape.
export function handler(fn) {
  return async (req, res) => {
    try {
      const out = await fn(req, res);
      if (res.headersSent) return;
      res.json(out);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({
          error: err.message,
          ...(err.details ? { details: err.details } : {}),
        });
      }
      if (err && err.name === "CastError") {
        return res.status(400).json({ error: "Invalid id" });
      }
      console.error("[route]", err);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  };
}

// Build the `actor` argument the service layer expects.
// Prefers req.user set by requireAuth middleware; falls back to x-actor-id
// header (dev) or anonymous.
export function actorFromRequest(req) {
  if (req.user) {
    return { userId: req.user._id.toString(), role: req.user.role, source: "jwt" };
  }
  const id = req.header("x-actor-id") || null;
  return { userId: id, source: id ? "header" : "anonymous" };
}
