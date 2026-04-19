import express from "express";
import {
  listTransactions,
  getTransactionStats,
  getTransactionById,
  createTransaction,
  updateTransaction,
} from "../services/transactions.js";
import { handler, actorFromRequest } from "../lib/routeAdapter.js";

const router = express.Router();

router.get(
  "/",
  handler((req) => listTransactions(req.query, actorFromRequest(req))),
);

router.get(
  "/stats",
  handler((req) => getTransactionStats({}, actorFromRequest(req))),
);

router.get(
  "/:id",
  handler((req) => getTransactionById(req.params, actorFromRequest(req))),
);

router.post(
  "/",
  handler(async (req, res) => {
    const txn = await createTransaction(req.body, actorFromRequest(req));
    res.status(201).json(txn);
  }),
);

router.put(
  "/:id",
  handler((req) =>
    updateTransaction(
      { id: req.params.id, ...req.body },
      actorFromRequest(req),
    ),
  ),
);

export default router;
