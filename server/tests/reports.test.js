import { describe, it, expect } from "vitest";
import Report from "../models/Report.js";
import { listReports } from "../services/reports.js";
import { hasMongo } from "./setup.js";

describe("reports service", () => {
  it("listReports filters by type and strips data payload", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Report.create([
      {
        reportId: "R1",
        title: "Maize trend",
        type: "price_trend",
        data: { heavy: "payload" },
      },
      {
        reportId: "R2",
        title: "Regional",
        type: "regional_summary",
        data: { heavy: "payload" },
      },
    ]);
    const trends = await listReports({ type: "price_trend" }, null);
    expect(trends).toHaveLength(1);
    expect(trends[0].data).toBeUndefined();
  });
});
