import Statement from "../models/Statement.js";
import Payment from "../models/Payment.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import {
  listStatementsSchema,
  statementIdSchema,
} from "./schemas/statements.js";

// Statements are read-only from the UI/WhatsApp side (list + summarise the
// latest). They are now GENERATED from completed Payment records rather than
// seeded by hand. Entries are heavy so the list endpoint strips them.

// Business rule: from the platform owner's perspective a `sell` transaction is
// income (money in) and a `buy` is an expense (money out). Flip this one line
// if your accounting is the other way around.
const isIncomeTxn = (txn) => txn?.type === "sell";

/* ------------------------------------------------------------------ */
/* Read surface (unchanged public behaviour)                          */
/* ------------------------------------------------------------------ */

export async function listStatements(params = {}, _actor) {
  const { limit } = parse(listStatementsSchema, params, "statement filter");
  return Statement.find()
    .select("-entries")
    .sort({ startDate: -1 })
    .limit(limit);
}

export async function getStatementById(params, _actor) {
  const { id } = parse(statementIdSchema, params, "statement id");
  const stmt = await Statement.findById(id).populate(
    "entries.transaction",
    "transactionId commodity type",
  );
  if (!stmt) throw notFound("Statement not found");
  return stmt;
}

/**
 * Cross-statement trend for dashboard cards. Cheap because it selects only
 * headline numbers and skips the entries array entirely.
 */
export async function getStatementTrend(months = 6) {
  return Statement.find({ month: { $exists: true } })
    .sort({ year: -1, month: -1 })
    .limit(months)
    .select("year month totalIncome totalExpenses closingBalance summary.netChange")
    .lean();
}

/* ------------------------------------------------------------------ */
/* Generation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Build (or rebuild) a statement for a given period from completed payments.
 * Idempotent: re-running for the same period refreshes it in place rather than
 * creating a duplicate. Opening balance chains from the prior statement's
 * closing balance so the ledger stays continuous across periods.
 *
 * @param {{ year: number, month?: number, currency?: string }} opts
 *        Omit `month` to generate an annual statement.
 * @returns {Promise<import("mongoose").Document>}
 */
export async function generateStatement({ year, month, currency = "UGX" }) {
  if (!year) throw new Error("generateStatement requires a year");

  const startDate = new Date(Date.UTC(year, (month ?? 1) - 1, 1));
  const endExclusive = month
    ? new Date(Date.UTC(year, month, 1)) // first of next month
    : new Date(Date.UTC(year + 1, 0, 1)); // first of next year

  // Only COMPLETED payments represent real cash movement.
  const payments = await Payment.find({
    status: "completed",
    date: { $gte: startDate, $lt: endExclusive },
  })
    .populate("transaction", "transactionId type commodity")
    .sort({ date: 1 })
    .lean();

  // Chain opening balance from the previous period's close.
  const prev = await Statement.findOne({ endDate: { $lte: startDate } })
    .sort({ endDate: -1 })
    .select("closingBalance")
    .lean();
  const openingBalance = prev?.closingBalance ?? 0;

  let balance = openingBalance;
  let totalIncome = 0;
  let totalExpenses = 0;

  const entries = payments.map((p) => {
    const txn = p.transaction;
    const income = isIncomeTxn(txn);
    const amount = p.amount;

    if (income) {
      totalIncome += amount;
      balance += amount;
    } else {
      totalExpenses += amount;
      balance -= amount;
    }

    const description =
      [
        txn?.type,
        txn?.commodity,
        txn?.transactionId && `(${txn.transactionId})`,
      ]
        .filter(Boolean)
        .join(" ") || `Payment ${p.reference ?? p._id}`;

    return {
      date: p.date,
      description,
      type: income ? "income" : "expense",
      amount,
      balance,
      category: txn?.commodity ?? p.method,
      payment: p._id,
      transaction: txn?._id ?? null,
      reference: p.reference,
    };
  });

  const doc = {
    statementId: month
      ? `STMT-${year}-${String(month).padStart(2, "0")}`
      : `STMT-${year}`,
    year,
    month,
    startDate,
    endDate: new Date(endExclusive.getTime() - 1), // inclusive end
    openingBalance,
    closingBalance: balance,
    totalIncome,
    totalExpenses,
    currency,
    entries,
    summary: buildSummary(payments, entries, openingBalance, balance),
    status: "draft",
    generatedAt: new Date(),
    sourceCount: payments.length,
  };

  return Statement.findOneAndUpdate({ statementId: doc.statementId }, doc, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
}

/**
 * Generate a statement AND finalize it if it passes integrity checks. This is
 * what the scheduled monthly close calls. Returns the finalized (or, on
 * failure, still-draft) document plus any validation problems.
 *
 * @param {{ year: number, month?: number, currency?: string }} opts
 * @returns {Promise<{ statement: import("mongoose").Document, finalized: boolean, problems: string[] }>}
 */
export async function closeStatement(opts) {
  const statement = await generateStatement(opts);
  const { valid, problems } = statement.validateIntegrity();
  if (valid) {
    await statement.finalize();
    return { statement, finalized: true, problems: [] };
  }
  return { statement, finalized: false, problems };
}

/* ------------------------------------------------------------------ */
/* Analytics                                                          */
/* ------------------------------------------------------------------ */

function buildSummary(payments, entries, opening, closing) {
  const cat = new Map();
  for (const e of entries) {
    const k = e.category ?? "uncategorised";
    const c = cat.get(k) ?? { category: k, income: 0, expense: 0, count: 0 };
    c[e.type] += e.amount;
    c.count += 1;
    cat.set(k, c);
  }

  const method = new Map();
  for (const p of payments) {
    const m = method.get(p.method) ?? { method: p.method, total: 0, count: 0 };
    m.total += p.amount;
    m.count += 1;
    method.set(p.method, m);
  }

  const incomes = entries.filter((e) => e.type === "income");
  const expenses = entries.filter((e) => e.type === "expense");
  const top = (arr) =>
    arr.reduce((a, b) => (b.amount > (a?.amount ?? 0) ? b : a), null);
  const bi = top(incomes);
  const be = top(expenses);
  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  return {
    byCategory: [...cat.values()],
    byMethod: [...method.values()],
    largestIncome: bi && {
      amount: bi.amount,
      description: bi.description,
      transaction: bi.transaction,
    },
    largestExpense: be && {
      amount: be.amount,
      description: be.description,
      transaction: be.transaction,
    },
    netChange: closing - opening,
    savingsRate: totalIncome
      ? Math.max(0, (totalIncome - totalExpense) / totalIncome)
      : 0,
  };
}