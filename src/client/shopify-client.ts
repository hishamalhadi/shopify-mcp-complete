import { GraphQLClient } from "graphql-request";
import type { Config } from "../config/index.js";
import { createTokenManager, type TokenManager } from "../auth/oauth.js";

export interface ShopifyClientContext {
  client: GraphQLClient;
  tokenManager?: TokenManager;
}

export async function createShopifyClient(config: Config): Promise<ShopifyClientContext> {
  const endpoint = `https://${config.domain}/admin/api/${config.apiVersion}/graphql.json`;

  if (config.mode === "oauth") {
    // OAuth mode: use token manager with auto-refresh
    const tokenManager = createTokenManager({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      domain: config.domain,
    });

    // Fetch initial token to validate credentials
    await tokenManager.getAccessToken();

    const client = new GraphQLClient(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      requestMiddleware: async (request) => {
        const token = await tokenManager.getAccessToken();
        return {
          ...request,
          headers: {
            ...request.headers,
            "X-Shopify-Access-Token": token,
          },
        };
      },
    });

    return { client, tokenManager };
  }

  // Legacy mode: static access token
  const client = new GraphQLClient(endpoint, {
    headers: {
      "X-Shopify-Access-Token": config.accessToken,
      "Content-Type": "application/json",
    },
  });

  return { client };
}

// Helper to extract numeric ID from Shopify GID
export function parseGid(gid: string): string {
  const match = gid.match(/\/(\d+)$/);
  return match ? match[1] : gid;
}

// Helper to construct Shopify GID
export function toGid(type: string, id: string | number): string {
  const numericId = String(id).replace(/\D/g, "");
  return `gid://shopify/${type}/${numericId}`;
}

// Helper to format money values
export function formatMoney(amount: string, currencyCode: string): string {
  return `${currencyCode} ${parseFloat(amount).toFixed(2)}`;
}
