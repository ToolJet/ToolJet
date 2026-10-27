---
id: overview
title: Setup
sidebar_label: Overview
slug: /build-with-ai/mcp/setup
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

ToolJet MCP connects your AI client to your ToolJet workspace, so your agent can build and modify applications in the instance you already use, whether that's ToolJet Cloud or your own self-hosted domain.

Select your AI client to see its setup steps.

| Client | Guide |
|:-------|:------|
| Claude Code | [Set up ToolJet MCP in Claude Code](/docs/build-with-ai/mcp/setup/claude-code) |
| Codex | [Set up ToolJet MCP in Codex](/docs/build-with-ai/mcp/setup/codex) |
| Microsoft 365 Copilot | [Set up ToolJet MCP in Microsoft 365 Copilot](/docs/build-with-ai/mcp/setup/microsoft-copilot) |
| Any other MCP client, such as Cursor or Cline | [Set up ToolJet MCP in other MCP clients](/docs/build-with-ai/mcp/setup/other-clients) |

These guides authenticate with a personal access token. On ToolJet Cloud, you can connect with OAuth instead.

## Connect with OAuth

:::info Available on ToolJet Cloud
OAuth connections are available on ToolJet Cloud only. Self-hosted instances connect with a personal access token, using the client guides above.
:::

With OAuth, you connect your AI client by signing in to your ToolJet workspace in the browser and approving access, instead of creating and pasting a personal access token. Your client connects to ToolJet's hosted MCP server, so you don't run the server locally. Sign in with any method your workspace allows, including SSO.

OAuth works with MCP clients that support remote (Streamable HTTP) servers and OAuth sign-in, such as Claude Code, Codex, and Cursor.

### Step 1: Copy the Connection Command

1. In ToolJet Cloud, open the workspace you want the agent to build in.
2. Open the **Build ToolJet apps from your coding agent** dialog. 
3. Under **Connect your agent**, select **OAuth**.
4. Select your client and copy the commands shown.

The server URL in the commands ends with your workspace ID, so each workspace has its own URL. Connect separately for each workspace you want the agent to use.

### Step 2: Add the Server to Your Client

Replace `<workspace-mcp-url>` with the URL from Step 1.

<Tabs>

<TabItem value="claude-code" label="Claude Code" default>

Run this command in your terminal:

```bash
claude mcp add --transport http tooljet-oauth '<workspace-mcp-url>'
```

Then open Claude Code in the same directory, run `/mcp`, select **tooljet-oauth**, and authenticate in your browser.

</TabItem>

<TabItem value="codex" label="Codex">

Run these commands in your terminal:

```bash
codex mcp add tooljet-oauth --url '<workspace-mcp-url>'
codex mcp login tooljet-oauth
```

The second command opens the sign-in page in your browser.

</TabItem>

<TabItem value="cursor" label="Cursor">

Add this entry to `.cursor/mcp.json` in your project, merging it with any servers already in the file:

```json
{
  "mcpServers": {
    "tooljet-oauth": {
      "url": "<workspace-mcp-url>"
    }
  }
}
```

Then open Cursor's MCP settings and connect **tooljet-oauth** to sign in.

</TabItem>

<TabItem value="others" label="Others">

Add the URL as a remote Streamable HTTP MCP server in a client that supports OAuth, then start authentication from the client.

</TabItem>

</Tabs>

### Step 3: Sign In and Approve Access

Your client opens ToolJet in your browser.

1. Sign in to the workspace with any method it allows, such as password or SSO. If you're already signed in, ToolJet skips this step.
2. Review the consent screen. It shows the client's name, the account you're signed in with, the workspace, and the permissions the client is requesting:

   | Permission | What it allows |
   |:-----------|:---------------|
   | **Apps** | Create and manage apps and their components. |
   | **Data sources & database** | Access data sources, run queries, and manage ToolJet Database. |
   | **Workflows** | Create, manage, and run workflows. |
   | **Users & access control** | Manage workspace users and custom groups. |

   The client can make changes only within your existing workspace permissions. Approving a permission doesn't give a viewer edit rights or a builder admin rights.
3. Check the callback address shown under the buttons. ToolJet doesn't verify the client's name, so continue only if you started this connection and recognize the address.
4. Click **Allow access**. Your browser returns you to your client. To deny the request, click **Cancel**.

### Step 4: Install the App-Builder Skill

The OAuth connection gives your agent ToolJet's tools. To also give it the `tooljet-app-builder` skill, which teaches the agent ToolJet's app model and build recipe, install the skill-only plugin. It adds the skill without registering a second MCP server or asking for a token.

<Tabs>

<TabItem value="claude-code" label="Claude Code" default>

```
/plugin marketplace add ToolJet/tooljet-mcp
/plugin install tooljet-app-builder-skills@tooljet
```

</TabItem>

<TabItem value="codex" label="Codex">

```
codex plugin marketplace add ToolJet/tooljet-mcp --ref main
codex plugin add tooljet-app-builder-skills@tooljet
```

</TabItem>

</Tabs>

Use either this plugin or the `tooljet-app-builder` plugin from the token-based setup, not both. The `tooljet-app-builder` plugin already includes the skill.

Then ask your agent whether it can reach ToolJet:

> Can you connect to ToolJet?

### Manage Connected Clients

To see the clients you've authorized in the current workspace, go to **Profile settings > Connected AI clients**. Each entry lists the client's name and the permissions it was granted. Click **Disconnect** to revoke a client's access. The change applies to the client's next request.

<!-- TODO screenshot: the Connected AI clients card in Profile settings with one or two connected clients and their Disconnect buttons -->

A connection expires after 30 days, or sooner if the client goes unused for 7 days. To keep working, reconnect from your client and approve access again. ToolJet also disconnects clients automatically when:

- Your password changes, or an administrator ends your sessions.
- You're removed from or disabled in the workspace, or the workspace is archived.
- The workspace's login or SSO settings change.

Signing out of ToolJet in your browser doesn't disconnect your AI clients.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
