---
id: referencing-app-resources
title: "@mention in AI Chat"
---

When working with the AI chat in ToolJet, you can use `@` to reference specific resources — the components and queries in your app, and the data sources and tables in your workspace. This lets the AI precisely target what you want to build or modify, instead of inferring it from context alone.

Referencing a resource with `@` gives you:

- **Precision** — The AI acts on the exact resource you picked, instead of guessing which one your description meant.
- **Deterministic selection** — You choose the resource from a list rather than typing its name, so there is no ambiguity for the AI to resolve and it does not stop to ask you to confirm what you meant.
- **Less time and fewer tokens** — The AI does not have to search through your app or data source to work out which resource is relevant, so less of the work goes into finding things and more into building them.
- **Fewer steps to a build** — When you reference a data source or its tables, the AI already knows what to build on and skips the data selection and confirmation steps.

## Where You Can Use @mention

What appears in the `@` list depends on where you are:

| Interface | Available references |
| --- | --- |
| App dashboard | Data sources and their tables |
| App builder | Data sources, tables, components, and queries |

Data sources exist at the workspace level, so they can be referenced from anywhere. Components and queries belong to a specific app, so they are only listed inside the App Builder.

<img className="screenshot-full img-m" src="/img/tooljet-ai/ref-app-resources/mention.png" alt="mention component/queries in the chat" />

## Referencing Components

Type `@` directly in the AI chat input to bring up a list of components available in your app. Select a button, table, form, or any other component, and it will be pinned to your message. The AI then scopes its action to that exact component.

You can also mention a component without typing in chat. Select the component on the canvas and an option to mention it in the AI chat will appear. Clicking it adds the component reference to the chat input. This is useful when you can see the component you want to work with but don't remember its exact name.

<img className="screenshot-full img-m" src="/img/tooljet-ai/ref-app-resources/select-comp.png" alt="mention a component from the canvas" />

## Referencing Queries

Type `@` to bring up a list of queries in your app. Reference a specific query to ask the AI to modify it or build on top of it.

Queries can be mentioned from the query panel as well. Select a query in the panel and you'll see the same option to mention it in the AI chat.

<img className="screenshot-full img-full" src="/img/tooljet-ai/ref-app-resources/select-query.png" alt="mention a query from the query panel" />

## Referencing Data Sources and Tables

Type `@` to bring up the list of data sources connected in your workspace. Selecting one pins it to your message, so the AI builds against that data source instead of asking you to pick one later in the flow.

For databases, you can go a level deeper and reference individual tables. This is especially useful when a data source has a large number of tables - naming the exact tables is faster than having the AI search for relevant ones.

For how a referenced data source shapes the app generation flow, see [Integrating Data](/docs/build-with-ai/integrating-data).

## Limitations

- Only data sources [supported by ToolJet AI](/docs/build-with-ai/integrating-data#limitations) can be referenced.
- Currently, ToolJet AI can connect to only one data source per application. 
- Table references are available only for databases. Data sources that expose endpoints, such as OpenAPI, cannot be drilled into.
