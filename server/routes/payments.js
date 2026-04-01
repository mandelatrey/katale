import express from "express";
import { getPayments, getPaymentStats, getPaymentById } from "../services/payments.js";

const router = express.Router();

// GET /api/payments
router.get("/", async (req, res) => {
  try {
    const payments = await getPayments(req.query);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await getPaymentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/:id
router.get("/:id", async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    res.json(payment);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
