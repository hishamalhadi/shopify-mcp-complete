import { z } from "zod";
import { PaginationSchema } from "./common.js";

// Discount value type
export const DiscountValueTypeSchema = z.enum(["FIXED_AMOUNT", "PERCENTAGE"]);

// Create discount input
export const CreateDiscountInputSchema = z.object({
  title: z.string().min(1).describe("Discount title/name"),
  code: z.string().min(1).describe("Discount code customers will use"),
  valueType: DiscountValueTypeSchema.describe("Type of discount"),
  value: z.number().positive().describe("Discount value (amount or percentage)"),
  startsAt: z.string().optional().describe("Start date (ISO 8601)"),
  endsAt: z.string().optional().describe("End date (ISO 8601)"),
  usageLimit: z.number().int().positive().optional().describe("Max total uses"),
  oncePerCustomer: z.boolean().optional().default(true),
  minimumRequirement: z
    .object({
      type: z.enum(["SUBTOTAL", "QUANTITY"]),
      value: z.number().positive(),
    })
    .optional(),
  appliesTo: z
    .object({
      type: z.enum(["ALL", "PRODUCTS", "COLLECTIONS"]),
      ids: z.array(z.string()).optional(),
    })
    .optional()
    .default({ type: "ALL" }),
});

// Get discounts input
export const GetDiscountsInputSchema = PaginationSchema.extend({
  query: z.string().optional().describe("Search query"),
  status: z.enum(["ACTIVE", "EXPIRED", "SCHEDULED"]).optional(),
});

// Update discount input
export const UpdateDiscountInputSchema = z.object({
  discountId: z.string().min(1).describe("Discount ID to update"),
  title: z.string().optional(),
  code: z.string().optional(),
  valueType: DiscountValueTypeSchema.optional(),
  value: z.number().positive().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
});

// Delete discount input
export const DeleteDiscountInputSchema = z.object({
  discountId: z.string().min(1).describe("Discount ID to delete"),
});

export type CreateDiscountInput = z.infer<typeof CreateDiscountInputSchema>;
export type GetDiscountsInput = z.infer<typeof GetDiscountsInputSchema>;
export type UpdateDiscountInput = z.infer<typeof UpdateDiscountInputSchema>;
export type DeleteDiscountInput = z.infer<typeof DeleteDiscountInputSchema>;
