import express from "express";
import {
  listCarriers,
  getCarrierStats,
  getCarrierById,
  createCarrier,
  updateCarrier,
  deleteCarrier,
} from "../services/carriers.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listCarriers(req.query, actorFromRequest(req))),
);

router.get(
  "/stats",
  handler((req) => getCarrierStats({}, actorFromRequest(req))),
);

router.get(
  "/:id",
  handler((req) => getCarrierById(req.params, actorFromRequest(req))),
);

router.post(
  "/",
  handler(async (req, res) => {
    const carrier = await createCarrier(req.body, actorFromRequest(req));
    res.status(201).json(carrier);
  }),
);

router.put(
  "/:id",
  handler((req) =>
    updateCarrier({ id: req.params.id, ...req.body }, actorFromRequest(req)),
  ),
);

router.delete(
  "/:id",
  handler((req) => deleteCarrier(req.params, actorFromRequest(req))),
);

export default router;
