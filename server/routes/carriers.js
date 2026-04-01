import express from "express";
import {
  getCarriers,
  getCarrierStats,
  getCarrierById,
  createCarrier,
  updateCarrier,
  deleteCarrier,
} from "../services/fleet.js";

const router = express.Router();

// GET /api/carriers — list with optional filters
router.get("/", async (req, res) => {
  try {
    const carriers = await getCarriers(req.query);
    res.json(carriers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/carriers/stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await getCarrierStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/carriers/:id
router.get("/:id", async (req, res) => {
  try {
    const carrier = await getCarrierById(req.params.id);
    res.json(carrier);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/carriers
router.post("/", async (req, res) => {
  try {
    const carrier = await createCarrier(req.body);
    res.status(201).json(carrier);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// PUT /api/carriers/:id
router.put("/:id", async (req, res) => {
  try {
    const carrier = await updateCarrier(req.params.id, req.body);
    res.json(carrier);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// DELETE /api/carriers/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteCarrier(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
