import express from "express";
import Insight from "../models/Insight.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const insights = await Insight.find().sort({ createdAt: -1 });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
