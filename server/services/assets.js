import Asset from "../models/Asset.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import { listAssetsSchema, assetIdSchema } from "./schemas/assets.js";

export async function listAssets(params = {}, _actor) {
  const { type, status, region } = parse(
    listAssetsSchema,
    params,
    "asset filter",
  );
  
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (region) filter.region = region;
  return Asset.find(filter)
    .populate("market", "name district")
    .sort({ acquiredAt: -1 });
}

export async function getAssetStats(_params = {}, _actor) {
  const [counts, totalValue] = await Promise.all([
    Asset.aggregate([
      { $group: { _id: { type: "$type", status: "$status" }, count: { $sum: 1 } } },
    ]),
    Asset.aggregate([{ $group: { _id: null, total: { $sum: "$value" } } }]),
  ]);
  return { counts, totalValue: totalValue[0]?.total || 0 };
}

export async function getAssetById(params, _actor) {
  const { id } = parse(assetIdSchema, params, "asset id");
  const asset = await Asset.findById(id).populate(
    "market",
    "name district region",
  );
  if (!asset) throw notFound("Asset not found");
  return asset;
}
