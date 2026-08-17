import { z } from "zod";
import { objectId, paginationSchema } from "./common.js";

const statusEnum = z.enum([
  "pending",
  "confirmed",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const listTransactionsSchema = paginationSchema.extend({
  commodity: z.string().trim().min(1).optional(),
  status: statusEnum.optional(),
  type: z.enum(["buy", "sell"]).optional(),
});

export const createTransactionSchema = z.object({
  type: z.enum(["buy", "sell"]),
  commodity: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  currency: z.string().trim().min(1).default("UGX"),
  fromMarket: objectId.optional(),
  toMarket: objectId.optional(),
  buyer: z.string().trim().min(1).optional(),
  seller: z.string().trim().min(1).optional(),
  status: statusEnum.optional(),
  notes: z.string().trim().max(2000).optional(),
  paymentMethod: z
    .enum(["mobile_money", "bank_transfer", "cash", "cheque"])
    .optional(),
  paymentProvider: z.string().trim().min(1).optional(),
  paymentPaidBy: z.string().trim().min(1).optional(),
  paymentPaidTo: z.string().trim().min(1).optional(),
});

export const updateTransactionSchema = z
  .object({
    status: statusEnum.optional(),
    buyer: z.string().trim().min(1).nullable().optional(),
    seller: z.string().trim().min(1).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "at least one field must be provided",
  });

export const transactionIdSchema = z.object({ id: objectId });
