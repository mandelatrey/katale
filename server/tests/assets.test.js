import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Asset from "../models/Asset.js";
import { listAssets, getAssetById } from "../services/assets.js";
import { hasMongo } from "./setup.js";

describe("assets service", () => {
  it("listAssets filters by type and status", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Asset.create([
      { name: "Warehouse A", type: "warehouse", status: "active" },
      { name: "Van 1", type: "vehicle", status: "active" },
      { name: "Van 2", type: "vehicle", status: "idle" },
    ]);
    const activeVehicles = await listAssets(
      { type: "vehicle", status: "active" },
      null,
    );
    expect(activeVehicles).toHaveLength(1);
    expect(activeVehicles[0].name).toBe("Van 1");
  });

  it("getAssetById 404s for unknown id", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await expect(
      getAssetById({ id: new mongoose.Types.ObjectId().toString() }, null),
    ).rejects.toMatchObject({ status: 404 });
  });
});
