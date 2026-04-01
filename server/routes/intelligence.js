import express from "express";
import {
  getInsights,
  getLatestPrices,
  getPriceHistory,
  comparePrices,
  getTransportPrice,
} from "../services/intelligence.js";
import { getMarkets, getNearbyMarkets } from "../services/markets.js";

const router = express.Router();

// --- Markets ---

router.get("/markets", async (req, res) => {
  try {
    const markets = await getMarkets(req.query);
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/markets/nearby", async (req, res) => {
  try {
    const { lng, lat, maxDistance } = req.query;
    const markets = await getNearbyMarkets(lng, lat, maxDistance);
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Prices ---

router.get("/prices/latest", async (req, res) => {
  try {
    const prices = await getLatestPrices(req.query);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/prices/history/:commodity", async (req, res) => {
  try {
    const prices = await getPriceHistory(req.params.commodity, req.query);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/prices/compare/:commodity", async (req, res) => {
  try {
    const prices = await comparePrices(req.params.commodity);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/prices/transport/:fromId/:toId", async (req, res) => {
  try {
    const result = await getTransportPrice(req.params.fromId, req.params.toId);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// --- Insights ---

router.get("/insights", async (req, res) => {
  try {
    const insights = await getInsights();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
