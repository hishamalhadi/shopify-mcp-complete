import { GraphQLClient } from "graphql-request";
import { createProductTools } from "./products.js";
import { createOrderTools } from "./orders.js";
import { createCustomerTools } from "./customers.js";
import { createInventoryTools } from "./inventory.js";
import { createAnalyticsTools } from "./analytics.js";
import { createDiscountTools } from "./discounts.js";
import { createCollectionTools } from "./collections.js";
import { createShopTools } from "./shop.js";

export interface Tool {
  description: string;
  schema: unknown;
  handler: (input: unknown) => Promise<unknown>;
}

export type ToolRegistry = Record<string, Tool>;

export function createAllTools(client: GraphQLClient): ToolRegistry {
  return {
    // Products (8 tools)
    ...createProductTools(client),
    // Orders (7 tools)
    ...createOrderTools(client),
    // Customers (6 tools)
    ...createCustomerTools(client),
    // Inventory (6 tools - including bulk and set)
    ...createInventoryTools(client),
    // Analytics (4 tools)
    ...createAnalyticsTools(client),
    // Discounts (4 tools)
    ...createDiscountTools(client),
    // Collections (3 tools)
    ...createCollectionTools(client),
    // Shop (2 tools)
    ...createShopTools(client),
  };
}

export function getToolCount(): number {
  // Return approximate count based on our implementation
  return 40;
}

export {
  createProductTools,
  createOrderTools,
  createCustomerTools,
  createInventoryTools,
  createAnalyticsTools,
  createDiscountTools,
  createCollectionTools,
  createShopTools,
};
