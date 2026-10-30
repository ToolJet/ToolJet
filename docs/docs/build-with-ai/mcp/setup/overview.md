---
id: overview
title: Setup
sidebar_label: Overview
slug: /build-with-ai/mcp/setup
---

ToolJet MCP connects your AI client to your ToolJet workspace, so your agent can build and modify applications in the instance you already use, whether that's ToolJet Cloud or your own self-hosted domain.

Setting up has two parts: choose how your client authenticates with ToolJet, then follow the guide for your client. Each client guide covers both methods.

## Choose an Authentication Method

ToolJet MCP supports two ways to connect. With either one, the agent works in a single workspace and can't go beyond your own permissions in it.

| | OAuth | Personal access token (PAT) |
|:--|:--|:--|
| **Available on** | ToolJet Cloud | ToolJet Cloud and self-hosted |
| **How you authenticate** | Sign in to your workspace in the browser, with password or SSO, and approve access | Create a token in **Profile settings** and add it to your client's environment or configuration |
| **Where the MCP server runs** | Hosted by ToolJet, so there's nothing to install or run locally | On your machine, which needs Node.js 20 or newer |
| **App-builder skill** | Installed separately, as the `tooljet-app-builder-skills` plugin | Included in the `tooljet-app-builder` plugin |
| **How long access lasts** | 30 days, or until the client goes unused for 7 days. Then you reconnect from your client | Until the token expires or you revoke it |
| **Where you revoke access** | **Profile settings > Connected AI clients** | **Profile settings > Personal access tokens** |

**Which one should you use?**

- **On ToolJet Cloud**, use OAuth if your client supports it. There's no token to create or store and no local server to run.
- **On a self-hosted instance**, use a personal access token. OAuth isn't available on self-hosted instances.
- **For Microsoft 365 Copilot**, use a personal access token. Its setup uses a token on both Cloud and self-hosted.

## Select Your AI Client

Each guide walks you through both methods your client supports.

| Client | OAuth (Cloud) | Personal access token | Guide |
|:-------|:-------------:|:---------------------:|:------|
| Claude Code | Yes | Yes | [Set up ToolJet MCP in Claude Code](/docs/build-with-ai/mcp/setup/claude-code) |
| Codex | Yes | Yes | [Set up ToolJet MCP in Codex](/docs/build-with-ai/mcp/setup/codex) |
| Cursor, Cline, and other MCP clients | Yes, if the client supports remote MCP servers with OAuth | Yes | [Set up ToolJet MCP in other MCP clients](/docs/build-with-ai/mcp/setup/other-clients) |
| Microsoft 365 Copilot | No | Yes | [Set up ToolJet MCP in Microsoft 365 Copilot](/docs/build-with-ai/mcp/setup/microsoft-copilot) |

## OAuth Connections

:::info Available on ToolJet Cloud
OAuth connections are available on ToolJet Cloud only.
:::

### What You Approve

When your client connects with OAuth, ToolJet opens a consent screen in your browser. It shows the client's name, the account you're signed in with, the workspace, and the permissions the client is requesting:

| Permission | What it allows |
|:-----------|:---------------|
| **Apps** | Create and manage apps and their components. |
| **Data sources & database** | Access data sources, run queries, and manage ToolJet Database. |
| **Workflows** | Create, manage, and run workflows. |
| **Users & access control** | Manage workspace users and custom groups. |

The client can make changes only within your existing workspace permissions. Approving a permission doesn't give a viewer edit rights or a builder admin rights.

The callback address appears under the **Allow access** and **Cancel** buttons. ToolJet doesn't verify the client's name, so continue only if you started the connection and recognize the address.

A connection is bound to the workspace you approved it in. To use the agent in another workspace, connect again with that workspace's server URL.

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
