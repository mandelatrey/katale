import { z } from "zod";
import { objectId } from "./common.js";

const statusEnum = z.enum(["ON THE WAY", "LOADING", "WAITING", "UNLOADING"]);
const categoryEnum = z.enum(["Favorites", "Trucks", "Vans"]);
const vehicleTypeEnum = z.enum(["Van", "Truck"]);

export const listCarriersSchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: categoryEnum.optional(),
  status: statusEnum.optional(),
});

const specsSchema = z
  .object({
    payload: z.string().trim().min(1).optional(),
    volume: z.string().trim().min(1).optional(),
    length: z.string().trim().min(1).optional(),
    width: z.string().trim().min(1).optional(),
    plate: z.string().trim().min(1).optional(),
  })
  .optional();

export const createCarrierSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  status: statusEnum.optional(),
  category: categoryEnum.optional(),
  vehicleModel: z.string().trim().min(1).optional(),
  vehicleType: vehicleTypeEnum.optional(),
  specs: specsSchema,
});

export const updateCarrierSchema = createCarrierSchema.partial();

export const carrierIdSchema = z.object({ id: objectId });
