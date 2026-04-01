import express from "express";
import { getAssets, getAssetStats, getAssetById } from "../services/fleet.js";

const router = express.Router();

// GET /api/assets — list with optional filters
router.get("/", async (req, res) => {
  try {
    const assets = await getAssets(req.query);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assets/stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await getAssetStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assets/:id
router.get("/:id", async (req, res) => {
  try {
    const asset = await getAssetById(req.params.id);
    res.json(asset);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
