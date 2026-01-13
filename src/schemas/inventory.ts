import { z } from "zod";
import { PaginationSchema } from "./common.js";

// Inventory adjustment reasons
export const InventoryReasonSchema = z.enum([
  "correction",
  "cycle_count_available",
  "damaged",
  "movement_created",
  "movement_updated",
  "movement_received",
  "movement_canceled",
  "other",
  "promotion",
  "quality_control",
  "received",
  "reservation_created",
  "reservation_deleted",
  "reservation_updated",
  "restock",
  "safety_stock",
  "shrinkage",
]);

// Get inventory levels
export const GetInventoryLevelsInputSchema = PaginationSchema.extend({
  locationId: z.string().optional().describe("Filter by location ID"),
  productId: z.string().optional().describe("Filter by product ID"),
  sku: z.string().optional().describe("Filter by SKU"),
  lowStock: z.boolean().optional().describe("Only show low stock items"),
  threshold: z.number().optional().default(10).describe("Low stock threshold"),
});

// Adjust inventory - for a single variant at a location
export const AdjustInventoryInputSchema = z.object({
  inventoryItemId: z.string().min(1).describe("Inventory item ID (from variant)"),
  locationId: z.string().min(1).describe("Location ID"),
  delta: z.number().int().describe("Quantity change (positive or negative)"),
  reason: InventoryReasonSchema.default("correction").describe("Adjustment reason"),
  referenceDocumentUri: z.string().optional().describe("Reference document URI"),
});

// Bulk adjust inventory - multiple adjustments at once
export const BulkAdjustInventoryInputSchema = z.object({
  adjustments: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1),
        locationId: z.string().min(1),
        delta: z.number().int(),
      })
    )
    .min(1)
    .max(100),
  reason: InventoryReasonSchema.default("correction"),
});

// Set inventory to a specific level
export const SetInventoryInputSchema = z.object({
  inventoryItemId: z.string().min(1).describe("Inventory item ID"),
  locationId: z.string().min(1).describe("Location ID"),
  quantity: z.number().int().min(0).describe("New quantity to set"),
  reason: InventoryReasonSchema.default("correction"),
});

// Get locations
export const GetLocationsInputSchema = z.object({
  includeInactive: z.boolean().optional().default(false),
});

// Transfer inventory between locations
export const TransferInventoryInputSchema = z.object({
  inventoryItemId: z.string().min(1).describe("Inventory item ID"),
  fromLocationId: z.string().min(1).describe("Source location ID"),
  toLocationId: z.string().min(1).describe("Destination location ID"),
  quantity: z.number().int().min(1).describe("Quantity to transfer"),
});

export type GetInventoryLevelsInput = z.infer<typeof GetInventoryLevelsInputSchema>;
export type AdjustInventoryInput = z.infer<typeof AdjustInventoryInputSchema>;
export type BulkAdjustInventoryInput = z.infer<typeof BulkAdjustInventoryInputSchema>;
export type SetInventoryInput = z.infer<typeof SetInventoryInputSchema>;
export type GetLocationsInput = z.infer<typeof GetLocationsInputSchema>;
export type TransferInventoryInput = z.infer<typeof TransferInventoryInputSchema>;
