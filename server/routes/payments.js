import express from "express";
import {
  listPayments,
  getPaymentStats,
  getPaymentById,
} from "../services/payments.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listPayments(req.query, actorFromRequest(req))),
);

router.get(
  "/stats",
  handler((req) => getPaymentStats({}, actorFromRequest(req))),
);

router.get(
  "/:id",
  handler((req) => getPaymentById(req.params, actorFromRequest(req))),
);

export default router;
