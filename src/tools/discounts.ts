import { GraphQLClient } from "graphql-request";
import {
  CreateDiscountInputSchema,
  GetDiscountsInputSchema,
  UpdateDiscountInputSchema,
  DeleteDiscountInputSchema,
} from "../schemas/discounts.js";
import {
  GET_DISCOUNTS,
  CREATE_DISCOUNT_CODE,
  UPDATE_DISCOUNT_CODE,
  DELETE_DISCOUNT_CODE,
} from "../graphql/index.js";
import { toGid } from "../client/shopify-client.js";

export function createDiscountTools(client: GraphQLClient) {
  return {
    "create-discount": {
      description:
        "Create a new discount code with specified value (percentage or fixed amount), usage limits, date range, and product applicability.",
      schema: CreateDiscountInputSchema,
      handler: async (input: unknown) => {
        const params = CreateDiscountInputSchema.parse(input);

        const discountInput: Record<string, unknown> = {
          title: params.title,
          code: params.code,
          startsAt: params.startsAt || new Date().toISOString(),
          endsAt: params.endsAt,
          usageLimit: params.usageLimit,
          appliesOncePerCustomer: params.oncePerCustomer ?? true,
          customerSelection: {
            all: true,
          },
          customerGets: {
            value:
              params.valueType === "PERCENTAGE"
                ? { percentage: params.value / 100 }
                : {
                    discountAmount: {
                      amount: params.value,
                      appliesOnEachItem: false,
                    },
                  },
            items:
              params.appliesTo?.type === "ALL"
                ? { all: true }
                : params.appliesTo?.type === "PRODUCTS"
                  ? {
                      products: {
                        productsToAdd: params.appliesTo.ids?.map((id) =>
                          id.includes("gid://") ? id : toGid("Product", id)
                        ),
                      },
                    }
                  : params.appliesTo?.type === "COLLECTIONS"
                    ? {
                        collections: {
                          add: params.appliesTo.ids?.map((id) =>
                            id.includes("gid://") ? id : toGid("Collection", id)
                          ),
                        },
                      }
                    : { all: true },
          },
        };

        if (params.minimumRequirement) {
          discountInput.minimumRequirement =
            params.minimumRequirement.type === "SUBTOTAL"
              ? {
                  subtotal: {
                    greaterThanOrEqualToSubtotal: params.minimumRequirement.value,
                  },
                }
              : {
                  quantity: {
                    greaterThanOrEqualToQuantity: params.minimumRequirement.value,
                  },
                };
        }

        const data = await client.request<{
          discountCodeBasicCreate: {
            codeDiscountNode: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(CREATE_DISCOUNT_CODE, { basicCodeDiscount: discountInput });

        if (data.discountCodeBasicCreate.userErrors.length > 0) {
          throw new Error(
            `Failed to create discount: ${data.discountCodeBasicCreate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.discountCodeBasicCreate.codeDiscountNode;
      },
    },

    "get-discounts": {
      description:
        "List discount codes with optional search and status filter. Returns discount details including codes, values, and usage counts.",
      schema: GetDiscountsInputSchema,
      handler: async (input: unknown) => {
        const params = GetDiscountsInputSchema.parse(input);
        const queryParts: string[] = [];

        if (params.query) {
          queryParts.push(params.query);
        }
        if (params.status) {
          queryParts.push(`status:${params.status}`);
        }

        const variables = {
          first: params.limit,
          query: queryParts.length > 0 ? queryParts.join(" AND ") : null,
          after: params.cursor,
        };

        const data = await client.request<{
          codeDiscountNodes: {
            edges: Array<{ node: unknown; cursor: string }>;
            pageInfo: unknown;
          };
        }>(GET_DISCOUNTS, variables);

        return {
          discounts: data.codeDiscountNodes.edges.map((edge) => edge.node),
          pageInfo: data.codeDiscountNodes.pageInfo,
        };
      },
    },

    "update-discount": {
      description: "Update an existing discount code's title, code, value, dates, or usage limit.",
      schema: UpdateDiscountInputSchema,
      handler: async (input: unknown) => {
        const params = UpdateDiscountInputSchema.parse(input);
        const id = params.discountId.includes("gid://")
          ? params.discountId
          : toGid("DiscountCodeNode", params.discountId);

        const discountInput: Record<string, unknown> = {};

        if (params.title !== undefined) discountInput.title = params.title;
        if (params.code !== undefined) discountInput.code = params.code;
        if (params.startsAt !== undefined) discountInput.startsAt = params.startsAt;
        if (params.endsAt !== undefined) discountInput.endsAt = params.endsAt;
        if (params.usageLimit !== undefined) discountInput.usageLimit = params.usageLimit;
        if (params.valueType !== undefined && params.value !== undefined) {
          discountInput.customerGets = {
            value:
              params.valueType === "PERCENTAGE"
                ? { percentage: params.value / 100 }
                : {
                    discountAmount: {
                      amount: params.value,
                      appliesOnEachItem: false,
                    },
                  },
          };
        }

        const data = await client.request<{
          discountCodeBasicUpdate: {
            codeDiscountNode: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(UPDATE_DISCOUNT_CODE, { id, basicCodeDiscount: discountInput });

        if (data.discountCodeBasicUpdate.userErrors.length > 0) {
          throw new Error(
            `Failed to update discount: ${data.discountCodeBasicUpdate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.discountCodeBasicUpdate.codeDiscountNode;
      },
    },

    "delete-discount": {
      description: "Delete a discount code. This cannot be undone.",
      schema: DeleteDiscountInputSchema,
      handler: async (input: unknown) => {
        const params = DeleteDiscountInputSchema.parse(input);
        const id = params.discountId.includes("gid://")
          ? params.discountId
          : toGid("DiscountCodeNode", params.discountId);

        const data = await client.request<{
          discountCodeDelete: {
            deletedCodeDiscountId: string;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(DELETE_DISCOUNT_CODE, { id });

        if (data.discountCodeDelete.userErrors.length > 0) {
          throw new Error(
            `Failed to delete discount: ${data.discountCodeDelete.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          success: true,
          deletedDiscountId: data.discountCodeDelete.deletedCodeDiscountId,
        };
      },
    },
  };
}
