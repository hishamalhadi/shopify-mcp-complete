import { z } from "zod";
import { PaginationSchema, AddressSchema, MetafieldInputSchema } from "./common.js";

// Get customers input
export const GetCustomersInputSchema = PaginationSchema.extend({
  query: z.string().optional().describe("Search query (email, name, etc.)"),
});

// Get customer by ID
export const GetCustomerByIdInputSchema = z.object({
  customerId: z.string().min(1).describe("Shopify customer ID or GID"),
});

// Create customer input
export const CreateCustomerInputSchema = z.object({
  email: z.string().email().optional().describe("Customer email"),
  phone: z.string().optional().describe("Customer phone"),
  firstName: z.string().optional().describe("First name"),
  lastName: z.string().optional().describe("Last name"),
  note: z.string().optional().describe("Customer note"),
  tags: z.array(z.string()).optional().describe("Customer tags"),
  taxExempt: z.boolean().optional().describe("Tax exempt status"),
  addresses: z.array(AddressSchema).optional().describe("Customer addresses"),
  metafields: z.array(MetafieldInputSchema).optional(),
  emailMarketingConsent: z
    .object({
      marketingState: z.enum([
        "NOT_SUBSCRIBED",
        "PENDING",
        "SUBSCRIBED",
        "UNSUBSCRIBED",
      ]),
      consentUpdatedAt: z.string().optional(),
    })
    .optional(),
});

// Update customer input
export const UpdateCustomerInputSchema = z.object({
  customerId: z.string().min(1).describe("Customer ID to update"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  taxExempt: z.boolean().optional(),
  metafields: z.array(MetafieldInputSchema).optional(),
});

// Delete customer input
export const DeleteCustomerInputSchema = z.object({
  customerId: z.string().min(1).describe("Customer ID to delete"),
});

// Get customer orders
export const GetCustomerOrdersInputSchema = PaginationSchema.extend({
  customerId: z.string().min(1).describe("Customer ID"),
});

export type GetCustomersInput = z.infer<typeof GetCustomersInputSchema>;
export type GetCustomerByIdInput = z.infer<typeof GetCustomerByIdInputSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerInputSchema>;
export type DeleteCustomerInput = z.infer<typeof DeleteCustomerInputSchema>;
export type GetCustomerOrdersInput = z.infer<typeof GetCustomerOrdersInputSchema>;
