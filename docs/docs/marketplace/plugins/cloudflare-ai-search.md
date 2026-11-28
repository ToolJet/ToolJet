---
id: marketplace-plugin-cloudflare-ai-search
title: Cloudflare AI Search
---

ToolJet integrates with Cloudflare AI Search to retrieve relevant information from indexed content and generate answers using an AI Search instance. The integration supports searching instances, chat completions, listing instances, and retrieving instance details.

:::note
Before following this guide, complete the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins).
:::

## Connection

To connect Cloudflare AI Search to ToolJet, you need a Cloudflare account with AI Search configured, your Cloudflare Account ID, and an API token with the required permissions.

### Required credentials

- **API Token:** A Cloudflare API token with the `AI Search:Edit` and `AI Search:Run` permissions. Keep this token private.
- **Account ID:** The ID of your Cloudflare account. You can find it in your Cloudflare account dashboard.

In ToolJet, add a Cloudflare AI Search datasource and enter the API Token and Account ID in the connection form. Use the **Test connection** option to verify the credentials.

The connector currently uses the `default` AI Search namespace.

## Supported Operations

- [Search an instance](#search-an-instance)
- [Chat completions](#chat-completions)
- [List instances](#list-instances)
- [Get instance](#get-instance)

### Search an instance

Search indexed content in a Cloudflare AI Search instance using a query.

#### Required Parameters

- **Instance ID:** The ID of the AI Search instance to search.
- **Query:** The text to search for in the instance.

#### Optional Parameters

- **Metadata filters (JSON):** A JSON object containing metadata filters to narrow the search results. The value must be valid JSON.

#### Example Values

```yaml
Instance ID: tooljet-test
Query: What is ToolJet?
Metadata filters (JSON): {"category": "support"}
```

The metadata filter example illustrates the expected JSON input format; the filter only matches useful metadata when corresponding metadata exists in the indexed content.

### Chat completions

Send a question to a Cloudflare AI Search instance and generate an answer using its indexed content.

#### Required Parameters

- **Instance ID:** The ID of the AI Search instance.
- **Query:** The question to ask the instance.

#### Example Values

```yaml
Instance ID: tooljet-test
Query: According to the indexed document, what is ToolJet?
```

### List instances

Retrieve the list of AI Search instances available in the configured Cloudflare account and the `default` namespace.

This operation does not require additional query parameters.

### Get instance

Retrieve configuration and details for a specific AI Search instance.

#### Required Parameters

- **Instance ID:** The ID of the AI Search instance to retrieve.

#### Example Values

```yaml
Instance ID: tooljet-test
```

## References

- [Cloudflare AI Search REST API](https://developers.cloudflare.com/ai-search/api/search/rest-api/)
- [Cloudflare AI Search Instances API](https://developers.cloudflare.com/ai-search/api/)
