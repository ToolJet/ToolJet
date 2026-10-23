---
id: generate-queries
title: Query Generation
---

Beyond generating whole applications, ToolJet AI works at the query level: it can create fully configured queries and modify existing ones from the AI chat.

## Generate Query

ToolJet AI can generate complete, fully-configured queries directly from the AI chat. It creates an actual query in your query panel — with parameters and configuration all set up.

To generate a query:
1. Add a query on the query panel.
2. Open the AI chat in the App Builder.
3. Type a prompt describing the query you need by [referencing the specific query](/docs/build-with-ai/referencing-app-resources). <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/gen-query.png" alt="tooljet generate query" />
4. The AI generates the query with all the parameters and required fields.

You can use [@mention in AI Chat](/docs/build-with-ai/referencing-app-resources) to reference an existing query and ask the AI to modify it.

:::note
The AI buttons in the query panel (**Write query**, **Write custom code**, **Write transformation**, the AI code generator, and **Auto-sort unsorted queries into folders**) are currently hidden. To generate or change a query, including the code in a **Run JavaScript code** query, @mention the query in the AI chat and describe what you need.
:::

<!-- TODO verify: whether the AI agent writes RunJS code through the chat. The server's list of AI-supported data sources (AI_SUPPORTED_DATASOURCE_KINDS) doesn't include runjs, while the hidden query-panel button (AI_QUERY_SUPPORTED_KINDS) does. -->

## Supported Data Sources

ToolJet AI can work with queries for these data sources. They are also the data sources you can @mention in the AI chat.

- PostgreSQL
- MySQL
- MS SQL Server
- Snowflake
- Databricks
- MongoDB
- BigQuery
- OpenAPI
- OpenAI
- Gmail
- Google Calendar
- HubSpot
- ServiceNow
- QuickBooks
