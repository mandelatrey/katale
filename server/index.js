import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import marketRoutes from "./routes/markets.js";
import priceRoutes from "./routes/prices.js";
import insightRoutes from "./routes/insights.js";
import transactionRoutes from "./routes/transactions.js";
import paymentRoutes from "./routes/payments.js";
import reportRoutes from "./routes/reports.js";
import statementRoutes from "./routes/statements.js";
import whatsappRoutes from "./whatsapp/index.js";
import intelligenceRoutes from "./routes/intelligence.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio form-encoded webhooks

// Serverless cold starts hit /api/* before mongoose has finished connecting,
// which causes mongoose to buffer the query and eventually time out (~10s).
// On Vercel, containers are frozen between invocations and Atlas closes idle
// sockets — so a memoized "connected" promise can outlive the underlying TCP
// connection. Check readyState on every call and reconnect when it's stale.
let mongoReady = null;
function ensureDb() {
  const state = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting. Anything else means we must (re)connect.
  if (state === 1) return Promise.resolve(mongoose.connection);
  if (state === 2 && mongoReady) return mongoReady;

  mongoReady = mongoose
    .connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    })
    .then(() => {
      console.log(
        "[mongo] MongoDB connected to",
        MONGODB_URI.replace(/\/\/.*@/, "//***@"),
      );
      return mongoose.connection;
    })
    .catch((err) => {
      mongoReady = null; // let the next request retry
      throw err;
    });
  return mongoReady;
}

app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error("[mongo] connect failed:", err.message);
    res.status(503).json({ error: "Database temporarily unavailable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/intelligence", intelligenceRoutes);

app.get("/api/health", (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    db: dbState[mongoose.connection.readyState] ?? "unknown",
    timestamp: new Date(),
  });
});

function startServer(port) {
  if (process.env.VERCEL) {
    // Vercel environment detected — skip internal server listener
    return;
  }

  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Try: kill $(lsof -t -i:${port})`,
      );
      process.exit(1);
    }
    throw err;
  });
}

// Start the HTTP server immediately — it does not need MongoDB to accept
// requests. DB-dependent routes await ensureDb() via middleware.
startServer(PORT);

// Warm the connection at boot so the first request doesn't pay the full
// cost. Failures are surfaced per-request by the middleware above.
ensureDb().catch((err) => {
  console.error("[mongo] warmup failed:", err.message);
});

mongoose.connection.on("connected", () =>
  console.log("[mongo] MongoDB reconnected"),
);
mongoose.connection.on("disconnected", () => {
  console.warn("[mongo] MongoDB disconnected — waiting for reconnection");
  mongoReady = null; // force ensureDb() to reconnect on the next request
});

export default app;
