import { GraphQLClient } from "graphql-request";
import {
  GetProductsInputSchema,
  GetProductByIdInputSchema,
  CreateProductInputSchema,
  UpdateProductInputSchema,
  DeleteProductInputSchema,
  ManageVariantsInputSchema,
  ManageImagesInputSchema,
  ManageMetafieldsInputSchema,
} from "../schemas/products.js";
import {
  GET_PRODUCTS,
  GET_PRODUCT_BY_ID,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  CREATE_PRODUCT_VARIANTS,
  UPDATE_PRODUCT_VARIANTS,
  DELETE_PRODUCT_VARIANTS,
  CREATE_PRODUCT_MEDIA,
  DELETE_PRODUCT_MEDIA,
  SET_METAFIELDS,
  DELETE_METAFIELD,
} from "../graphql/index.js";
import { toGid } from "../client/shopify-client.js";

export function createProductTools(client: GraphQLClient) {
  return {
    "get-products": {
      description:
        "List products from the store with optional search and filters. Returns product details including variants, pricing, and inventory.",
      schema: GetProductsInputSchema,
      handler: async (input: unknown) => {
        const params = GetProductsInputSchema.parse(input);
        const queryParts: string[] = [];

        if (params.searchTitle) {
          queryParts.push(`title:*${params.searchTitle}*`);
        }
        if (params.status) {
          queryParts.push(`status:${params.status}`);
        }
        if (params.vendor) {
          queryParts.push(`vendor:${params.vendor}`);
        }
        if (params.productType) {
          queryParts.push(`product_type:${params.productType}`);
        }

        const variables = {
          first: params.limit,
          query: queryParts.length > 0 ? queryParts.join(" AND ") : null,
          after: params.cursor,
        };

        const data = await client.request<{
          products: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: unknown };
        }>(GET_PRODUCTS, variables);

        return {
          products: data.products.edges.map((edge) => edge.node),
          pageInfo: data.products.pageInfo,
        };
      },
    },

    "get-product-by-id": {
      description:
        "Get detailed information about a specific product by ID, including all variants, images, metafields, and inventory.",
      schema: GetProductByIdInputSchema,
      handler: async (input: unknown) => {
        const params = GetProductByIdInputSchema.parse(input);
        const id = params.productId.includes("gid://")
          ? params.productId
          : toGid("Product", params.productId);

        const data = await client.request<{ product: unknown }>(GET_PRODUCT_BY_ID, { id });
        return data.product;
      },
    },

    "create-product": {
      description:
        "Create a new product with optional variants, metafields, and initial configuration.",
      schema: CreateProductInputSchema,
      handler: async (input: unknown) => {
        const params = CreateProductInputSchema.parse(input);

        const productInput: Record<string, unknown> = {
          title: params.title,
          descriptionHtml: params.descriptionHtml,
          vendor: params.vendor,
          productType: params.productType,
          tags: params.tags,
          status: params.status,
        };

        if (params.variants && params.variants.length > 0) {
          productInput.variants = params.variants.map((v) => ({
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            sku: v.sku,
            barcode: v.barcode,
            weight: v.weight,
            weightUnit: v.weightUnit,
            inventoryPolicy: v.inventoryPolicy,
            requiresShipping: v.requiresShipping,
            taxable: v.taxable,
            options: v.options,
          }));
        }

        if (params.metafields && params.metafields.length > 0) {
          productInput.metafields = params.metafields.map((m) => ({
            namespace: m.namespace,
            key: m.key,
            value: m.value,
            type: m.type,
          }));
        }

        const data = await client.request<{
          productCreate: { product: unknown; userErrors: Array<{ field: string; message: string }> };
        }>(CREATE_PRODUCT, { input: productInput });

        if (data.productCreate.userErrors.length > 0) {
          throw new Error(
            `Failed to create product: ${data.productCreate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.productCreate.product;
      },
    },

    "update-product": {
      description: "Update an existing product's title, description, vendor, type, tags, or status.",
      schema: UpdateProductInputSchema,
      handler: async (input: unknown) => {
        const params = UpdateProductInputSchema.parse(input);
        const id = params.productId.includes("gid://")
          ? params.productId
          : toGid("Product", params.productId);

        const productInput: Record<string, unknown> = { id };

        if (params.title !== undefined) productInput.title = params.title;
        if (params.descriptionHtml !== undefined) productInput.descriptionHtml = params.descriptionHtml;
        if (params.vendor !== undefined) productInput.vendor = params.vendor;
        if (params.productType !== undefined) productInput.productType = params.productType;
        if (params.tags !== undefined) productInput.tags = params.tags;
        if (params.status !== undefined) productInput.status = params.status;

        const data = await client.request<{
          productUpdate: { product: unknown; userErrors: Array<{ field: string; message: string }> };
        }>(UPDATE_PRODUCT, { input: productInput });

        if (data.productUpdate.userErrors.length > 0) {
          throw new Error(
            `Failed to update product: ${data.productUpdate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.productUpdate.product;
      },
    },

    "delete-product": {
      description: "Permanently delete a product from the store. This cannot be undone.",
      schema: DeleteProductInputSchema,
      handler: async (input: unknown) => {
        const params = DeleteProductInputSchema.parse(input);
        const id = params.productId.includes("gid://")
          ? params.productId
          : toGid("Product", params.productId);

        const data = await client.request<{
          productDelete: {
            deletedProductId: string;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(DELETE_PRODUCT, { input: { id } });

        if (data.productDelete.userErrors.length > 0) {
          throw new Error(
            `Failed to delete product: ${data.productDelete.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return { success: true, deletedProductId: data.productDelete.deletedProductId };
      },
    },

    "manage-variants": {
      description:
        "Create, update, or delete product variants. Can bulk create new variants, update existing ones, or remove variants.",
      schema: ManageVariantsInputSchema,
      handler: async (input: unknown) => {
        const params = ManageVariantsInputSchema.parse(input);
        const productId = params.productId.includes("gid://")
          ? params.productId
          : toGid("Product", params.productId);

        const results: Record<string, unknown> = {};

        // Create variants
        if (params.variantsToCreate && params.variantsToCreate.length > 0) {
          const createData = await client.request<{
            productVariantsBulkCreate: {
              productVariants: unknown[];
              userErrors: Array<{ field: string; message: string }>;
            };
          }>(CREATE_PRODUCT_VARIANTS, {
            productId,
            variants: params.variantsToCreate.map((v) => ({
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              sku: v.sku,
              barcode: v.barcode,
              optionValues: v.options
                ? v.options.map((opt, idx) => ({ optionName: `Option ${idx + 1}`, name: opt }))
                : undefined,
            })),
          });

          if (createData.productVariantsBulkCreate.userErrors.length > 0) {
            throw new Error(
              `Failed to create variants: ${createData.productVariantsBulkCreate.userErrors.map((e) => e.message).join(", ")}`
            );
          }
          results.created = createData.productVariantsBulkCreate.productVariants;
        }

        // Update variants
        if (params.variantsToUpdate && params.variantsToUpdate.length > 0) {
          const updateData = await client.request<{
            productVariantsBulkUpdate: {
              productVariants: unknown[];
              userErrors: Array<{ field: string; message: string }>;
            };
          }>(UPDATE_PRODUCT_VARIANTS, {
            productId,
            variants: params.variantsToUpdate.map((v) => ({
              id: v.variantId.includes("gid://") ? v.variantId : toGid("ProductVariant", v.variantId),
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              sku: v.sku,
              barcode: v.barcode,
            })),
          });

          if (updateData.productVariantsBulkUpdate.userErrors.length > 0) {
            throw new Error(
              `Failed to update variants: ${updateData.productVariantsBulkUpdate.userErrors.map((e) => e.message).join(", ")}`
            );
          }
          results.updated = updateData.productVariantsBulkUpdate.productVariants;
        }

        // Delete variants
        if (params.variantsToDelete && params.variantsToDelete.length > 0) {
          const deleteData = await client.request<{
            productVariantsBulkDelete: {
              product: unknown;
              userErrors: Array<{ field: string; message: string }>;
            };
          }>(DELETE_PRODUCT_VARIANTS, {
            productId,
            variantsIds: params.variantsToDelete.map((id) =>
              id.includes("gid://") ? id : toGid("ProductVariant", id)
            ),
          });

          if (deleteData.productVariantsBulkDelete.userErrors.length > 0) {
            throw new Error(
              `Failed to delete variants: ${deleteData.productVariantsBulkDelete.userErrors.map((e) => e.message).join(", ")}`
            );
          }
          results.deleted = params.variantsToDelete;
        }

        return results;
      },
    },

    "manage-images": {
      description: "Add or remove images from a product. Provide image URLs to add or image IDs to remove.",
      schema: ManageImagesInputSchema,
      handler: async (input: unknown) => {
        const params = ManageImagesInputSchema.parse(input);
        const productId = params.productId.includes("gid://")
          ? params.productId
          : toGid("Product", params.productId);

        const results: Record<string, unknown> = {};

        // Add images
        if (params.imagesToAdd && params.imagesToAdd.length > 0) {
          const createData = await client.request<{
            productCreateMedia: {
              media: unknown[];
              mediaUserErrors: Array<{ field: string; message: string }>;
            };
          }>(CREATE_PRODUCT_MEDIA, {
            productId,
            media: params.imagesToAdd.map((img) => ({
              originalSource: img.src,
              alt: img.altText,
              mediaContentType: "IMAGE",
            })),
          });

          if (createData.productCreateMedia.mediaUserErrors.length > 0) {
            throw new Error(
              `Failed to add images: ${createData.productCreateMedia.mediaUserErrors.map((e) => e.message).join(", ")}`
            );
          }
          results.added = createData.productCreateMedia.media;
        }

        // Delete images
        if (params.imagesToDelete && params.imagesToDelete.length > 0) {
          const deleteData = await client.request<{
            productDeleteMedia: {
              deletedMediaIds: string[];
              mediaUserErrors: Array<{ field: string; message: string }>;
            };
          }>(DELETE_PRODUCT_MEDIA, {
            productId,
            mediaIds: params.imagesToDelete.map((id) =>
              id.includes("gid://") ? id : toGid("MediaImage", id)
            ),
          });

          if (deleteData.productDeleteMedia.mediaUserErrors.length > 0) {
            throw new Error(
              `Failed to delete images: ${deleteData.productDeleteMedia.mediaUserErrors.map((e) => e.message).join(", ")}`
            );
          }
          results.deleted = deleteData.productDeleteMedia.deletedMediaIds;
        }

        return results;
      },
    },

    "manage-metafields": {
      description:
        "Set or delete metafields on any resource (product, variant, customer, order, etc.). Use this to manage custom data.",
      schema: ManageMetafieldsInputSchema,
      handler: async (input: unknown) => {
        const params = ManageMetafieldsInputSchema.parse(input);
        const results: Record<string, unknown> = {};

        // Set metafields
        if (params.metafieldsToSet && params.metafieldsToSet.length > 0) {
          const setData = await client.request<{
            metafieldsSet: {
              metafields: unknown[];
              userErrors: Array<{ field: string; message: string }>;
            };
          }>(SET_METAFIELDS, {
            metafields: params.metafieldsToSet.map((m) => ({
              ownerId: params.ownerId.includes("gid://") ? params.ownerId : toGid("Product", params.ownerId),
              namespace: m.namespace,
              key: m.key,
              value: m.value,
              type: m.type,
            })),
          });

          if (setData.metafieldsSet.userErrors.length > 0) {
            throw new Error(
              `Failed to set metafields: ${setData.metafieldsSet.userErrors.map((e) => e.message).join(", ")}`
            );
          }
          results.set = setData.metafieldsSet.metafields;
        }

        // Delete metafields
        if (params.metafieldIdsToDelete && params.metafieldIdsToDelete.length > 0) {
          const deleteResults = [];
          for (const metafieldId of params.metafieldIdsToDelete) {
            const id = metafieldId.includes("gid://") ? metafieldId : toGid("Metafield", metafieldId);
            const deleteData = await client.request<{
              metafieldDelete: {
                deletedId: string;
                userErrors: Array<{ field: string; message: string }>;
              };
            }>(DELETE_METAFIELD, { input: { id } });

            if (deleteData.metafieldDelete.userErrors.length > 0) {
              throw new Error(
                `Failed to delete metafield: ${deleteData.metafieldDelete.userErrors.map((e) => e.message).join(", ")}`
              );
            }
            deleteResults.push(deleteData.metafieldDelete.deletedId);
          }
          results.deleted = deleteResults;
        }

        return results;
      },
    },
  };
}
