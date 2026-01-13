import { z } from "zod";

// Get shop info (no input required)
export const GetShopInfoInputSchema = z.object({});

// Get shop locations
export const GetShopLocationsInputSchema = z.object({
  includeInactive: z.boolean().optional().default(false),
});

export type GetShopInfoInput = z.infer<typeof GetShopInfoInputSchema>;
export type GetShopLocationsInput = z.infer<typeof GetShopLocationsInputSchema>;
