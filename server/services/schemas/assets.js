import { z } from "zod";
import { objectId } from "./common.js";

const typeEnum = z.enum(["vehicle", "warehouse", "equipment"]);
const statusEnum = z.enum(["active", "maintenance", "idle", "decommissioned"]);

export const listAssetsSchema = z.object({
  type: typeEnum.optional(),
  status: statusEnum.optional(),
  region: z.string().trim().min(1).optional(),
});

export const assetIdSchema = z.object({ id: objectId });
