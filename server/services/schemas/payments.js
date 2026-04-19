import { z } from "zod";
import { objectId, paginationSchema } from "./common.js";

const methodEnum = z.enum(["mobile_money", "bank_transfer", "cash", "cheque"]);
const statusEnum = z.enum(["pending", "completed", "failed", "refunded"]);

export const listPaymentsSchema = paginationSchema.extend({
  status: statusEnum.optional(),
  method: methodEnum.optional(),
});

export const paymentIdSchema = z.object({ id: objectId });
