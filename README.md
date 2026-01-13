# shopify-mcp-complete

A comprehensive Model Context Protocol (MCP) server for Shopify's GraphQL Admin API. Provides **40 tools** for managing products, orders, customers, inventory, analytics, discounts, collections, and more.

## Features

- **40 MCP Tools** covering all major Shopify operations
- **Full CRUD Support** for products, customers, orders, and more
- **Inventory Management** - adjust, set, transfer, and track stock levels
- **ShopifyQL Analytics** - run custom analytics queries for sales, customers, products
- **TypeScript** with full type safety and Zod validation
- **Latest Shopify API** - Uses GraphQL Admin API version 2026-01

## Tools Overview

| Category | Tools | Description |
|----------|-------|-------------|
| **Products** | 8 | CRUD, variants, images, metafields |
| **Orders** | 7 | List, update, cancel, draft orders, fulfillment |
| **Customers** | 6 | CRUD, order history |
| **Inventory** | 6 | Get levels, adjust, set, bulk adjust, transfer |
| **Analytics** | 4 | ShopifyQL queries, sales reports, product performance |
| **Discounts** | 4 | Create, list, update, delete discount codes |
| **Collections** | 3 | List, products, create/update |
| **Shop** | 2 | Store info, locations |

## Installation

```bash
npm install shopify-mcp-complete
```

Or run directly with npx:

```bash
npx shopify-mcp-complete --clientId=YOUR_CLIENT_ID --clientSecret=YOUR_SECRET --domain=your-store.myshopify.com
```

## Authentication

### OAuth Mode (Recommended)

As of January 1, 2026, Shopify requires OAuth client credentials for custom apps. This server supports automatic token refresh (tokens expire every 24 hours).

1. Go to your [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Navigate to **Apps** → Your App → **Client credentials**
3. Copy your **Client ID** and **Client Secret**

### Legacy Mode

If you have an existing static access token (`shpat_...`), you can still use it, but this method is deprecated.

## Configuration

### Option 1: Environment Variables (Recommended)

Create a `.env` file:

```env
# OAuth Mode (Recommended)
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=shpss_your_client_secret
MYSHOPIFY_DOMAIN=your-store.myshopify.com

# Legacy Mode (Deprecated)
# SHOPIFY_ACCESS_TOKEN=shpat_your_access_token
# MYSHOPIFY_DOMAIN=your-store.myshopify.com
```

### Option 2: Command Line Arguments

```bash
# OAuth Mode
npx shopify-mcp-complete \
  --clientId=your_client_id \
  --clientSecret=shpss_your_client_secret \
  --domain=your-store.myshopify.com

# Legacy Mode
npx shopify-mcp-complete \
  --accessToken=shpat_your_access_token \
  --domain=your-store.myshopify.com
```

### Option 3: Claude Desktop Configuration

Add to your Claude Desktop config:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": ["shopify-mcp-complete"],
      "env": {
        "SHOPIFY_CLIENT_ID": "your_client_id",
        "SHOPIFY_CLIENT_SECRET": "shpss_your_client_secret",
        "MYSHOPIFY_DOMAIN": "your-store.myshopify.com"
      }
    }
  }
}
```

## Required Shopify Scopes

Configure your app in the Shopify Partners Dashboard with these scopes:

- `read_products`, `write_products`
- `read_orders`, `write_orders`
- `read_customers`, `write_customers`
- `read_inventory`, `write_inventory`
- `read_analytics`
- `read_discounts`, `write_discounts`
- `read_price_rules`, `write_price_rules`

**Note:** Not all scopes are required. Enable only the scopes you need for the tools you plan to use.

## Tool Reference

### Products

| Tool | Description |
|------|-------------|
| `get-products` | List products with search/filter |
| `get-product-by-id` | Get detailed product info |
| `create-product` | Create new product |
| `update-product` | Update product attributes |
| `delete-product` | Delete product |
| `manage-variants` | Create/update/delete variants |
| `manage-images` | Add/remove product images |
| `manage-metafields` | Set/delete metafields |

### Orders

| Tool | Description |
|------|-------------|
| `get-orders` | List orders with filters |
| `get-order-by-id` | Get detailed order info |
| `update-order` | Update order note, tags, etc. |
| `cancel-order` | Cancel an order |
| `create-draft-order` | Create draft order |
| `complete-draft-order` | Convert draft to order |
| `fulfill-order` | Create fulfillment |

### Customers

| Tool | Description |
|------|-------------|
| `get-customers` | List customers |
| `get-customer-by-id` | Get customer details |
| `create-customer` | Create new customer |
| `update-customer` | Update customer |
| `delete-customer` | Delete customer |
| `get-customer-orders` | Get customer's orders |

### Inventory

| Tool | Description |
|------|-------------|
| `get-inventory-levels` | Get stock levels |
| `adjust-inventory` | Adjust quantity (delta) |
| `set-inventory` | Set to specific quantity |
| `bulk-adjust-inventory` | Adjust multiple items |
| `get-locations` | List locations |
| `transfer-inventory` | Move between locations |

### Analytics

| Tool | Description |
|------|-------------|
| `shopifyql-query` | Execute custom ShopifyQL |
| `sales-report` | Sales analytics by period |
| `customer-segments` | Customer insights |
| `product-performance` | Top products by sales |

### Discounts

| Tool | Description |
|------|-------------|
| `create-discount` | Create discount code |
| `get-discounts` | List discounts |
| `update-discount` | Update discount |
| `delete-discount` | Delete discount |

### Collections

| Tool | Description |
|------|-------------|
| `get-collections` | List collections |
| `get-collection-products` | Products in collection |
| `manage-collection` | Create/update collection |

### Shop

| Tool | Description |
|------|-------------|
| `get-shop-info` | Store configuration |
| `get-shop-locations` | Fulfillment locations |

## Usage Examples

Once connected to Claude, you can use natural language to interact with your Shopify store:

- **"List all my active products"** - Uses `get-products` tool
- **"Show me products with low inventory"** - Uses `get-inventory-levels` tool
- **"What are my sales for the last 30 days?"** - Uses `sales-report` tool
- **"Add 50 units to product X inventory"** - Uses `adjust-inventory` tool
- **"Create a 20% discount code SUMMER20"** - Uses `create-discount` tool

## Development

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or pull request.
