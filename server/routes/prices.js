import express from "express";
import {
  listLatestPrices,
  getPriceHistory,
  getMarketPrices,
  comparePrices,
  getTransportEstimate,
} from "../services/commodities.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/latest",
  handler((req) => listLatestPrices(req.query, actorFromRequest(req))),
);

router.get(
  "/history/:commodity",
  handler((req) =>
    getPriceHistory(
      { commodity: req.params.commodity, ...req.query },
      actorFromRequest(req),
    ),
  ),
);

router.get(
  "/market/:marketId",
  handler((req) =>
    getMarketPrices(
      { marketId: req.params.marketId, ...req.query },
      actorFromRequest(req),
    ),
  ),
);

router.get(
  "/compare/:commodity",
  handler((req) =>
    comparePrices({ commodity: req.params.commodity }, actorFromRequest(req)),
  ),
);

router.get(
  "/transport/:fromId/:toId",
  handler((req) => getTransportEstimate(req.params, actorFromRequest(req))),
);

export default router;
