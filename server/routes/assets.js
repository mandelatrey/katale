import express from "express";
import {
  listAssets,
  getAssetStats,
  getAssetById,
} from "../services/assets.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listAssets(req.query, actorFromRequest(req))),
);

router.get(
  "/stats",
  handler((req) => getAssetStats({}, actorFromRequest(req))),
);

router.get(
  "/:id",
  handler((req) => getAssetById(req.params, actorFromRequest(req))),
);

export default router;
