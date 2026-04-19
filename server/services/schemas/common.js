import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "must be a 24-char hex ObjectId");

export const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export const actorSchema = z
  .object({
    userId: z.string().nullable().optional(),
    source: z.enum(["anonymous", "header", "whatsapp", "system"]).optional(),
  })
  .default({ userId: null, source: "anonymous" });

export const optionalString = z.string().trim().min(1).optional();
