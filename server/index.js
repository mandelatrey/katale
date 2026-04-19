import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import marketRoutes from "./routes/markets.js";
import priceRoutes from "./routes/prices.js";
import insightRoutes from "./routes/insights.js";
import assetRoutes from "./routes/assets.js";
import transactionRoutes from "./routes/transactions.js";
import paymentRoutes from "./routes/payments.js";
import reportRoutes from "./routes/reports.js";
import statementRoutes from "./routes/statements.js";
import carrierRoutes from "./routes/carriers.js";
import whatsappRoutes from "./whatsapp/index.js";
import fleetRoutes from "./routes/fleet.js";
import intelligenceRoutes from "./routes/intelligence.js";

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";

app.use(cors());
app.use(express.json());

app.use("/api/markets", marketRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/carriers", carrierRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/fleet", fleetRoutes);
app.use("/api/intelligence", intelligenceRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

function startServer(port) {
  if (process.env.VERCEL) {
    // Vercel environment detected — skip internal server listener
    return;
  }

  const server = app.listen(port, () => {
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

mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    startServer(PORT);
  })
  .catch((err) => {
    console.error("CRITICAL: MongoDB connection error:", err.message);
    console.error("The server requires a running MongoDB instance to start.");
    process.exit(1); // Exit with error code to notify concurrently/watchers
  });

export default app;
