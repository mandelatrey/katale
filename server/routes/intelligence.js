import express from "express";
import { listInsights } from "../services/insights.js";
import {
  listLatestPrices,
  getPriceHistory,
  comparePrices,
  getTransportEstimate,
} from "../services/commodities.js";
import { listMarkets, listNearbyMarkets } from "../services/markets.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

// --- Markets ---

router.get(
  "/markets",
  handler((req) => listMarkets(req.query, actorFromRequest(req))),
);

router.get(
  "/markets/nearby",
  handler((req) => listNearbyMarkets(req.query, actorFromRequest(req))),
);

// --- Prices ---

router.get(
  "/prices/latest",
  handler((req) => listLatestPrices(req.query, actorFromRequest(req))),
);

router.get(
  "/prices/history/:commodity",
  handler((req) =>
    getPriceHistory(
      { commodity: req.params.commodity, ...req.query },
      actorFromRequest(req),
    ),
  ),
);

router.get(
  "/prices/compare/:commodity",
  handler((req) =>
    comparePrices({ commodity: req.params.commodity }, actorFromRequest(req)),
  ),
);

router.get(
  "/prices/transport/:fromId/:toId",
  handler((req) => getTransportEstimate(req.params, actorFromRequest(req))),
);

// --- Insights ---

router.get(
  "/insights",
  handler((req) => listInsights({}, actorFromRequest(req))),
);

export default router;
