import { GraphQLClient } from "graphql-request";
import {
  GetCustomersInputSchema,
  GetCustomerByIdInputSchema,
  CreateCustomerInputSchema,
  UpdateCustomerInputSchema,
  DeleteCustomerInputSchema,
  GetCustomerOrdersInputSchema,
} from "../schemas/customers.js";
import {
  GET_CUSTOMERS,
  GET_CUSTOMER_BY_ID,
  GET_CUSTOMER_ORDERS,
  CREATE_CUSTOMER,
  UPDATE_CUSTOMER,
  DELETE_CUSTOMER,
} from "../graphql/index.js";
import { toGid } from "../client/shopify-client.js";

export function createCustomerTools(client: GraphQLClient) {
  return {
    "get-customers": {
      description:
        "List customers from the store with optional search query. Returns customer details including order count and total spent.",
      schema: GetCustomersInputSchema,
      handler: async (input: unknown) => {
        const params = GetCustomersInputSchema.parse(input);

        const variables = {
          first: params.limit,
          query: params.query || null,
          after: params.cursor,
        };

        const data = await client.request<{
          customers: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: unknown };
        }>(GET_CUSTOMERS, variables);

        return {
          customers: data.customers.edges.map((edge) => edge.node),
          pageInfo: data.customers.pageInfo,
        };
      },
    },

    "get-customer-by-id": {
      description:
        "Get detailed information about a specific customer including addresses, marketing consent, and metafields.",
      schema: GetCustomerByIdInputSchema,
      handler: async (input: unknown) => {
        const params = GetCustomerByIdInputSchema.parse(input);
        const id = params.customerId.includes("gid://")
          ? params.customerId
          : toGid("Customer", params.customerId);

        const data = await client.request<{ customer: unknown }>(GET_CUSTOMER_BY_ID, { id });
        return data.customer;
      },
    },

    "create-customer": {
      description:
        "Create a new customer with email, phone, name, addresses, and optional marketing consent.",
      schema: CreateCustomerInputSchema,
      handler: async (input: unknown) => {
        const params = CreateCustomerInputSchema.parse(input);

        const customerInput: Record<string, unknown> = {};

        if (params.email) customerInput.email = params.email;
        if (params.phone) customerInput.phone = params.phone;
        if (params.firstName) customerInput.firstName = params.firstName;
        if (params.lastName) customerInput.lastName = params.lastName;
        if (params.note) customerInput.note = params.note;
        if (params.tags) customerInput.tags = params.tags;
        if (params.taxExempt !== undefined) customerInput.taxExempt = params.taxExempt;
        if (params.addresses) customerInput.addresses = params.addresses;
        if (params.emailMarketingConsent) {
          customerInput.emailMarketingConsent = params.emailMarketingConsent;
        }
        if (params.metafields) {
          customerInput.metafields = params.metafields.map((m) => ({
            namespace: m.namespace,
            key: m.key,
            value: m.value,
            type: m.type,
          }));
        }

        const data = await client.request<{
          customerCreate: {
            customer: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(CREATE_CUSTOMER, { input: customerInput });

        if (data.customerCreate.userErrors.length > 0) {
          throw new Error(
            `Failed to create customer: ${data.customerCreate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.customerCreate.customer;
      },
    },

    "update-customer": {
      description:
        "Update an existing customer's email, phone, name, note, tags, or tax exempt status.",
      schema: UpdateCustomerInputSchema,
      handler: async (input: unknown) => {
        const params = UpdateCustomerInputSchema.parse(input);
        const id = params.customerId.includes("gid://")
          ? params.customerId
          : toGid("Customer", params.customerId);

        const customerInput: Record<string, unknown> = { id };

        if (params.email !== undefined) customerInput.email = params.email;
        if (params.phone !== undefined) customerInput.phone = params.phone;
        if (params.firstName !== undefined) customerInput.firstName = params.firstName;
        if (params.lastName !== undefined) customerInput.lastName = params.lastName;
        if (params.note !== undefined) customerInput.note = params.note;
        if (params.tags !== undefined) customerInput.tags = params.tags;
        if (params.taxExempt !== undefined) customerInput.taxExempt = params.taxExempt;
        if (params.metafields) {
          customerInput.metafields = params.metafields.map((m) => ({
            namespace: m.namespace,
            key: m.key,
            value: m.value,
            type: m.type,
          }));
        }

        const data = await client.request<{
          customerUpdate: {
            customer: unknown;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(UPDATE_CUSTOMER, { input: customerInput });

        if (data.customerUpdate.userErrors.length > 0) {
          throw new Error(
            `Failed to update customer: ${data.customerUpdate.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return data.customerUpdate.customer;
      },
    },

    "delete-customer": {
      description:
        "Permanently delete a customer from the store. This cannot be undone.",
      schema: DeleteCustomerInputSchema,
      handler: async (input: unknown) => {
        const params = DeleteCustomerInputSchema.parse(input);
        const id = params.customerId.includes("gid://")
          ? params.customerId
          : toGid("Customer", params.customerId);

        const data = await client.request<{
          customerDelete: {
            deletedCustomerId: string;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(DELETE_CUSTOMER, { input: { id } });

        if (data.customerDelete.userErrors.length > 0) {
          throw new Error(
            `Failed to delete customer: ${data.customerDelete.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return { success: true, deletedCustomerId: data.customerDelete.deletedCustomerId };
      },
    },

    "get-customer-orders": {
      description: "Get order history for a specific customer with pagination support.",
      schema: GetCustomerOrdersInputSchema,
      handler: async (input: unknown) => {
        const params = GetCustomerOrdersInputSchema.parse(input);
        const customerId = params.customerId.includes("gid://")
          ? params.customerId
          : toGid("Customer", params.customerId);

        const data = await client.request<{
          customer: {
            orders: { edges: Array<{ node: unknown }>; pageInfo: unknown };
          };
        }>(GET_CUSTOMER_ORDERS, {
          customerId,
          first: params.limit,
          after: params.cursor,
        });

        return {
          orders: data.customer?.orders?.edges?.map((edge) => edge.node) || [],
          pageInfo: data.customer?.orders?.pageInfo,
        };
      },
    },
  };
}
