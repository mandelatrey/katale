import { z } from "zod";
import { objectId } from "./common.js";

export const listStatementsSchema = z.object({
  limit: z.coerce.number().int().positive().max(60).default(12),
});

export const statementIdSchema = z.object({ id: objectId });
