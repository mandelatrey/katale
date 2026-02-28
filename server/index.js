import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import marketRoutes from "./routes/markets.js";
import priceRoutes from "./routes/prices.js";
import insightRoutes from "./routes/insights.js";

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";

app.use(cors());
app.use(express.json());

app.use("/api/markets", marketRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/insights", insightRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
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
    console.log("Connected to MongoDB");
    startServer(PORT);
  })
  .catch((err) => console.error("MongoDB connection error:", err));
