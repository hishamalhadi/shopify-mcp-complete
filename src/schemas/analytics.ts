import { z } from "zod";

// ShopifyQL query input
export const ShopifyQLQueryInputSchema = z.object({
  query: z.string().min(1).describe("ShopifyQL query string"),
});

// Sales report input
export const SalesReportInputSchema = z.object({
  period: z
    .enum([
      "today",
      "yesterday",
      "last_7_days",
      "last_30_days",
      "last_90_days",
      "this_month",
      "last_month",
      "this_year",
      "last_year",
    ])
    .default("last_30_days")
    .describe("Time period for the report"),
  groupBy: z
    .enum(["day", "week", "month", "quarter", "year", "product", "vendor", "channel"])
    .optional()
    .describe("Group results by"),
});

// Customer segments input
export const CustomerSegmentsInputSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
});

// Product performance input
export const ProductPerformanceInputSchema = z.object({
  period: z
    .enum([
      "last_7_days",
      "last_30_days",
      "last_90_days",
      "this_month",
      "last_month",
      "this_year",
    ])
    .default("last_30_days"),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z
    .enum(["total_sales", "quantity_sold", "revenue"])
    .default("total_sales"),
});

// Predefined ShopifyQL queries
export const ANALYTICS_QUERIES = {
  // Sales queries
  monthlySales:
    "FROM sales SHOW total_sales, net_sales, orders_count GROUP BY month SINCE startOfYear(0y) ORDER BY month",
  dailySales:
    "FROM sales SHOW total_sales, orders_count GROUP BY day DURING last_7_days ORDER BY day",
  salesByProduct:
    "FROM sales SHOW product_title, total_sales, quantity GROUP BY product_title ORDER BY total_sales DESC LIMIT 20",
  salesByVendor:
    "FROM sales SHOW vendor, total_sales, net_sales GROUP BY vendor ORDER BY total_sales DESC",
  salesByChannel:
    "FROM sales SHOW channel, total_sales, orders_count GROUP BY channel ORDER BY total_sales DESC",

  // Customer queries
  topCustomers:
    "FROM sales SHOW customer_email, total_sales, orders_count GROUP BY customer_email ORDER BY total_sales DESC LIMIT 20",
  newVsReturning:
    "FROM sales SHOW customer_type, total_sales, orders_count GROUP BY customer_type",

  // Product queries
  topProducts:
    "FROM sales SHOW product_title, quantity, total_sales GROUP BY product_title ORDER BY quantity DESC LIMIT 20",
  productPerformance:
    "FROM sales SHOW product_title, variant_title, quantity, total_sales GROUP BY product_title, variant_title ORDER BY total_sales DESC LIMIT 50",

  // Time-based
  hourlyDistribution:
    "FROM sales SHOW total_sales, orders_count GROUP BY hour DURING last_30_days",
  weekdayDistribution:
    "FROM sales SHOW total_sales, orders_count GROUP BY day_of_week DURING last_30_days",
} as const;

export type ShopifyQLQueryInput = z.infer<typeof ShopifyQLQueryInputSchema>;
export type SalesReportInput = z.infer<typeof SalesReportInputSchema>;
export type CustomerSegmentsInput = z.infer<typeof CustomerSegmentsInputSchema>;
export type ProductPerformanceInput = z.infer<typeof ProductPerformanceInputSchema>;
