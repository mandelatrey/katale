import { describe, it, expect } from "vitest";
import Statement from "../models/Statement.js";
import {
  listStatements,
  getStatementById,
} from "../services/statements.js";
import { hasMongo } from "./setup.js";

describe("statements service", () => {
  it("listStatements sorts newest first and strips entries", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Statement.create([
      {
        statementId: "S1",
        period: "Feb 2026",
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-02-28"),
        entries: [{ description: "heavy", amount: 1 }],
      },
      {
        statementId: "S2",
        period: "Mar 2026",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-31"),
        entries: [{ description: "heavy", amount: 1 }],
      },
    ]);
    const list = await listStatements({}, null);
    expect(list[0].statementId).toBe("S2");
    expect(list[0].entries.length).toBe(0);
  });

  it("getStatementById includes entries", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const created = await Statement.create({
      statementId: "S9",
      period: "Jan 2026",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-31"),
      entries: [{ description: "Sale", amount: 500, type: "income" }],
    });
    const fetched = await getStatementById({ id: created._id.toString() }, null);
    expect(fetched.entries).toHaveLength(1);
  });
});
