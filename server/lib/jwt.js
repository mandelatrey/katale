import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const EXPIRY = "7d";

if (!SECRET && process.env.NODE_ENV !== "test") {
  console.warn("[auth] JWT_SECRET not set — using insecure dev fallback");
}

const secret = SECRET || "dev-secret-change-in-prod";

export function signToken(payload) {
  return jwt.sign(
    payload, 
    secret, 
    { expiresIn: EXPIRY }
  );
}

export function verifyToken(token) {
  return jwt.verify(
    token, 
    secret
  );
}
