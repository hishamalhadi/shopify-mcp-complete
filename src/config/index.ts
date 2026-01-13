import dotenv from "dotenv";
import minimist from "minimist";
import { z } from "zod";

// Load .env file
dotenv.config();

const DomainSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9-]+\.myshopify\.com$/,
    "Invalid Shopify domain format (expected: store.myshopify.com)"
  );

// Legacy config with static access token
const LegacyConfigSchema = z.object({
  mode: z.literal("legacy"),
  accessToken: z.string().min(1, "Access token is required"),
  domain: DomainSchema,
  apiVersion: z.string().default("2026-01"),
});

// OAuth config with client credentials (recommended for 2026+)
const OAuthConfigSchema = z.object({
  mode: z.literal("oauth"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
  domain: DomainSchema,
  apiVersion: z.string().default("2026-01"),
});

export type LegacyConfig = z.infer<typeof LegacyConfigSchema>;
export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;
export type Config = LegacyConfig | OAuthConfig;

export function loadConfig(): Config {
  // Parse CLI arguments
  const argv = minimist(process.argv.slice(2));

  const domain = argv.domain || process.env.MYSHOPIFY_DOMAIN;
  const apiVersion = argv.apiVersion || process.env.SHOPIFY_API_VERSION || "2026-01";

  // Check for OAuth credentials first (preferred)
  const clientId = argv.clientId || process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = argv.clientSecret || process.env.SHOPIFY_CLIENT_SECRET;

  // Fall back to legacy access token
  const accessToken = argv.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;

  // Determine which mode to use
  if (clientId && clientSecret) {
    const rawConfig = {
      mode: "oauth" as const,
      clientId,
      clientSecret,
      domain,
      apiVersion,
    };

    const result = OAuthConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      printErrors(result.error.errors);
      process.exit(1);
    }
    return result.data;
  }

  if (accessToken) {
    const rawConfig = {
      mode: "legacy" as const,
      accessToken,
      domain,
      apiVersion,
    };

    const result = LegacyConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      printErrors(result.error.errors);
      process.exit(1);
    }
    return result.data;
  }

  // No credentials provided
  console.error("No Shopify credentials provided.\n");
  printUsage();
  process.exit(1);
}

function printErrors(errors: z.ZodIssue[]): void {
  const messages = errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  console.error("Configuration errors:");
  messages.forEach((err) => console.error(`  - ${err}`));
  console.error("");
  printUsage();
}

function printUsage(): void {
  console.error("Usage (OAuth - recommended):");
  console.error(
    "  npx shopify-mcp-complete --clientId=<id> --clientSecret=<secret> --domain=<store>.myshopify.com"
  );
  console.error("\nOr set environment variables:");
  console.error("  SHOPIFY_CLIENT_ID=<client_id>");
  console.error("  SHOPIFY_CLIENT_SECRET=<client_secret>");
  console.error("  MYSHOPIFY_DOMAIN=<store>.myshopify.com");
  console.error("\nLegacy mode (static token):");
  console.error("  SHOPIFY_ACCESS_TOKEN=<token>");
  console.error("  MYSHOPIFY_DOMAIN=<store>.myshopify.com");
}
