import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Carrier from "../models/Carrier.js";
import {
  createCarrier,
  listCarriers,
  updateCarrier,
} from "../services/carriers.js";
import { hasMongo } from "./setup.js";

const actor = {
  userId: new mongoose.Types.ObjectId().toString(),
  source: "whatsapp",
};

describe("carriers service", () => {
  it("createCarrier sets owner from actor", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    const c = await createCarrier(
      { name: "KAB 123", category: "Trucks", vehicleType: "Truck" },
      actor,
    );
    expect(c.owner.toString()).toBe(actor.userId);
    expect(c.createdBy.toString()).toBe(actor.userId);
  });

  it("listCarriers filters by category", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await Carrier.create([
      { name: "Van 1", category: "Vans" },
      { name: "Truck 1", category: "Trucks" },
    ]);
    const trucks = await listCarriers({ category: "Trucks" }, null);
    expect(trucks).toHaveLength(1);
    expect(trucks[0].name).toBe("Truck 1");
  });

  it("updateCarrier 404s for unknown id", async (ctx) => {
    if (!hasMongo()) return ctx.skip();
    await expect(
      updateCarrier(
        { id: new mongoose.Types.ObjectId().toString(), status: "LOADING" },
        actor,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});
