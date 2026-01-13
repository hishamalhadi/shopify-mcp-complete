import { z } from "zod";
import {
  PaginationSchema,
  OrderStatusSchema,
  FinancialStatusSchema,
  FulfillmentStatusSchema,
  AddressSchema,
  MetafieldInputSchema,
} from "./common.js";

// Get orders input
export const GetOrdersInputSchema = PaginationSchema.extend({
  status: OrderStatusSchema.optional().describe("Filter by order status"),
  financialStatus: FinancialStatusSchema.optional(),
  fulfillmentStatus: FulfillmentStatusSchema.optional(),
  createdAtMin: z.string().optional().describe("Created after (ISO 8601)"),
  createdAtMax: z.string().optional().describe("Created before (ISO 8601)"),
  query: z.string().optional().describe("Search query"),
});

// Get order by ID
export const GetOrderByIdInputSchema = z.object({
  orderId: z.string().min(1).describe("Shopify order ID or GID"),
});

// Update order input
export const UpdateOrderInputSchema = z.object({
  orderId: z.string().min(1).describe("Order ID to update"),
  note: z.string().optional().describe("Order note"),
  tags: z.array(z.string()).optional().describe("Order tags"),
  email: z.string().email().optional().describe("Customer email"),
  shippingAddress: AddressSchema.optional().describe("Shipping address"),
  metafields: z.array(MetafieldInputSchema).optional(),
  customAttributes: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
});

// Cancel order input
export const CancelOrderInputSchema = z.object({
  orderId: z.string().min(1).describe("Order ID to cancel"),
  reason: z
    .enum(["CUSTOMER", "FRAUD", "INVENTORY", "DECLINED", "OTHER"])
    .optional()
    .describe("Cancellation reason"),
  notifyCustomer: z.boolean().optional().default(false),
  refund: z.boolean().optional().default(false),
  restock: z.boolean().optional().default(false),
});

// Draft order line item
const DraftOrderLineItemSchema = z.object({
  variantId: z.string().optional(),
  title: z.string().optional(),
  quantity: z.number().min(1),
  originalUnitPrice: z.string().optional(),
  customAttributes: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
});

// Create draft order input
export const CreateDraftOrderInputSchema = z.object({
  lineItems: z.array(DraftOrderLineItemSchema).min(1),
  customerId: z.string().optional().describe("Customer ID"),
  email: z.string().email().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  shippingAddress: AddressSchema.optional(),
  billingAddress: AddressSchema.optional(),
  appliedDiscount: z
    .object({
      title: z.string().optional(),
      value: z.number(),
      valueType: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
    })
    .optional(),
  taxExempt: z.boolean().optional(),
});

// Complete draft order input
export const CompleteDraftOrderInputSchema = z.object({
  draftOrderId: z.string().min(1).describe("Draft order ID"),
  paymentPending: z.boolean().optional().default(false),
});

// Fulfill order input
export const FulfillOrderInputSchema = z.object({
  orderId: z.string().min(1).describe("Order ID to fulfill"),
  lineItemIds: z.array(z.string()).optional().describe("Specific line items to fulfill"),
  trackingInfo: z
    .object({
      company: z.string().optional(),
      number: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  notifyCustomer: z.boolean().optional().default(true),
  locationId: z.string().optional().describe("Fulfillment location ID"),
});

export type GetOrdersInput = z.infer<typeof GetOrdersInputSchema>;
export type GetOrderByIdInput = z.infer<typeof GetOrderByIdInputSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderInputSchema>;
export type CreateDraftOrderInput = z.infer<typeof CreateDraftOrderInputSchema>;
export type CompleteDraftOrderInput = z.infer<typeof CompleteDraftOrderInputSchema>;
export type FulfillOrderInput = z.infer<typeof FulfillOrderInputSchema>;
