import express from "express";
import Report from "../models/Report.js";

const router = express.Router();

// GET /api/reports
router.get("/", async (req, res) => {
  try {
    const { type, region, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (region) filter.region = region;
    const reports = await Report.find(filter)
      .select("-data") // omit heavy data field in list
      .sort({ generatedAt: -1 })
      .limit(Number(limit));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/:id — includes full data payload
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
