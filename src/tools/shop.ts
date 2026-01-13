import { GraphQLClient } from "graphql-request";
import { GetShopInfoInputSchema, GetShopLocationsInputSchema } from "../schemas/shop.js";
import { GET_SHOP_INFO, GET_LOCATIONS } from "../graphql/index.js";

export function createShopTools(client: GraphQLClient) {
  return {
    "get-shop-info": {
      description:
        "Get general information about the Shopify store including name, domain, plan, currency, timezone, and contact details.",
      schema: GetShopInfoInputSchema,
      handler: async (_input: unknown) => {
        const data = await client.request<{ shop: unknown }>(GET_SHOP_INFO);
        return data.shop;
      },
    },

    "get-shop-locations": {
      description:
        "Get all fulfillment and inventory locations for the store including address and capabilities.",
      schema: GetShopLocationsInputSchema,
      handler: async (input: unknown) => {
        const params = GetShopLocationsInputSchema.parse(input);

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
  };
}
