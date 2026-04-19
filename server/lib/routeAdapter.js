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
// Today there is no auth middleware, so we accept an `x-actor-id` header
// for development and the WhatsApp webhook will supply a real user id later.
export function actorFromRequest(req) {
  const id = req.header("x-actor-id") || null;
  return { userId: id, source: id ? "header" : "anonymous" };
}
