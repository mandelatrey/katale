import express from "express";
import {
  listStatements,
  getStatementById,
} from "../services/statements.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listStatements(req.query, actorFromRequest(req))),
);

router.get(
  "/:id",
  handler((req) => getStatementById(req.params, actorFromRequest(req))),
);

export default router;
