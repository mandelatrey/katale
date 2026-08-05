import { verifyToken } from "../lib/jwt.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const header = req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).lean();
    if (!user || !user.active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
