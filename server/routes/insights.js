import express from "express";
import { getInsights } from "../services/intelligence.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const insights = await getInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
