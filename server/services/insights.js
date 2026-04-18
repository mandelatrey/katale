import Insight from "../models/Insight.js";

// Insights are short market-research cards surfaced on the dashboard.
// Seeded by seedInsights.js; no mutation surface.

export async function listInsights(_params = {}, _actor) {
  return Insight.find().sort({ createdAt: -1 });
}
