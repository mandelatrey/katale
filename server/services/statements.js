import Statement from "../models/Statement.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import {
  listStatementsSchema,
  statementIdSchema,
} from "./schemas/statements.js";

// Statements are read-only: the UI lists them and the WhatsApp bot will
// summarise the latest one on request. Entries are heavy JSON so the list
// endpoint strips them.

export async function listStatements(params = {}, _actor) {
  const { limit } = parse(listStatementsSchema, params, "statement filter");
  return Statement.find()
    .select("-entries")
    .sort({ startDate: -1 })
    .limit(limit);
}

export async function getStatementById(params, _actor) {
  const { id } = parse(statementIdSchema, params, "statement id");
  const stmt = await Statement.findById(id);
  if (!stmt) throw notFound("Statement not found");
  return stmt;
}
