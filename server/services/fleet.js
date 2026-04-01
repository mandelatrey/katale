import Carrier from "../models/Carrier.js";
import Asset from "../models/Asset.js";

// --- Carrier functions ---

export async function getCarriers({ search, category, status } = {}) {
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };
  return Carrier.find(filter).sort({ category: 1, name: 1 });
}

export async function getCarrierStats() {
  const [byStatus, byCategory, total] = await Promise.all([
    Carrier.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Carrier.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Carrier.countDocuments(),
  ]);
  return { total, byStatus, byCategory };
}

export async function getCarrierById(id) {
  const carrier = await Carrier.findById(id);
  if (!carrier) throw Object.assign(new Error("Carrier not found"), { status: 404 });
  return carrier;
}

export async function createCarrier(data) {
  const carrier = new Carrier(data);
  await carrier.save();
  return carrier;
}

export async function updateCarrier(id, data) {
  const carrier = await Carrier.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!carrier) throw Object.assign(new Error("Carrier not found"), { status: 404 });
  return carrier;
}

export async function deleteCarrier(id) {
  const carrier = await Carrier.findByIdAndDelete(id);
  if (!carrier) throw Object.assign(new Error("Carrier not found"), { status: 404 });
  return { message: "Carrier deleted" };
}

// --- Asset functions ---

export async function getAssets({ type, status, region } = {}) {
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (region) filter.region = region;
  return Asset.find(filter).populate("market", "name district").sort({ acquiredAt: -1 });
}

export async function getAssetStats() {
  const [counts, totalValue] = await Promise.all([
    Asset.aggregate([{ $group: { _id: { type: "$type", status: "$status" }, count: { $sum: 1 } } }]),
    Asset.aggregate([{ $group: { _id: null, total: { $sum: "$value" } } }]),
  ]);
  return { counts, totalValue: totalValue[0]?.total || 0 };
}

export async function getAssetById(id) {
  const asset = await Asset.findById(id).populate("market", "name district region");
  if (!asset) throw Object.assign(new Error("Asset not found"), { status: 404 });
  return asset;
}
