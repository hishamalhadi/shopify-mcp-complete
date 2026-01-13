import { z } from "zod";
import { PaginationSchema, MetafieldInputSchema } from "./common.js";

// Get collections input
export const GetCollectionsInputSchema = PaginationSchema.extend({
  query: z.string().optional().describe("Search query"),
  type: z.enum(["SMART", "MANUAL"]).optional().describe("Collection type"),
});

// Get collection products
export const GetCollectionProductsInputSchema = PaginationSchema.extend({
  collectionId: z.string().min(1).describe("Collection ID"),
});

// Create collection input
export const CreateCollectionInputSchema = z.object({
  title: z.string().min(1).describe("Collection title"),
  descriptionHtml: z.string().optional().describe("Collection description (HTML)"),
  handle: z.string().optional().describe("URL handle"),
  image: z
    .object({
      src: z.string().url(),
      altText: z.string().optional(),
    })
    .optional(),
  metafields: z.array(MetafieldInputSchema).optional(),
  // For manual collections
  productIds: z.array(z.string()).optional().describe("Product IDs to add"),
  // For smart collections
  rules: z
    .array(
      z.object({
        column: z.enum([
          "TITLE",
          "TYPE",
          "VENDOR",
          "VARIANT_PRICE",
          "TAG",
          "VARIANT_COMPARE_AT_PRICE",
          "VARIANT_WEIGHT",
          "VARIANT_INVENTORY",
          "VARIANT_TITLE",
        ]),
        relation: z.enum([
          "EQUALS",
          "NOT_EQUALS",
          "GREATER_THAN",
          "LESS_THAN",
          "STARTS_WITH",
          "ENDS_WITH",
          "CONTAINS",
          "NOT_CONTAINS",
        ]),
        condition: z.string(),
      })
    )
    .optional(),
  disjunctive: z.boolean().optional().describe("Match ANY rule (true) or ALL rules (false)"),
});

// Update collection input
export const UpdateCollectionInputSchema = z.object({
  collectionId: z.string().min(1).describe("Collection ID"),
  title: z.string().optional(),
  descriptionHtml: z.string().optional(),
  image: z
    .object({
      src: z.string().url(),
      altText: z.string().optional(),
    })
    .optional(),
  productIdsToAdd: z.array(z.string()).optional(),
  productIdsToRemove: z.array(z.string()).optional(),
});

export type GetCollectionsInput = z.infer<typeof GetCollectionsInputSchema>;
export type GetCollectionProductsInput = z.infer<typeof GetCollectionProductsInputSchema>;
export type CreateCollectionInput = z.infer<typeof CreateCollectionInputSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionInputSchema>;
