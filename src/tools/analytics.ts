import { GraphQLClient } from "graphql-request";
import {
  ShopifyQLQueryInputSchema,
  SalesReportInputSchema,
  CustomerSegmentsInputSchema,
  ProductPerformanceInputSchema,
  ANALYTICS_QUERIES,
} from "../schemas/analytics.js";
import { SHOPIFYQL_QUERY, GET_CUSTOMERS } from "../graphql/index.js";

// Helper to get date range for period
function getDateRange(period: string): { since: string; until?: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (period) {
    case "today":
      return { since: `${today}` };
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { since: yesterday.toISOString().split("T")[0], until: today };
    case "last_7_days":
      return { since: "startOfDay(-6d)" };
    case "last_30_days":
      return { since: "startOfDay(-29d)" };
    case "last_90_days":
      return { since: "startOfDay(-89d)" };
    case "this_month":
      return { since: "startOfMonth(0m)" };
    case "last_month":
      return { since: "startOfMonth(-1m)", until: "endOfMonth(-1m)" };
    case "this_year":
      return { since: "startOfYear(0y)" };
    case "last_year":
      return { since: "startOfYear(-1y)", until: "endOfYear(-1y)" };
    default:
      return { since: "startOfDay(-29d)" };
  }
}

export function createAnalyticsTools(client: GraphQLClient) {
  return {
    "shopifyql-query": {
      description:
        "Execute a raw ShopifyQL query for custom analytics. Returns tabular data with columns and rows. Use this for custom reports not covered by other analytics tools.",
      schema: ShopifyQLQueryInputSchema,
      handler: async (input: unknown) => {
        const params = ShopifyQLQueryInputSchema.parse(input);

        const data = await client.request<{
          shopifyqlQuery: {
            tableData: {
              columns: Array<{ name: string; dataType: string; displayName: string }>;
              rows: unknown[];
              rowCount: number;
            };
            parseErrors: Array<{ code: string; message: string }>;
          };
        }>(SHOPIFYQL_QUERY, { query: params.query });

        if (data.shopifyqlQuery.parseErrors?.length > 0) {
          throw new Error(
            `ShopifyQL parse error: ${data.shopifyqlQuery.parseErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          columns: data.shopifyqlQuery.tableData.columns,
          rows: data.shopifyqlQuery.tableData.rows,
          rowCount: data.shopifyqlQuery.tableData.rowCount,
        };
      },
    },

    "sales-report": {
      description:
        "Get a sales report for a specified time period. Can group by day, week, month, product, vendor, or channel. Returns total sales, net sales, and order counts.",
      schema: SalesReportInputSchema,
      handler: async (input: unknown) => {
        const params = SalesReportInputSchema.parse(input);
        const dateRange = getDateRange(params.period);

        let groupByClause = "";
        switch (params.groupBy) {
          case "day":
            groupByClause = "GROUP BY day";
            break;
          case "week":
            groupByClause = "GROUP BY week";
            break;
          case "month":
            groupByClause = "GROUP BY month";
            break;
          case "quarter":
            groupByClause = "GROUP BY quarter";
            break;
          case "year":
            groupByClause = "GROUP BY year";
            break;
          case "product":
            groupByClause = "GROUP BY product_title";
            break;
          case "vendor":
            groupByClause = "GROUP BY vendor";
            break;
          case "channel":
            groupByClause = "GROUP BY channel";
            break;
          default:
            groupByClause = "GROUP BY day";
        }

        const query = `FROM sales SHOW total_sales, net_sales, orders_count ${groupByClause} SINCE ${dateRange.since}${dateRange.until ? ` UNTIL ${dateRange.until}` : ""} ORDER BY total_sales DESC`;

        const data = await client.request<{
          shopifyqlQuery: {
            tableData: {
              columns: Array<{ name: string; dataType: string; displayName: string }>;
              rows: unknown[];
              rowCount: number;
            };
            parseErrors: Array<{ code: string; message: string }>;
          };
        }>(SHOPIFYQL_QUERY, { query });

        if (data.shopifyqlQuery.parseErrors?.length > 0) {
          throw new Error(
            `ShopifyQL error: ${data.shopifyqlQuery.parseErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          period: params.period,
          groupBy: params.groupBy || "day",
          columns: data.shopifyqlQuery.tableData.columns,
          rows: data.shopifyqlQuery.tableData.rows,
          rowCount: data.shopifyqlQuery.tableData.rowCount,
        };
      },
    },

    "customer-segments": {
      description:
        "Get customer analytics showing top customers by total spent, order count, and engagement. Useful for identifying VIP customers.",
      schema: CustomerSegmentsInputSchema,
      handler: async (input: unknown) => {
        const params = CustomerSegmentsInputSchema.parse(input);

        // Get top customers by amount spent
        const data = await client.request<{
          customers: {
            edges: Array<{
              node: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                numberOfOrders: number;
                amountSpent: { amount: string; currencyCode: string };
                createdAt: string;
              };
            }>;
          };
        }>(GET_CUSTOMERS, {
          first: params.limit,
          query: null,
          after: null,
        });

        // Sort by amount spent
        const customers = data.customers.edges
          .map((edge) => edge.node)
          .sort((a, b) => {
            const aSpent = parseFloat(a.amountSpent?.amount || "0");
            const bSpent = parseFloat(b.amountSpent?.amount || "0");
            return bSpent - aSpent;
          });

        // Calculate segments
        const segments = {
          vip: customers.filter(
            (c) => parseFloat(c.amountSpent?.amount || "0") > 500 || c.numberOfOrders >= 5
          ),
          regular: customers.filter((c) => {
            const spent = parseFloat(c.amountSpent?.amount || "0");
            return spent >= 100 && spent <= 500 && c.numberOfOrders >= 2;
          }),
          new: customers.filter((c) => c.numberOfOrders === 1),
        };

        return {
          topCustomers: customers.slice(0, params.limit),
          segments: {
            vipCount: segments.vip.length,
            regularCount: segments.regular.length,
            newCount: segments.new.length,
          },
          totalCustomers: customers.length,
        };
      },
    },

    "product-performance": {
      description:
        "Get product performance analytics showing top selling products by revenue or quantity. Useful for inventory planning and marketing decisions.",
      schema: ProductPerformanceInputSchema,
      handler: async (input: unknown) => {
        const params = ProductPerformanceInputSchema.parse(input);
        const dateRange = getDateRange(params.period);

        const sortColumn = params.sortBy === "quantity_sold" ? "quantity" : "total_sales";
        const query = `FROM sales SHOW product_title, variant_title, quantity, total_sales GROUP BY product_title, variant_title SINCE ${dateRange.since}${dateRange.until ? ` UNTIL ${dateRange.until}` : ""} ORDER BY ${sortColumn} DESC LIMIT ${params.limit}`;

        const data = await client.request<{
          shopifyqlQuery: {
            tableData: {
              columns: Array<{ name: string; dataType: string; displayName: string }>;
              rows: unknown[];
              rowCount: number;
            };
            parseErrors: Array<{ code: string; message: string }>;
          };
        }>(SHOPIFYQL_QUERY, { query });

        if (data.shopifyqlQuery.parseErrors?.length > 0) {
          throw new Error(
            `ShopifyQL error: ${data.shopifyqlQuery.parseErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          period: params.period,
          sortBy: params.sortBy,
          columns: data.shopifyqlQuery.tableData.columns,
          products: data.shopifyqlQuery.tableData.rows,
          totalProducts: data.shopifyqlQuery.tableData.rowCount,
        };
      },
    },
  };
}

// Export predefined queries for reference
export { ANALYTICS_QUERIES };
