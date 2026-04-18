import { describe, it, expect } from "vitest";
import Market from "../models/Market.js";
import Price from "../models/Price.js";
import {
  listLatestPrices,
  comparePrices,
} from "../services/commodities.js";
import { hasMongo } from "./setup.js";

describe("commodities service", () => {
  it("listLatestPrices returns one record per market (most recent)", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const market = await Market.create({
      name: "Owino",
      region: "Central",
      district: "Kampala",
      location: { type: "Point", coordinates: [32.58, 0.31] },
    });
    await Price.create([
      {
        market: market._id,
        commodity: "Maize",
        price: 1000,
        unit: "kg",
        recordedAt: new Date("2026-01-01"),
      },
      {
        market: market._id,
        commodity: "Maize",
        price: 1200,
        unit: "kg",
        recordedAt: new Date("2026-04-01"),
      },
    ]);
    const latest = await listLatestPrices({ commodity: "Maize" }, null);
    expect(latest).toHaveLength(1);
    expect(latest[0].price).toBe(1200);
  });

  it("comparePrices sorts markets ascending by price", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const [m1, m2] = await Market.create([
      {
        name: "A",
        region: "C",
        district: "D",
        location: { type: "Point", coordinates: [32.58, 0.31] },
      },
      {
        name: "B",
        region: "C",
        district: "D",
        location: { type: "Point", coordinates: [32.6, 0.33] },
      },
    ]);
    await Price.create([
      {
        market: m1._id,
        commodity: "Beans",
        price: 3500,
        unit: "kg",
        recordedAt: new Date(),
      },
      {
        market: m2._id,
        commodity: "Beans",
        price: 2800,
        unit: "kg",
        recordedAt: new Date(),
      },
    ]);
    const cmp = await comparePrices({ commodity: "Beans" }, null);
    expect(cmp.map((r) => r.market)).toEqual(["B", "A"]);
  });
});
