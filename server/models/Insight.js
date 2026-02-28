import mongoose from "mongoose";

const insightSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String }, // e.g., "USD 2,450"
  summary: { type: String, required: true },
  source: { type: String, default: "Euromonitor" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Insight", insightSchema);
