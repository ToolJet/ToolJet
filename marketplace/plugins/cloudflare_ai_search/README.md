
# Cloudflare AI Search

Documentation on: https://docs.tooljet.com/docs/data-sources/cloudflare_ai_search

The Cloudflare AI Search datasource lets you query Cloudflare AI Search instances from ToolJet.

## Prerequisites

- A Cloudflare account with AI Search configured.
- Your Cloudflare Account ID.
- An API token with the **AI Search:Edit** and **AI Search:Run** permissions.

## Configuration

Add a Cloudflare AI Search datasource in ToolJet and provide:

- **API Token:** Your Cloudflare API token. Keep this credential private.
- **Account ID:** The ID of your Cloudflare account.

The connector currently uses the `default` AI Search namespace.

## Available operations

- **Search an instance:** Retrieve relevant content for a query, with optional metadata filters.
- **Chat completions:** Generate an answer using an instance's indexed content.
- **List instances:** List instances in the default namespace.
- **Get instance:** Retrieve an instance by ID.

For API details, see the [Cloudflare AI Search REST API documentation](https://developers.cloudflare.com/ai-search/api/search/rest-api/) and [Instances API documentation](https://developers.cloudflare.com/ai-search/api/instances/rest-api/).