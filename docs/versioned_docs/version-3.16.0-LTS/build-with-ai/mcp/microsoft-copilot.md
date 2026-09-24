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
4. Set **Authentication** to **End user account**, so each person who uses the agent connects with their own token and acts in ToolJet as themselves.

   <img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/microsoft-copilot/copilot-tools-loaded.png" alt="ToolJet MCP tool with the ToolJet tools loaded" />

5. Save the agent.

## Step 3: Test the Agent

Ask the agent:

> What ToolJet workspace am I in?

The first time the agent uses a ToolJet tool, it shows a **Permission Required** card. Click **Approve**. If it asks you to connect first, use your ToolJet personal access token.

The agent should reply with the name of the workspace your token was created in.

<img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/microsoft-copilot/copilot-preview-test.png" alt="Agent replying with the ToolJet workspace name after the Permission Required card" />

Once that works, try a build:

- *"What ToolJet DB tables do I have?"*
- *"Create an app called Hello World with a text component that says Hello, World! and give me the editor link."*
- *"Add a page to the Tickets app with a table of the `tickets` table."*

## Troubleshooting

| Symptom | Cause and fix |
|:--------|:--------------|
| The agent can't load the MCP tools (HTTP 400) | The agent can't reach the server. Check that the server URL is correct and uses `https`. |
| The agent can't load the MCP tools (HTTP 403) | The tool isn't using a valid connection. Remove the ToolJet MCP tool from the agent, add it again, and create a new connection with your token. |
| The agent says it has no ToolJet tools | The tool isn't attached to the agent, or the agent wasn't saved. Check that **ToolJet MCP** is listed under **Tools**, save the agent, and start a new chat. |
| Tool error "HTTP 401: Invalid personal access token" | The token is revoked, copied incompletely, or from a different ToolJet instance than the one the server calls. Create a new token and update the key value on the agent's connection. |
| The agent sees a different workspace than expected | A token only works in the workspace it was created in. Create a token in the right workspace. |

## Related

- [ToolJet MCP Overview](/docs/build-with-ai/mcp/overview)
- [Setup](/docs/build-with-ai/mcp/setup)
- [Supported Tools](/docs/build-with-ai/mcp/supported-tools)
- [Security](/docs/build-with-ai/mcp/security)

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
