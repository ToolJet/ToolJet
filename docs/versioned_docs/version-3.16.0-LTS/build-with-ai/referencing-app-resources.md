---
id: referencing-app-resources
title: "@mention in AI Chat"
---

When working with the AI chat in ToolJet, you can use `@` to reference specific resources — the components and queries in your app, and the data sources and tables in your workspace. This lets the AI precisely target what you want to build or modify, instead of inferring it from context alone.

Because an `@mention` is an explicit selection, it is treated as deterministic. The AI does not ask you to confirm what you mentioned, so the build flow moves ahead with fewer steps.

## Where You Can Use @mention

What appears in the `@` list depends on where you are:

| Interface | Available references |
| --- | --- |
| App dashboard | Data sources and their tables |
| App builder | Data sources, tables, components, and queries |

Data sources exist at the workspace level, so they can be referenced from anywhere. Components and queries belong to a specific app, so they are only listed inside the App Builder.

## Referencing Components and Queries

### Typing @ in Chat

Type `@` directly in the AI chat input to bring up a list of components and queries available in your app. Select the one you want, and it will be pinned to your message. The AI then scopes its action to that exact component or query.

- **Components**: Reference a button, table, form, or any other component to ask the AI to update it.
- **Queries**: Reference a specific query to ask the AI to modify it or build on top of it.

<img className="screenshot-full img-m" src="/img/tooljet-ai/ref-app-resources/mention.png" alt="mention component/queries in the chat" />

### Selecting from the Canvas or Query Panel

You can also mention a component or query without typing in chat:

- **For components**: Select a component on the canvas. An option to mention it in the AI chat will appear. Clicking it adds the component reference to the chat input. <br/>
    <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/tooljet-ai/ref-app-resources/select-comp.png" alt="mention component/queries in the chat" />
- **For queries**: Select a query in the query panel. Similarly, you'll see an option to mention it in the AI chat. <br/>
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/ref-app-resources/select-query.png" alt="mention component/queries in the chat" />

This is useful when you can see the component or query you want to work with but don't remember its exact name.

## Referencing Data Sources and Tables

Type `@` to bring up the list of data sources connected in your workspace. Selecting one pins it to your message, so the AI builds against that data source instead of asking you to pick one later in the flow.

For databases, you can go a level deeper and reference individual tables. This is especially useful when a data source has a large number of tables - naming the exact tables is faster than having the AI search for relevant ones.

## How Mentioning Data Affects App Generation

Referencing your data upfront lets the AI skip steps it would otherwise have to ask about. The table below shows how the build flow changes based on what you mention.

| <div style={{ width:"150px"}}> What you mention </div> | Build flow |
|:--- |:--- |
| `@` data source, no tables | Skips the data clarification and data source selection steps. The AI scans the data source and pre-fills the entity mapping. |
| `@` data source and tables | If all the relevant tables are mentioned, all data steps are skipped and the flow goes straight to the spec doc. If some tables are missing, the data source selection is skipped, the mentioned tables are pre-filled, and the AI scans for the remaining tables and asks for your approval. |
| `@` tables, no data source | All data steps are skipped, since the data source that the table belongs to is already known. |
| Multiple `@` data sources | The AI identifies which one is the core data source and pre-fills it in the data source step. |

### Data Context Across Phases

Larger applications are built in multiple phases. The data source and tables you mention apply to the whole application, so the AI carries that context across phases instead of asking again:

- If the data source and tables are already resolved for all phases, the AI does not ask for them again in later phases.
- If only the data source is known, the AI first scans it for the tables relevant to the next phase, and asks you to select a data source only if it cannot find them.

## Limitations

- Only data sources [supported by ToolJet AI](/docs/build-with-ai/integrating-data#limitations) can be referenced.
- Currently, ToolJet AI can connect to only one data source per application. 
- Table references are available only for databases. Data sources that expose endpoints, such as OpenAPI, cannot be drilled into.
