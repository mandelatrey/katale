import express from "express";
import { getMarkets, getMarketById, getNearbyMarkets, getMarketsInBounds } from "../services/markets.js";

const router = express.Router();

// Get all markets
router.get("/", async (req, res) => {
  try {
    const markets = await getMarkets(req.query);
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market by ID
router.get("/:id", async (req, res) => {
  try {
    const market = await getMarketById(req.params.id);
    res.json(market);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Find nearest markets
router.get("/nearest/:lng/:lat", async (req, res) => {
  try {
    const { lng, lat } = req.params;
    const markets = await getNearbyMarkets(lng, lat, req.query.maxDistance);
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get markets within bounding box (for map viewport)
router.get("/bounds/:minLng/:maxLng/:minLat/:maxLat", async (req, res) => {
  try {
    const { minLng, maxLng, minLat, maxLat } = req.params;
    const markets = await getMarketsInBounds(minLng, maxLng, minLat, maxLat);
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
