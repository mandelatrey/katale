import express from "express";
import {
  listMarkets,
  getMarketById,
  listNearbyMarkets,
  listMarketsInBounds,
} from "../services/markets.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listMarkets(req.query, actorFromRequest(req))),
);

router.get(
  "/nearest/:lng/:lat",
  handler((req) =>
    listNearbyMarkets(
      { ...req.params, maxDistance: req.query.maxDistance },
      actorFromRequest(req),
    ),
  ),
);

router.get(
  "/bounds/:minLng/:maxLng/:minLat/:maxLat",
  handler((req) => listMarketsInBounds(req.params, actorFromRequest(req))),
);

router.get(
  "/:id",
  handler((req) => getMarketById(req.params, actorFromRequest(req))),
);

export default router;
