import express from "express";
import {
  getTransactions,
  getTransactionStats,
  getTransactionById,
  createTransaction,
  updateTransaction,
} from "../services/transactions.js";

const router = express.Router();

// GET /api/transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await getTransactions(req.query);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await getTransactionStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/:id
router.get("/:id", async (req, res) => {
  try {
    const txn = await getTransactionById(req.params.id);
    res.json(txn);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// POST /api/transactions — create a new transaction
router.post("/", async (req, res) => {
  try {
    const txn = await createTransaction(req.body);
    res.status(201).json(txn);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// PUT /api/transactions/:id — update status, carrier, asset, buyer, seller, notes
router.put("/:id", async (req, res) => {
  try {
    const txn = await updateTransaction(req.params.id, req.body);
    res.json(txn);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
