import { GraphQLClient } from "graphql-request";
import {
  GetCollectionsInputSchema,
  GetCollectionProductsInputSchema,
  CreateCollectionInputSchema,
  UpdateCollectionInputSchema,
} from "../schemas/collections.js";
import {
  GET_COLLECTIONS,
  GET_COLLECTION_PRODUCTS,
  CREATE_COLLECTION,
  UPDATE_COLLECTION,
  ADD_PRODUCTS_TO_COLLECTION,
  REMOVE_PRODUCTS_FROM_COLLECTION,
} from "../graphql/index.js";
import { toGid } from "../client/shopify-client.js";

export function createCollectionTools(client: GraphQLClient) {
  return {
    "get-collections": {
      description:
        "List collections from the store with optional search and type filter (SMART or MANUAL). Returns collection details and product counts.",
      schema: GetCollectionsInputSchema,
      handler: async (input: unknown) => {
        const params = GetCollectionsInputSchema.parse(input);
        const queryParts: string[] = [];

        if (params.query) {
          queryParts.push(`title:*${params.query}*`);
        }
        if (params.type) {
          queryParts.push(`collection_type:${params.type.toLowerCase()}`);
        }

        const variables = {
          first: params.limit,
          query: queryParts.length > 0 ? queryParts.join(" AND ") : null,
          after: params.cursor,
        };

        const data = await client.request<{
          collections: {
            edges: Array<{ node: unknown; cursor: string }>;
            pageInfo: unknown;
          };
        }>(GET_COLLECTIONS, variables);

        return {
          collections: data.collections.edges.map((edge) => edge.node),
          pageInfo: data.collections.pageInfo,
        };
      },
    },

    "get-collection-products": {
      description:
        "Get all products in a specific collection with pagination. Returns product details including pricing and inventory.",
      schema: GetCollectionProductsInputSchema,
      handler: async (input: unknown) => {
        const params = GetCollectionProductsInputSchema.parse(input);
        const id = params.collectionId.includes("gid://")
          ? params.collectionId
          : toGid("Collection", params.collectionId);

        const data = await client.request<{
          collection: {
            id: string;
            title: string;
            products: {
              edges: Array<{ node: unknown }>;
              pageInfo: unknown;
            };
          };
        }>(GET_COLLECTION_PRODUCTS, {
          id,
          first: params.limit,
          after: params.cursor,
        });

        return {
          collection: {
            id: data.collection?.id,
            title: data.collection?.title,
          },
          products: data.collection?.products?.edges?.map((edge) => edge.node) || [],
          pageInfo: data.collection?.products?.pageInfo,
        };
      },
    },

    "manage-collection": {
      description:
        "Create a new collection or update an existing one. Can create manual collections with specific products or smart collections with rules.",
      schema: CreateCollectionInputSchema.or(UpdateCollectionInputSchema),
      handler: async (input: unknown) => {
        // Try to parse as update first (has collectionId)
        const updateResult = UpdateCollectionInputSchema.safeParse(input);
        if (updateResult.success && updateResult.data.collectionId) {
          // Update existing collection
          const params = updateResult.data;
          const id = params.collectionId.includes("gid://")
            ? params.collectionId
            : toGid("Collection", params.collectionId);

          const results: Record<string, unknown> = {};

          // Update basic info if provided
          if (params.title || params.descriptionHtml || params.image) {
            const collectionInput: Record<string, unknown> = { id };
            if (params.title) collectionInput.title = params.title;
            if (params.descriptionHtml) collectionInput.descriptionHtml = params.descriptionHtml;
            if (params.image) {
              collectionInput.image = {
                src: params.image.src,
                altText: params.image.altText,
              };
            }

            const updateData = await client.request<{
              collectionUpdate: {
                collection: unknown;
                userErrors: Array<{ field: string; message: string }>;
              };
            }>(UPDATE_COLLECTION, { input: collectionInput });

            if (updateData.collectionUpdate.userErrors.length > 0) {
              throw new Error(
                `Failed to update collection: ${updateData.collectionUpdate.userErrors.map((e) => e.message).join(", ")}`
              );
            }
            results.collection = updateData.collectionUpdate.collection;
          }

          // Add products if specified
          if (params.productIdsToAdd && params.productIdsToAdd.length > 0) {
            const addData = await client.request<{
              collectionAddProducts: {
                collection: unknown;
                userErrors: Array<{ field: string; message: string }>;
              };
            }>(ADD_PRODUCTS_TO_COLLECTION, {
              id,
              productIds: params.productIdsToAdd.map((pid) =>
                pid.includes("gid://") ? pid : toGid("Product", pid)
              ),
            });

            if (addData.collectionAddProducts.userErrors.length > 0) {
              throw new Error(
                `Failed to add products: ${addData.collectionAddProducts.userErrors.map((e) => e.message).join(", ")}`
              );
            }
            results.productsAdded = params.productIdsToAdd.length;
          }

          // Remove products if specified
          if (params.productIdsToRemove && params.productIdsToRemove.length > 0) {
            const removeData = await client.request<{
              collectionRemoveProducts: {
                userErrors: Array<{ field: string; message: string }>;
              };
            }>(REMOVE_PRODUCTS_FROM_COLLECTION, {
              id,
              productIds: params.productIdsToRemove.map((pid) =>
                pid.includes("gid://") ? pid : toGid("Product", pid)
              ),
            });

            if (removeData.collectionRemoveProducts.userErrors.length > 0) {
              throw new Error(
                `Failed to remove products: ${removeData.collectionRemoveProducts.userErrors.map((e) => e.message).join(", ")}`
              );
            }
            results.productsRemoved = params.productIdsToRemove.length;
          }

          return results;
        }

        // Create new collection
        const params = CreateCollectionInputSchema.parse(input);

        const collectionInput: Record<string, unknown> = {
          title: params.title,
          descriptionHtml: params.descriptionHtml,
          handle: params.handle,
        };

        if (params.image) {
          collectionInput.image = {
            src: params.image.src,
            altText: params.image.altText,
          };
        }

        if (params.metafields) {
          collectionInput.metafields = params.metafields.map((m) => ({
            namespace: m.namespace,
            key: m.key,
            value: m.value,
            type: m.type,
          }));
        }

        // For smart collections with rules
        if (params.rules && params.rules.length > 0) {
          collectionInput.ruleSet = {
            appliedDisjunctively: params.disjunctive ?? false,
            rules: params.rules.map((rule) => ({
              column: rule.column,
              relation: rule.relation,
              condition: rule.condition,
            })),
          };
        }

        // For manual collections with products
        if (params.productIds && params.productIds.length > 0) {
          collectionInput.products = params.productIds.map((id) =>
            id.includes("gid://") ? id : toGid("Product", id)
          );
        }

        const data = await client.request<{
          collectionCreate: {
            collection: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(CREATE_COLLECTION, { input: collectionInput });

        if (data.collectionCreate.userErrors.length > 0) {
          throw new Error(
            `Failed to create collection: ${data.collectionCreate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.collectionCreate.collection;
      },
    },
  };
}
