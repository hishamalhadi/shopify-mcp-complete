import { z } from "zod";

// Pagination
export const PaginationSchema = z.object({
  limit: z.number().min(1).max(250).default(10),
  cursor: z.string().optional(),
});

// Money
export const MoneySchema = z.object({
  amount: z.string(),
  currencyCode: z.string(),
});

// Address
export const AddressSchema = z.object({
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  province: z.string().optional(),
  provinceCode: z.string().optional(),
  zip: z.string().optional(),
});

// Metafield input
export const MetafieldInputSchema = z.object({
  namespace: z.string(),
  key: z.string(),
  value: z.string(),
  type: z.string(),
});

// Weight units
export const WeightUnitSchema = z.enum([
  "KILOGRAMS",
  "GRAMS",
  "POUNDS",
  "OUNCES",
]);

// Product status
export const ProductStatusSchema = z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]);

// Order status
export const OrderStatusSchema = z.enum([
  "any",
  "open",
  "closed",
  "cancelled",
]);

// Financial status
export const FinancialStatusSchema = z.enum([
  "authorized",
  "paid",
  "partially_paid",
  "partially_refunded",
  "pending",
  "refunded",
  "voided",
]);

// Fulfillment status
export const FulfillmentStatusSchema = z.enum([
  "fulfilled",
  "partial",
  "unfulfilled",
  "restocked",
]);
