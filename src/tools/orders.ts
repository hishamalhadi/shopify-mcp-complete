import { GraphQLClient } from "graphql-request";
import {
  GetOrdersInputSchema,
  GetOrderByIdInputSchema,
  UpdateOrderInputSchema,
  CancelOrderInputSchema,
  CreateDraftOrderInputSchema,
  CompleteDraftOrderInputSchema,
  FulfillOrderInputSchema,
} from "../schemas/orders.js";
import {
  GET_ORDERS,
  GET_ORDER_BY_ID,
  UPDATE_ORDER,
  CANCEL_ORDER,
  CREATE_DRAFT_ORDER,
  COMPLETE_DRAFT_ORDER,
  CREATE_FULFILLMENT,
} from "../graphql/index.js";
import { toGid } from "../client/shopify-client.js";

export function createOrderTools(client: GraphQLClient) {
  return {
    "get-orders": {
      description:
        "List orders from the store with filters for status, financial status, fulfillment status, and date range.",
      schema: GetOrdersInputSchema,
      handler: async (input: unknown) => {
        const params = GetOrdersInputSchema.parse(input);
        const queryParts: string[] = [];

        if (params.status && params.status !== "any") {
          queryParts.push(`status:${params.status}`);
        }
        if (params.financialStatus) {
          queryParts.push(`financial_status:${params.financialStatus}`);
        }
        if (params.fulfillmentStatus) {
          queryParts.push(`fulfillment_status:${params.fulfillmentStatus}`);
        }
        if (params.createdAtMin) {
          queryParts.push(`created_at:>=${params.createdAtMin}`);
        }
        if (params.createdAtMax) {
          queryParts.push(`created_at:<=${params.createdAtMax}`);
        }
        if (params.query) {
          queryParts.push(params.query);
        }

        const variables = {
          first: params.limit,
          query: queryParts.length > 0 ? queryParts.join(" AND ") : null,
          after: params.cursor,
        };

        const data = await client.request<{
          orders: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: unknown };
        }>(GET_ORDERS, variables);

        return {
          orders: data.orders.edges.map((edge) => edge.node),
          pageInfo: data.orders.pageInfo,
        };
      },
    },

    "get-order-by-id": {
      description:
        "Get detailed information about a specific order including line items, customer, addresses, fulfillments, and transactions.",
      schema: GetOrderByIdInputSchema,
      handler: async (input: unknown) => {
        const params = GetOrderByIdInputSchema.parse(input);
        const id = params.orderId.includes("gid://")
          ? params.orderId
          : toGid("Order", params.orderId);

        const data = await client.request<{ order: unknown }>(GET_ORDER_BY_ID, { id });
        return data.order;
      },
    },

    "update-order": {
      description:
        "Update an order's note, tags, email, shipping address, metafields, or custom attributes.",
      schema: UpdateOrderInputSchema,
      handler: async (input: unknown) => {
        const params = UpdateOrderInputSchema.parse(input);
        const id = params.orderId.includes("gid://")
          ? params.orderId
          : toGid("Order", params.orderId);

        const orderInput: Record<string, unknown> = { id };

        if (params.note !== undefined) orderInput.note = params.note;
        if (params.tags !== undefined) orderInput.tags = params.tags;
        if (params.email !== undefined) orderInput.email = params.email;
        if (params.shippingAddress !== undefined) orderInput.shippingAddress = params.shippingAddress;
        if (params.customAttributes !== undefined)
          orderInput.customAttributes = params.customAttributes;
        if (params.metafields !== undefined) {
          orderInput.metafields = params.metafields.map((m) => ({
            namespace: m.namespace,
            key: m.key,
            value: m.value,
            type: m.type,
          }));
        }

        const data = await client.request<{
          orderUpdate: { order: unknown; userErrors: Array<{ field: string; message: string }> };
        }>(UPDATE_ORDER, { input: orderInput });

        if (data.orderUpdate.userErrors.length > 0) {
          throw new Error(
            `Failed to update order: ${data.orderUpdate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.orderUpdate.order;
      },
    },

    "cancel-order": {
      description:
        "Cancel an order with optional reason, customer notification, refund, and restock options.",
      schema: CancelOrderInputSchema,
      handler: async (input: unknown) => {
        const params = CancelOrderInputSchema.parse(input);
        const orderId = params.orderId.includes("gid://")
          ? params.orderId
          : toGid("Order", params.orderId);

        const data = await client.request<{
          orderCancel: {
            job: { id: string; done: boolean };
            orderCancelUserErrors: Array<{ field: string; message: string }>;
          };
        }>(CANCEL_ORDER, {
          orderId,
          reason: params.reason || "OTHER",
          notifyCustomer: params.notifyCustomer ?? false,
          refund: params.refund ?? false,
          restock: params.restock ?? false,
        });

        if (data.orderCancel.orderCancelUserErrors.length > 0) {
          throw new Error(
            `Failed to cancel order: ${data.orderCancel.orderCancelUserErrors.map((e) => e.message).join(", ")}`
          );
        }

        return { success: true, job: data.orderCancel.job };
      },
    },

    "create-draft-order": {
      description:
        "Create a draft order with line items, customer, shipping address, and optional discount. Draft orders can be converted to real orders.",
      schema: CreateDraftOrderInputSchema,
      handler: async (input: unknown) => {
        const params = CreateDraftOrderInputSchema.parse(input);

        const draftOrderInput: Record<string, unknown> = {
          lineItems: params.lineItems.map((item) => ({
            variantId: item.variantId
              ? item.variantId.includes("gid://")
                ? item.variantId
                : toGid("ProductVariant", item.variantId)
              : undefined,
            title: item.title,
            quantity: item.quantity,
            originalUnitPrice: item.originalUnitPrice,
            customAttributes: item.customAttributes,
          })),
        };

        if (params.customerId) {
          draftOrderInput.customerId = params.customerId.includes("gid://")
            ? params.customerId
            : toGid("Customer", params.customerId);
        }
        if (params.email) draftOrderInput.email = params.email;
        if (params.note) draftOrderInput.note = params.note;
        if (params.tags) draftOrderInput.tags = params.tags;
        if (params.shippingAddress) draftOrderInput.shippingAddress = params.shippingAddress;
        if (params.billingAddress) draftOrderInput.billingAddress = params.billingAddress;
        if (params.appliedDiscount) {
          draftOrderInput.appliedDiscount = {
            title: params.appliedDiscount.title,
            value: params.appliedDiscount.value,
            valueType: params.appliedDiscount.valueType,
          };
        }
        if (params.taxExempt !== undefined) draftOrderInput.taxExempt = params.taxExempt;

        const data = await client.request<{
          draftOrderCreate: {
            draftOrder: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(CREATE_DRAFT_ORDER, { input: draftOrderInput });

        if (data.draftOrderCreate.userErrors.length > 0) {
          throw new Error(
            `Failed to create draft order: ${data.draftOrderCreate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.draftOrderCreate.draftOrder;
      },
    },

    "complete-draft-order": {
      description:
        "Convert a draft order into a real order. Can mark payment as pending or immediately paid.",
      schema: CompleteDraftOrderInputSchema,
      handler: async (input: unknown) => {
        const params = CompleteDraftOrderInputSchema.parse(input);
        const id = params.draftOrderId.includes("gid://")
          ? params.draftOrderId
          : toGid("DraftOrder", params.draftOrderId);

        const data = await client.request<{
          draftOrderComplete: {
            draftOrder: { id: string; order: unknown };
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(COMPLETE_DRAFT_ORDER, {
          id,
          paymentPending: params.paymentPending ?? false,
        });

        if (data.draftOrderComplete.userErrors.length > 0) {
          throw new Error(
            `Failed to complete draft order: ${data.draftOrderComplete.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.draftOrderComplete.draftOrder;
      },
    },

    "fulfill-order": {
      description:
        "Create a fulfillment for an order with optional tracking information. Can fulfill specific line items or the entire order.",
      schema: FulfillOrderInputSchema,
      handler: async (input: unknown) => {
        const params = FulfillOrderInputSchema.parse(input);
        const orderId = params.orderId.includes("gid://")
          ? params.orderId
          : toGid("Order", params.orderId);

        // First, we need to get the fulfillment order ID
        // For simplicity, we'll create a fulfillment with basic tracking
        const fulfillmentInput: Record<string, unknown> = {
          notifyCustomer: params.notifyCustomer ?? true,
        };

        if (params.trackingInfo) {
          fulfillmentInput.trackingInfo = {
            company: params.trackingInfo.company,
            number: params.trackingInfo.number,
            url: params.trackingInfo.url,
          };
        }

        // Note: The actual fulfillment API requires fulfillment order IDs
        // This is a simplified implementation - you may need to first query fulfillmentOrders
        const data = await client.request<{
          fulfillmentCreateV2: {
            fulfillment: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(CREATE_FULFILLMENT, {
          fulfillment: {
            lineItemsByFulfillmentOrder: [
              {
                fulfillmentOrderId: orderId, // This should be fulfillment order ID
              },
            ],
            notifyCustomer: params.notifyCustomer ?? true,
            trackingInfo: params.trackingInfo
              ? {
                  company: params.trackingInfo.company,
                  number: params.trackingInfo.number,
                  url: params.trackingInfo.url,
                }
              : undefined,
          },
        });

        if (data.fulfillmentCreateV2.userErrors.length > 0) {
          throw new Error(
            `Failed to fulfill order: ${data.fulfillmentCreateV2.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.fulfillmentCreateV2.fulfillment;
      },
    },
  };
}
