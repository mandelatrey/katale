import express from "express";
import {
  listCarriers,
  getCarrierStats,
  getCarrierById,
  createCarrier,
  updateCarrier,
  deleteCarrier,
} from "../services/carriers.js";
import {
  listAssets,
  getAssetStats,
  getAssetById,
} from "../services/assets.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

// --- Carriers ---

router.get(
  "/carriers",
  handler((req) => listCarriers(req.query, actorFromRequest(req))),
);
router.get(
  "/carriers/stats",
  handler((req) => getCarrierStats({}, actorFromRequest(req))),
);
router.get(
  "/carriers/:id",
  handler((req) => getCarrierById(req.params, actorFromRequest(req))),
);
router.post(
  "/carriers",
  handler(async (req, res) => {
    const carrier = await createCarrier(req.body, actorFromRequest(req));
    res.status(201).json(carrier);
  }),
);
router.put(
  "/carriers/:id",
  handler((req) =>
    updateCarrier({ id: req.params.id, ...req.body }, actorFromRequest(req)),
  ),
);
router.delete(
  "/carriers/:id",
  handler((req) => deleteCarrier(req.params, actorFromRequest(req))),
);

// --- Assets ---

router.get(
  "/assets",
  handler((req) => listAssets(req.query, actorFromRequest(req))),
);
router.get(
  "/assets/stats",
  handler((req) => getAssetStats({}, actorFromRequest(req))),
);
router.get(
  "/assets/:id",
  handler((req) => getAssetById(req.params, actorFromRequest(req))),
);

export default router;
