# SeaTable Connector for ToolJet

A ToolJet marketplace plugin that connects to any [SeaTable](https://seatable.com) server (cloud or self-hosted) and provides full CRUD operations.

## Supported Operations

| Operation | Description |
|---|---|
| **List Rows** | Paginated row listing from any table |
| **Get Row** | Fetch a single row by its ID |
| **Create Row** | Insert a new row with column → value pairs |
| **Update Row** | Update an existing row by ID |
| **Delete Row** | Delete a row by ID |
| **Search Rows (SQL)** | Query rows using SeaTable's SQL interface |
| **Get Metadata** | Retrieve all tables, columns, and views (schema discovery) |

## Connection Setup

1. **Server URL** – The URL of your SeaTable server. This can be the SaaS offering `https://cloud.seatable.io` or any self-hosted SeaTable instance.
2. **API Token** – A base-scoped API token. Create one in SeaTable: Base → Advanced → API Token.

The plugin works with any SeaTable server and exchanges the API token for a short-lived base token automatically.

## Development

```bash
npm install
npm run build     # Compile TypeScript → dist/ (via @vercel/ncc)
npm run watch     # Watch mode for development
```

## Testing

Integration tests run against a real SeaTable instance:

```bash
SEATABLE_TEST_SERVER_URL=https://your-seatable-server.com \
SEATABLE_TEST_API_TOKEN=your_api_token_here \
npm test
```

Without the environment variables, integration tests are skipped automatically.

## File Structure

```
├── package.json            # @tooljet-marketplace/seatable
├── tsconfig.json           # TypeScript config (ToolJet monorepo compatible)
├── README.md
├── __tests__/
│   └── index.js            # Integration tests (Jest)
└── lib/                    # Source files (ToolJet convention)
    ├── icon.svg            # SeaTable logo
    ├── manifest.json       # Connection form schema (Server URL + API Token)
    ├── operations.json     # Available operations and their parameters
    ├── index.ts            # QueryService implementation (run + testConnection)
    ├── query_operations.ts # Operation dispatcher
    ├── seatable_client.ts  # SeaTable API client (auth + CRUD)
    └── types.ts            # TypeScript type definitions
```

## How It Works

The plugin follows SeaTable's two-step authentication:

1. **Token exchange** – `GET /api/v2.1/dtable/app-access-token/` with the API token returns a base token + base UUID
2. **Data operations** – All CRUD calls go to `/api-gateway/api/v2/dtables/{base_uuid}/...` with the base token

This matches the pattern used by the official [SeaTable MCP Server](https://github.com/seatable/seatable-mcp).

## Publishing to ToolJet Marketplace

Submit a pull request to the [ToolJet repository](https://github.com/ToolJet/ToolJet). The plugin files go into `marketplace/plugins/seatable/`. The ToolJet team reviews the PR, and if approved, the plugin ships with the next release.
