import { GraphQLClient } from "graphql-request";
import {
  ShopifyQLQueryInputSchema,
  SalesReportInputSchema,
  CustomerSegmentsInputSchema,
  ProductPerformanceInputSchema,
  ANALYTICS_QUERIES,
} from "../schemas/analytics.js";
import { SHOPIFYQL_QUERY, GET_CUSTOMERS } from "../graphql/index.js";

// Helper to check for parse errors (handles string, array, or null)
function hasParseErrors(parseErrors: unknown): string | null {
  if (!parseErrors) return null;
  if (typeof parseErrors === "string") {
    const trimmed = parseErrors.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(parseErrors) && parseErrors.length > 0) {
    return parseErrors.map((e) => (typeof e === "object" && e?.message) || String(e)).join(", ");
  }
  return null;
}

// Helper to get date clause for period
// Returns either "DURING named_range" or "SINCE x UNTIL y" format
function getDateClause(period: string): string {
  switch (period) {
    case "today":
      return "DURING today";
    case "yesterday":
      return "DURING yesterday";
    case "last_7_days":
      return "SINCE -7d UNTIL today";
    case "last_30_days":
      return "SINCE -30d UNTIL today";
    case "last_90_days":
      return "SINCE -90d UNTIL today";
    case "this_month":
      return "DURING this_month";
    case "last_month":
      return "DURING last_month";
    case "this_year":
      return "DURING this_year";
    case "last_year":
      return "DURING last_year";
    default:
      return "SINCE -30d UNTIL today";
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
            } | null;
            parseErrors: string | null;
          };
        }>(SHOPIFYQL_QUERY, { query: params.query });

        const parseError = hasParseErrors(data.shopifyqlQuery.parseErrors);
        if (parseError) {
          throw new Error(`ShopifyQL parse error: ${parseError}`);
        }

        const tableData = data.shopifyqlQuery.tableData;
        if (!tableData) {
          return { columns: [], rows: [], rowCount: 0 };
        }
        return {
          columns: tableData.columns || [],
          rows: tableData.rows || [],
          rowCount: tableData.rows?.length || 0,
        };
      },
    },

    "sales-report": {
      description:
        "Get a sales report for a specified time period. Can group by day, week, month, product, vendor, or channel. Returns total sales, net sales, and order counts.",
      schema: SalesReportInputSchema,
      handler: async (input: unknown) => {
        const params = SalesReportInputSchema.parse(input);
        const dateClause = getDateClause(params.period);

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

        const query = `FROM sales SHOW total_sales, net_sales, orders ${groupByClause} ${dateClause} ORDER BY total_sales DESC`;

        const data = await client.request<{
          shopifyqlQuery: {
            tableData: {
              columns: Array<{ name: string; dataType: string; displayName: string }>;
              rows: unknown[];
            } | null;
            parseErrors: string | null;
          };
        }>(SHOPIFYQL_QUERY, { query });

        const parseError = hasParseErrors(data.shopifyqlQuery.parseErrors);
        if (parseError) {
          throw new Error(`ShopifyQL error: ${parseError}`);
        }

        const tableData = data.shopifyqlQuery.tableData;
        if (!tableData) {
          return { period: params.period, groupBy: params.groupBy || "day", columns: [], rows: [], rowCount: 0 };
        }
        return {
          period: params.period,
          groupBy: params.groupBy || "day",
          columns: tableData.columns || [],
          rows: tableData.rows || [],
          rowCount: tableData.rows?.length || 0,
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
        const dateClause = getDateClause(params.period);

        const sortColumn = params.sortBy === "quantity_sold" ? "quantity" : "total_sales";
        const query = `FROM sales SHOW product_title, variant_title, quantity, total_sales GROUP BY product_title, variant_title ${dateClause} ORDER BY ${sortColumn} DESC LIMIT ${params.limit}`;

        const data = await client.request<{
          shopifyqlQuery: {
            tableData: {
              columns: Array<{ name: string; dataType: string; displayName: string }>;
              rows: unknown[];
            } | null;
            parseErrors: string | null;
          };
        }>(SHOPIFYQL_QUERY, { query });

        const parseError = hasParseErrors(data.shopifyqlQuery.parseErrors);
        if (parseError) {
          throw new Error(`ShopifyQL error: ${parseError}`);
        }

        const tableData = data.shopifyqlQuery.tableData;
        if (!tableData) {
          return { period: params.period, sortBy: params.sortBy, columns: [], products: [], totalProducts: 0 };
        }
        return {
          period: params.period,
          sortBy: params.sortBy,
          columns: tableData.columns || [],
          products: tableData.rows || [],
          totalProducts: tableData.rows?.length || 0,
        };
      },
    },
  };
}

// Export predefined queries for reference
export { ANALYTICS_QUERIES };
