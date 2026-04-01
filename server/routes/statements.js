import express from "express";
import Statement from "../models/Statement.js";

const router = express.Router();

// GET /api/statements
router.get("/", async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const statements = await Statement.find()
      .select("-entries") // omit entries in list for performance
      .sort({ startDate: -1 })
      .limit(Number(limit));
    res.json(statements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/statements/:id — includes full entries
router.get("/:id", async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id);
    if (!statement) return res.status(404).json({ error: "Statement not found" });
    res.json(statement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
