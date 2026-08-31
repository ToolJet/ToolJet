---
id: generate-applications
title: Generate Applications
---

This guide explains how to quickly generate and modify business applications using ToolJet. You can create an app from scratch with a single prompt or enhance an existing app with AI-powered assistance.

## Ways to Build with AI

The ToolJet dashboard offers two ways to build an application with AI:

- **Start with a prompt** – Describe what you want to build and ToolJet generates a fully functioning app for you. This is covered in the rest of this guide.
- **Build apps from your coding agents** – Build ToolJet apps from Claude Code, Codex, and other MCP-compatible clients. See [ToolJet MCP](/docs/build-with-ai/mcp/overview) for what it can do and [Setup](/docs/build-with-ai/mcp/setup) for connecting your agent.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/dashboard.png" alt="tooljet generate apps" />

## Creating Application

Enter a prompt on the home page describing the business application you want to build, and ToolJet generates it for you. There are no intermediate steps to confirm; the app is built directly from your prompt.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/prompt-v2.png" alt="tooljet generate apps" />

Once generation finishes, you are taken to the App Builder with a fully functional app: UI components, queries, and data bindings are already configured, and you can customize anything from there.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/app-v2.png" alt="tooljet generate apps" />

### Modifying Application

You can modify any application in ToolJet with AI assistance, whether it's a newly created app or an existing one. You can update components and queries within your application with just a prompt. 
<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/modify.png" alt="tooljet generate apps" />

## Creating Modules

ToolJet AI can be used to quickly generate Modules, which can then be reused across multiple applications. To generate a module using ToolJet AI, open the Module Builder and enter your prompt describing the UI you want to create.

<img className="screenshot-full img-full" src="/img/tooljet-ai/modules/generate.png" alt="tooljet generate modules" />

## Generate Query

ToolJet AI can generate complete, fully-configured queries directly from the AI chat. It creates an actual query in your query panel — with parameters and configuration all set up.

To generate a query:
1. Add a query on the query panel.
2. Open the AI chat in the App Builder.
3. Type a prompt describing the query you need by [referencing the specific query](/docs/build-with-ai/referencing-app-resources). <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/gen-query.png" alt="tooljet generate modules" />
4. The AI generates the query with all the parameters and required fields.

You can use [Referencing App Resources](/docs/build-with-ai/referencing-app-resources) to reference an existing query and ask the AI to modify it.

## Generating Code

ToolJet lets you generate JavaScript and Python code snippets directly using AI. For generating complete database queries wired to a data source, see [Generate Query](#generate-query) above.

1. Click the AI icon in the query panel to open the AI code generator. <br/>
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/gen-code/icon.png" alt="tooljet generate apps" />
2. Enter a prompt describing the logic or query you want to build. <br/>
    <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/tooljet-ai/gen-code/prompt.png" alt="tooljet generate apps" />
3. Check the generated code and either insert it directly or click Regenerate to try a different version. <br/>
    <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/tooljet-ai/gen-code/results.png" alt="tooljet generate apps" />

## Auto-sort Queries

As applications grow, queries can accumulate without clear organization. The Auto-sort feature groups your queries into folders automatically based on their names.

To use Auto-sort:
1. Open the query panel.
2. Click the **Auto-sort unsorted queries into folders** option. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/tooljet-ai/generate-app/auto-sort.png" alt="tooljet generate modules" />
3. The AI analyzes your query names and organizes them into folders.

**How it works:**
- If folders already exist in your app, queries are mapped to the closest matching folder where applicable, and new folders are created for the rest.
- If no folders exist, new folders are created based on query name groupings.
- Only query names are sent to the AI - no query content or data source credentials are shared, for compliance reasons.
- Results depend on descriptive query names. Generic names like `postgres_1`, `postgres_2` will produce less precise groupings.