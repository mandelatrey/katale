import { describe, it, expect } from "vitest";
import Market from "../models/Market.js";
import { listMarkets, listNearbyMarkets } from "../services/markets.js";
import { hasMongo } from "./setup.js";

describe("markets service", () => {
  it("listMarkets returns seeded markets", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Market.create({
      name: "Nakasero",
      region: "Central",
      district: "Kampala",
      location: { type: "Point", coordinates: [32.58, 0.31] },
    });
    const list = await listMarkets({}, null);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Nakasero");
  });

  it("listNearbyMarkets returns markets within radius", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Market.init();
    await Market.create([
      {
        name: "Kampala A",
        region: "Central",
        district: "Kampala",
        location: { type: "Point", coordinates: [32.58, 0.31] },
      },
      {
        name: "Gulu",
        region: "Northern",
        district: "Gulu",
        location: { type: "Point", coordinates: [32.29, 2.77] },
      },
    ]);
    const near = await listNearbyMarkets(
      { lng: 32.58, lat: 0.31, maxDistance: 50000 },
      null,
    );
    expect(near.map((m) => m.name)).toEqual(["Kampala A"]);
  });
});
