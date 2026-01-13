import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, type Config } from "./config/index.js";
import { createShopifyClient } from "./client/shopify-client.js";
import { createAllTools, getToolCount } from "./tools/index.js";

export async function createServer(): Promise<{ server: McpServer; config: Config }> {
  const config = loadConfig();

  // Create Shopify client (handles OAuth token fetch if needed)
  const { client: shopifyClient, tokenManager } = await createShopifyClient(config);

  if (config.mode === "oauth") {
    console.error("Authentication: OAuth (client credentials grant)");
    if (tokenManager) {
      console.error(`Scopes: ${tokenManager.getScopes().join(", ")}`);
    }
  } else {
    console.error("Authentication: Legacy (static access token)");
  }

  const tools = createAllTools(shopifyClient);

  // Create MCP server
  const server = new McpServer({
    name: "shopify-mcp-complete",
    version: "1.0.0",
  });

  // Register all tools with the MCP server
  for (const [name, tool] of Object.entries(tools)) {
    const zodSchema = tool.schema;
    const shape = zodSchema instanceof z.ZodObject ? zodSchema.shape : {};

    server.tool(
      name,
      tool.description,
      shape,
      async (args: unknown) => {
        try {
          const result = await tool.handler(args);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: message }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  console.error(`Shopify MCP Server initialized with ${Object.keys(tools).length} tools`);
  console.error(`Connected to: ${config.domain}`);
  console.error(`API Version: ${config.apiVersion}`);

  return { server, config };
}

export async function startServer(): Promise<void> {
  try {
    const { server } = await createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Shopify MCP Server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

export { getToolCount };
