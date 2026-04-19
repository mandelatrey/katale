import Carrier from "../models/Carrier.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import {
  listCarriersSchema,
  createCarrierSchema,
  updateCarrierSchema,
  carrierIdSchema,
} from "./schemas/carriers.js";

export async function listCarriers(params = {}, _actor) {
  const { search, category, status } = parse(
    listCarriersSchema,
    params,
    "carrier filter",
  );
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };
  return Carrier.find(filter).sort({ category: 1, name: 1 });
}

export async function getCarrierStats(_params = {}, _actor) {
  const [byStatus, byCategory, total] = await Promise.all([
    Carrier.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Carrier.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Carrier.countDocuments(),
  ]);
  return { total, byStatus, byCategory };
}

export async function getCarrierById(params, _actor) {
  const { id } = parse(carrierIdSchema, params, "carrier id");
  const carrier = await Carrier.findById(id);
  if (!carrier) throw notFound("Carrier not found");
  return carrier;
}

export async function createCarrier(data, actor) {
  const body = parse(createCarrierSchema, data, "carrier");
  const carrier = new Carrier({
    ...body,
    createdBy: actor?.userId || undefined,
    // If the actor is a carrier role and no explicit owner was given,
    // auto-assign them as owner so their subsequent WhatsApp updates bind
    // to this vehicle.
    owner: actor?.userId || undefined,
  });
  await carrier.save();
  return carrier;
}

export async function updateCarrier({ id, ...data }, _actor) {
  const { id: cid } = parse(carrierIdSchema, { id }, "carrier id");
  const body = parse(updateCarrierSchema, data, "carrier update");
  const carrier = await Carrier.findByIdAndUpdate(cid, body, {
    new: true,
    runValidators: true,
  });
  if (!carrier) throw notFound("Carrier not found");
  return carrier;
}

export async function deleteCarrier(params, _actor) {
  const { id } = parse(carrierIdSchema, params, "carrier id");
  const carrier = await Carrier.findByIdAndDelete(id);
  if (!carrier) throw notFound("Carrier not found");
  return { message: "Carrier deleted" };
}
