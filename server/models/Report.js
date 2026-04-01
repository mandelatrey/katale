import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["price_trend", "trade_volume", "market_activity", "regional_summary"],
    required: true,
  },
  period: { type: String }, // e.g. "Q1 2026", "March 2026"
  region: { type: String },
  commodity: { type: String },
  summary: { type: String },
  data: { type: mongoose.Schema.Types.Mixed }, // aggregated JSON payload
  generatedAt: { type: Date, default: Date.now },
});

reportSchema.index({ type: 1, generatedAt: -1 });
reportSchema.index({ region: 1 });

export default mongoose.model("Report", reportSchema);
