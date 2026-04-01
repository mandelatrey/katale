import express from "express";
import {
  getLatestPrices,
  getPriceHistory,
  getMarketPrices,
  comparePrices,
  getTransportPrice,
} from "../services/intelligence.js";

const router = express.Router();

// Get latest prices for all markets
router.get("/latest", async (req, res) => {
  try {
    const prices = await getLatestPrices(req.query);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get price history for a commodity
router.get("/history/:commodity", async (req, res) => {
  try {
    const prices = await getPriceHistory(req.params.commodity, req.query);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prices for a specific market
router.get("/market/:marketId", async (req, res) => {
  try {
    const prices = await getMarketPrices(req.params.marketId, req.query);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare prices across markets for a commodity
router.get("/compare/:commodity", async (req, res) => {
  try {
    const prices = await comparePrices(req.params.commodity);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transport estimate between two markets
router.get("/transport/:fromId/:toId", async (req, res) => {
  try {
    const result = await getTransportPrice(req.params.fromId, req.params.toId);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
