import express from "express";
import { listInsights } from "../services/insights.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listInsights({}, actorFromRequest(req))),
);

export default router;
