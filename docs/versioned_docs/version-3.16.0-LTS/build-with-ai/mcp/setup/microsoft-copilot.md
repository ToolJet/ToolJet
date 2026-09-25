---
id: microsoft-copilot
title: Microsoft 365 Copilot
---

Connect ToolJet MCP to Microsoft 365 Copilot so your team can list, inspect, and build ToolJet applications from Copilot chat. You add the ToolJet MCP server as a tool to a Copilot Studio agent and authenticate it with a ToolJet personal access token.

This works with both ToolJet Cloud and self-hosted ToolJet.

## Prerequisites

- The URL of a running ToolJet MCP server, for example `https://tooljet-mcp.example.com/mcp`.
- A Microsoft 365 tenant where you can create and publish Copilot Studio agents.

## How It Works

**Copilot agent > ToolJet MCP server > ToolJet workspace**

The ToolJet MCP server receives tool calls from your Copilot agent and makes the matching calls to ToolJet. Every request carries your ToolJet personal access token in the `x-tooljet-pat` header.

A token only works in the workspace it was created in, and every tool call runs with the permissions of the token's owner. The token you choose decides what the agent can see and change.

## Step 1: Create a Personal Access Token

1. In ToolJet, open the workspace you want the agent to work in.
2. Go to **Profile settings > Personal access tokens** and click **Create new token**.
3. Copy the token, which begins with `tj_pat_`. ToolJet shows it only once.

<img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/pat.png" alt="Personal access tokens in Profile settings" />

## Step 2: Add ToolJet MCP to Your Agent

In Copilot Studio, add an MCP server tool to your agent. For the general steps, see Microsoft's guide to [adding an MCP server to an agent](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent).

Add these instructions to the agent so it checks with the user before changing anything:

```text
You are a ToolJet assistant. Use the ToolJet MCP tools to inspect and manage the user's ToolJet workspace and build or modify apps when asked. Confirm before any destructive or mutating action. Be concise.
```

Then add the ToolJet MCP server as a tool:

1. In the **Add MCP server** dialog, enter these values and click **Add**:

   | Field | Value |
   |:------|:------|
   | **Server name** | `ToolJet MCP` |
   | **Server description** | `Manage ToolJet workspaces: list and manage apps, users, datasources and ToolJet DB tables, and build or modify ToolJet apps` |
   | **Server URL** | Your ToolJet MCP server URL, for example `https://tooljet-mcp.example.com/mcp` |
   | **Authentication** | **API key** |
   | **Parameter type** | **Header** |
   | **Header name** | `x-tooljet-pat` |
   | **Key value** | Your ToolJet personal access token |

   <img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/microsoft-copilot/copilot-add-mcp-server.png" alt="Add MCP server dialog with the ToolJet MCP values" />

2. When asked for a connection, create a new one and paste the same token into the `x-tooljet-pat` field.
3. Open the **ToolJet MCP** tool. It should list the ToolJet tools, such as **List workspaces**, **List workspace apps**, and **Create app**. See [Supported Tools](/docs/build-with-ai/mcp/supported-tools) for the full list.
4. Set **Authentication** to **End user account**.

   <img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/microsoft-copilot/copilot-tools-loaded.png" alt="ToolJet MCP tool with the ToolJet tools loaded" />

5. Save the agent.

## Step 3: Test the Agent

Ask the agent:

> List the apps in my ToolJet workspace.

The first time the agent uses a ToolJet tool, it shows a **Permission Required** card. Click **Approve**.

The agent should list the applications in the workspace your token was created in.

<img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/microsoft-copilot/copilot-preview-test.png" alt="Agent listing the applications in the ToolJet workspace after the Permission Required card" />

Once that works, try a few more prompts:

- *"What ToolJet DB tables do I have?"*
- *"Create an app called Hello World with a text component that says Hello, World! and give me the editor link."*
- *"Add a Reports page to the Inventory Tracker app."*

## Step 4: Publish the Agent

Publish the agent to the **Teams and Microsoft 365** channel so your team can use it in Microsoft 365 Copilot. For the steps, see Microsoft's guide to [connecting an agent to Teams and Microsoft 365](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams).

Users then select the ToolJet agent in Microsoft 365 Copilot.

## Related

- [ToolJet MCP Overview](/docs/build-with-ai/mcp/overview)
- [App Generation](/docs/build-with-ai/mcp/app-generation)
- [Supported Tools](/docs/build-with-ai/mcp/supported-tools)
- [Security](/docs/build-with-ai/mcp/security)

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
