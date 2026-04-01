import express from "express";
import {
  getCarriers,
  getCarrierStats,
  getCarrierById,
  createCarrier,
  updateCarrier,
  deleteCarrier,
  getAssets,
  getAssetStats,
  getAssetById,
} from "../services/fleet.js";

const router = express.Router();

// --- Carriers ---

router.get("/carriers", async (req, res) => {
  try {
    const carriers = await getCarriers(req.query);
    res.json(carriers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/carriers/stats", async (req, res) => {
  try {
    const stats = await getCarrierStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/carriers/:id", async (req, res) => {
  try {
    const carrier = await getCarrierById(req.params.id);
    res.json(carrier);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post("/carriers", async (req, res) => {
  try {
    const carrier = await createCarrier(req.body);
    res.status(201).json(carrier);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.put("/carriers/:id", async (req, res) => {
  try {
    const carrier = await updateCarrier(req.params.id, req.body);
    res.json(carrier);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.delete("/carriers/:id", async (req, res) => {
  try {
    const result = await deleteCarrier(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// --- Assets ---

router.get("/assets", async (req, res) => {
  try {
    const assets = await getAssets(req.query);
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/assets/stats", async (req, res) => {
  try {
    const stats = await getAssetStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/assets/:id", async (req, res) => {
  try {
    const asset = await getAssetById(req.params.id);
    res.json(asset);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
