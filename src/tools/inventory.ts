import { GraphQLClient } from "graphql-request";
import {
  GetInventoryLevelsInputSchema,
  AdjustInventoryInputSchema,
  BulkAdjustInventoryInputSchema,
  SetInventoryInputSchema,
  GetLocationsInputSchema,
  TransferInventoryInputSchema,
} from "../schemas/inventory.js";
import {
  GET_INVENTORY_LEVELS,
  GET_LOCATIONS,
  ADJUST_INVENTORY_QUANTITIES,
  SET_INVENTORY_QUANTITIES,
  MOVE_INVENTORY_QUANTITIES,
} from "../graphql/index.js";
import { toGid } from "../client/shopify-client.js";

export function createInventoryTools(client: GraphQLClient) {
  return {
    "get-inventory-levels": {
      description:
        "Get inventory levels for products/variants across locations. Can filter by location, product, SKU, or low stock threshold.",
      schema: GetInventoryLevelsInputSchema,
      handler: async (input: unknown) => {
        const params = GetInventoryLevelsInputSchema.parse(input);
        const queryParts: string[] = [];

        if (params.locationId) {
          const locId = params.locationId.includes("gid://")
            ? params.locationId
            : toGid("Location", params.locationId);
          queryParts.push(`location_id:${locId}`);
        }
        if (params.sku) {
          queryParts.push(`sku:${params.sku}`);
        }

        const variables = {
          first: params.limit,
          query: queryParts.length > 0 ? queryParts.join(" AND ") : null,
          after: params.cursor,
        };

        const data = await client.request<{
          inventoryItems: { edges: Array<{ node: unknown }>; pageInfo: unknown };
        }>(GET_INVENTORY_LEVELS, variables);

        let items = data.inventoryItems.edges.map((edge) => edge.node);

        // Filter for low stock if requested
        if (params.lowStock) {
          const threshold = params.threshold ?? 10;
          items = items.filter((item: unknown) => {
            const inventoryItem = item as {
              inventoryLevels?: {
                edges?: Array<{
                  node?: {
                    quantities?: Array<{ name: string; quantity: number }>
                  }
                }>
              };
            };
            const levels = inventoryItem.inventoryLevels?.edges || [];
            const totalAvailable = levels.reduce((sum, edge) => {
              const availableQty = edge.node?.quantities?.find(q => q.name === "available");
              return sum + (availableQty?.quantity || 0);
            }, 0);
            return totalAvailable <= threshold;
          });
        }

        return {
          inventoryItems: items,
          pageInfo: data.inventoryItems.pageInfo,
        };
      },
    },

    "adjust-inventory": {
      description:
        "Adjust inventory quantity for a specific variant at a location. Use positive delta to add stock, negative to remove. This is for incremental changes.",
      schema: AdjustInventoryInputSchema,
      handler: async (input: unknown) => {
        const params = AdjustInventoryInputSchema.parse(input);
        const inventoryItemId = params.inventoryItemId.includes("gid://")
          ? params.inventoryItemId
          : toGid("InventoryItem", params.inventoryItemId);
        const locationId = params.locationId.includes("gid://")
          ? params.locationId
          : toGid("Location", params.locationId);

        const data = await client.request<{
          inventoryAdjustQuantities: {
            inventoryAdjustmentGroup: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(ADJUST_INVENTORY_QUANTITIES, {
          input: {
            reason: params.reason,
            name: "available",
            referenceDocumentUri: params.referenceDocumentUri,
            changes: [
              {
                inventoryItemId,
                locationId,
                delta: params.delta,
              },
            ],
          },
        });

        if (data.inventoryAdjustQuantities.userErrors.length > 0) {
          throw new Error(
            `Failed to adjust inventory: ${data.inventoryAdjustQuantities.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          success: true,
          adjustment: data.inventoryAdjustQuantities.inventoryAdjustmentGroup,
        };
      },
    },

    "bulk-adjust-inventory": {
      description:
        "Adjust inventory quantities for multiple items at once. Efficient for batch updates.",
      schema: BulkAdjustInventoryInputSchema,
      handler: async (input: unknown) => {
        const params = BulkAdjustInventoryInputSchema.parse(input);

        const changes = params.adjustments.map((adj) => ({
          inventoryItemId: adj.inventoryItemId.includes("gid://")
            ? adj.inventoryItemId
            : toGid("InventoryItem", adj.inventoryItemId),
          locationId: adj.locationId.includes("gid://")
            ? adj.locationId
            : toGid("Location", adj.locationId),
          delta: adj.delta,
        }));

        const data = await client.request<{
          inventoryAdjustQuantities: {
            inventoryAdjustmentGroup: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(ADJUST_INVENTORY_QUANTITIES, {
          input: {
            reason: params.reason,
            name: "available",
            changes,
          },
        });

        if (data.inventoryAdjustQuantities.userErrors.length > 0) {
          throw new Error(
            `Failed to bulk adjust inventory: ${data.inventoryAdjustQuantities.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          success: true,
          adjustment: data.inventoryAdjustQuantities.inventoryAdjustmentGroup,
        };
      },
    },

    "set-inventory": {
      description:
        "Set inventory to a specific quantity at a location. This replaces the current quantity rather than adjusting it.",
      schema: SetInventoryInputSchema,
      handler: async (input: unknown) => {
        const params = SetInventoryInputSchema.parse(input);
        const inventoryItemId = params.inventoryItemId.includes("gid://")
          ? params.inventoryItemId
          : toGid("InventoryItem", params.inventoryItemId);
        const locationId = params.locationId.includes("gid://")
          ? params.locationId
          : toGid("Location", params.locationId);

        const data = await client.request<{
          inventorySetOnHandQuantities: {
            inventoryAdjustmentGroup: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(SET_INVENTORY_QUANTITIES, {
          input: {
            reason: params.reason,
            setQuantities: [
              {
                inventoryItemId,
                locationId,
                quantity: params.quantity,
              },
            ],
          },
        });

        if (data.inventorySetOnHandQuantities.userErrors.length > 0) {
          throw new Error(
            `Failed to set inventory: ${data.inventorySetOnHandQuantities.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          success: true,
          adjustment: data.inventorySetOnHandQuantities.inventoryAdjustmentGroup,
        };
      },
    },

    "get-locations": {
      description:
        "Get all inventory locations for the store including address, active status, and fulfillment capabilities.",
      schema: GetLocationsInputSchema,
      handler: async (input: unknown) => {
        const params = GetLocationsInputSchema.parse(input);

        const data = await client.request<{
          locations: { edges: Array<{ node: unknown }> };
        }>(GET_LOCATIONS, {
          first: 50,
          includeInactive: params.includeInactive ?? false,
        });

        return {
          locations: data.locations.edges.map((edge) => edge.node),
        };
      },
    },

    "transfer-inventory": {
      description:
        "Transfer inventory from one location to another. Moves specified quantity between locations.",
      schema: TransferInventoryInputSchema,
      handler: async (input: unknown) => {
        const params = TransferInventoryInputSchema.parse(input);
        const inventoryItemId = params.inventoryItemId.includes("gid://")
          ? params.inventoryItemId
          : toGid("InventoryItem", params.inventoryItemId);
        const fromLocationId = params.fromLocationId.includes("gid://")
          ? params.fromLocationId
          : toGid("Location", params.fromLocationId);
        const toLocationId = params.toLocationId.includes("gid://")
          ? params.toLocationId
          : toGid("Location", params.toLocationId);

        const data = await client.request<{
          inventoryMoveQuantities: {
            inventoryAdjustmentGroup: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(MOVE_INVENTORY_QUANTITIES, {
          input: {
            reason: "MOVEMENT_CREATED",
            name: "available",
            changes: [
              {
                inventoryItemId,
                from: { locationId: fromLocationId },
                to: { locationId: toLocationId },
                quantity: params.quantity,
              },
            ],
          },
        });

        if (data.inventoryMoveQuantities.userErrors.length > 0) {
          throw new Error(
            `Failed to transfer inventory: ${data.inventoryMoveQuantities.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          success: true,
          adjustment: data.inventoryMoveQuantities.inventoryAdjustmentGroup,
        };
      },
    },
  };
}
