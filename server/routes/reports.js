import express from "express";
import { listReports, getReportById } from "../services/reports.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listReports(req.query, actorFromRequest(req))),
);

router.get(
  "/:id",
  handler((req) => getReportById(req.params, actorFromRequest(req))),
);

export default router;
