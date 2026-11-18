---
id: referencing-app-resources
title: "@mention in AI Chat"
---

When working with the AI chat in ToolJet, you can use `@` to reference specific data sources, components, and queries in your app. This lets the AI precisely target what you want to create or modify, instead of inferring it from context alone.

## Ways to Reference App Resources

### Typing @ in Chat

Type `@` directly in the AI chat input to bring up a list of data sources, components, and queries available in your app. Select the one you want, and it will be pinned to your message. The AI then scopes its action to that exact resource.

- **Components**: Reference a button, table, form, or any other component to ask the AI to update it.
- **Queries**: Reference a specific query to ask the AI to modify it or build on top of it.
- **Transformations**: Reference a query as `<query name>.transformation` to ask the AI to change only that query's transformation and nothing else about the query. Only queries that support transformations are listed.
- **Data sources**: Reference a connected data source, or a single table in a database, to tell the AI which data to build with. See [Mentioning Data Sources](#mentioning-data-sources).

<img className="screenshot-full img-m" src="/img/tooljet-ai/ref-app-resources/mention.png" alt="mention component/queries in the chat" />

### Selecting from the Canvas or Query Panel

You can also mention a component or query without typing in chat:

- **For components**: Select a component on the canvas. An option to mention it in the AI chat will appear. Clicking it adds the component reference to the chat input. <br/>
    <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/tooljet-ai/ref-app-resources/select-comp.png" alt="mention component/queries in the chat" />
- **For queries** — Select a query in the query panel. Similarly, you'll see an option to mention it in the AI chat. <br/>
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/ref-app-resources/select-query.png" alt="mention component/queries in the chat" />

This is useful when you can see the component or query you want to work with but don't remember its exact name.

## Mentioning Data Sources

You can @mention data sources in the AI chat in the App Builder, in the prompt on the home page, and in the prompt in the Module Builder. On the home page and in the Module Builder, data sources are the only resources you can mention.

When you mention a data source, the AI uses it for the app instead of asking you which data source to use, and skips exploring data you have already pointed it to. If the AI still needs you to pick the app's main data source, it offers only the data sources you mentioned.

To mention a single table, type `@`, select a database in the list, then select the table. Mentioning a table also brings its data source into scope. You can drill into tables for PostgreSQL, MySQL, MS SQL Server, Snowflake, Databricks, and MongoDB (collections). Other data sources are mentioned as a whole. Hover over a mention in your message to see what it refers to.
