import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["vehicle", "warehouse", "equipment"], required: true },
  status: { type: String, enum: ["active", "maintenance", "idle", "decommissioned"], default: "active" },
  market: { type: mongoose.Schema.Types.ObjectId, ref: "Market" },
  region: { type: String },
  assignedTo: { type: String },
  capacity: { type: Number }, // kg for vehicles/equipment, metric tons for warehouses
  value: { type: Number }, // UGX
  acquiredAt: { type: Date },
  notes: { type: String },
});

assetSchema.index({ type: 1, status: 1 });
assetSchema.index({ market: 1 });

export default mongoose.model("Asset", assetSchema);
