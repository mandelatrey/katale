import { describe, it, expect } from "vitest";
import Insight from "../models/Insight.js";
import { listInsights } from "../services/insights.js";
import { hasMongo } from "./setup.js";

describe("insights service", () => {
  it("listInsights returns all insights newest first", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Insight.create([
      { title: "Old", summary: "a", createdAt: new Date("2026-01-01") },
      { title: "New", summary: "b", createdAt: new Date("2026-04-01") },
    ]);
    const list = await listInsights();
    expect(list.map((i) => i.title)).toEqual(["New", "Old"]);
  });
});
