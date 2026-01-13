import { z } from "zod";
import {
  PaginationSchema,
  ProductStatusSchema,
  WeightUnitSchema,
  MetafieldInputSchema,
} from "./common.js";

// Get products input
export const GetProductsInputSchema = PaginationSchema.extend({
  searchTitle: z.string().optional().describe("Search products by title"),
  status: ProductStatusSchema.optional().describe("Filter by product status"),
  vendor: z.string().optional().describe("Filter by vendor"),
  productType: z.string().optional().describe("Filter by product type"),
});

// Get product by ID
export const GetProductByIdInputSchema = z.object({
  productId: z.string().min(1).describe("Shopify product ID or GID"),
});

// Variant input for creating products
export const ProductVariantInputSchema = z.object({
  price: z.string().optional().describe("Price of the variant"),
  compareAtPrice: z.string().optional().describe("Compare at price"),
  sku: z.string().optional().describe("SKU"),
  barcode: z.string().optional().describe("Barcode"),
  weight: z.number().optional().describe("Weight"),
  weightUnit: WeightUnitSchema.optional().describe("Weight unit"),
  inventoryQuantity: z.number().optional().describe("Initial inventory quantity"),
  options: z.array(z.string()).optional().describe("Variant options"),
  inventoryPolicy: z.enum(["DENY", "CONTINUE"]).optional(),
  requiresShipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
});

// Create product input
export const CreateProductInputSchema = z.object({
  title: z.string().min(1).describe("Product title"),
  descriptionHtml: z.string().optional().describe("Product description (HTML)"),
  vendor: z.string().optional().describe("Vendor name"),
  productType: z.string().optional().describe("Product type"),
  tags: z.array(z.string()).optional().describe("Product tags"),
  status: ProductStatusSchema.optional().describe("Product status"),
  variants: z
    .array(ProductVariantInputSchema)
    .optional()
    .describe("Product variants"),
  metafields: z
    .array(MetafieldInputSchema)
    .optional()
    .describe("Product metafields"),
});

// Update product input
export const UpdateProductInputSchema = z.object({
  productId: z.string().min(1).describe("Product ID to update"),
  title: z.string().optional().describe("New product title"),
  descriptionHtml: z.string().optional().describe("New description (HTML)"),
  vendor: z.string().optional().describe("New vendor"),
  productType: z.string().optional().describe("New product type"),
  tags: z.array(z.string()).optional().describe("New tags"),
  status: ProductStatusSchema.optional().describe("New status"),
});

// Delete product input
export const DeleteProductInputSchema = z.object({
  productId: z.string().min(1).describe("Product ID to delete"),
});

// Manage variants input
export const ManageVariantsInputSchema = z.object({
  productId: z.string().min(1).describe("Product ID"),
  variantsToCreate: z.array(ProductVariantInputSchema).optional(),
  variantsToUpdate: z
    .array(
      z.object({
        variantId: z.string().min(1),
        price: z.string().optional(),
        compareAtPrice: z.string().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
      })
    )
    .optional(),
  variantsToDelete: z.array(z.string()).optional().describe("Variant IDs to delete"),
});

// Manage images input
export const ManageImagesInputSchema = z.object({
  productId: z.string().min(1).describe("Product ID"),
  imagesToAdd: z
    .array(
      z.object({
        src: z.string().url().describe("Image URL"),
        altText: z.string().optional().describe("Alt text"),
      })
    )
    .optional(),
  imagesToDelete: z.array(z.string()).optional().describe("Image IDs to delete"),
});

// Manage metafields input
export const ManageMetafieldsInputSchema = z.object({
  ownerId: z.string().min(1).describe("Owner ID (product, variant, customer, etc.)"),
  metafieldsToSet: z.array(MetafieldInputSchema).optional(),
  metafieldIdsToDelete: z.array(z.string()).optional(),
});

export type GetProductsInput = z.infer<typeof GetProductsInputSchema>;
export type GetProductByIdInput = z.infer<typeof GetProductByIdInputSchema>;
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;
export type DeleteProductInput = z.infer<typeof DeleteProductInputSchema>;
export type ManageVariantsInput = z.infer<typeof ManageVariantsInputSchema>;
export type ManageImagesInput = z.infer<typeof ManageImagesInputSchema>;
export type ManageMetafieldsInput = z.infer<typeof ManageMetafieldsInputSchema>;
