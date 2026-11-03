---
id: other-clients
title: Other MCP Clients
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Connect ToolJet MCP to another MCP client, such as Cursor or Cline, so your agent can build and modify applications in your ToolJet workspace, whether that's ToolJet Cloud or your own self-hosted domain.

You can connect with OAuth on ToolJet Cloud, or with a personal access token on ToolJet Cloud or a self-hosted instance. To compare the two, see [Choose an Authentication Method](/docs/build-with-ai/mcp/setup#choose-an-authentication-method).

## Prerequisites

- An MCP client. For OAuth, it must support remote MCP servers with OAuth sign-in. For a personal access token, it must be able to launch a stdio MCP server.
- For the personal access token method: Node.js 20 or newer, available to your client, and Git, to clone the ToolJet MCP repository.
- Access to the ToolJet workspace you want the agent to build in.

## Connect with OAuth

:::info Available on ToolJet Cloud
OAuth is available on ToolJet Cloud only. On a self-hosted instance, [connect with a personal access token](#connect-with-a-personal-access-token).
:::

**Your MCP client > ToolJet's hosted MCP server > ToolJet workspace**

Your client connects to the MCP server that ToolJet hosts, and you authorize it by signing in to your workspace in the browser. There's no token to create and no server to run on your machine. This works with clients that support remote (Streamable HTTP) MCP servers with OAuth sign-in, such as Cursor.

### Step 1: Copy the Server URL

1. In ToolJet Cloud, open the workspace you want the agent to build in.
2. Open the **Build ToolJet apps from your coding agent** dialog.
3. Under **Connect your agent**, select **OAuth**, then select **Cursor** or **Others**.
4. Copy the configuration or URL shown. The server URL ends with your workspace ID, so each workspace has its own URL.

### Step 2: Add the Server

<Tabs>

<TabItem value="cursor" label="Cursor" default>

Add this entry to `.cursor/mcp.json` in your project, merging it with any servers already in the file. Replace `<workspace-mcp-url>` with the URL from Step 1:

```json
{
  "mcpServers": {
    "tooljet-oauth": {
      "url": "<workspace-mcp-url>"
    }
  }
}
```

</TabItem>

<TabItem value="others" label="Other clients">

Add the URL from Step 1 as a remote Streamable HTTP MCP server, following your client's documentation.

</TabItem>

</Tabs>

### Step 3: Sign In and Approve Access

1. Start authentication from your client. In Cursor, open the MCP settings and connect **tooljet-oauth**. Your client opens ToolJet in your browser.
2. Sign in to the workspace with any method it allows, such as password or SSO. If you're already signed in, ToolJet skips this step.
3. Review the permissions the client is requesting, and check the callback address shown under the buttons. For what each permission allows, see [What You Approve](/docs/build-with-ai/mcp/setup#what-you-approve).
4. Click **Allow access**. Your browser returns you to your client.

If your client supports skills, also load the `tooljet-app-builder` skill from `plugins/tooljet-app-builder-skills/skills/tooljet-app-builder` in the [ToolJet MCP repository](https://github.com/ToolJet/tooljet-mcp). It teaches the agent ToolJet's app model and build recipe.

### Step 4: Verify the Connection

Ask your agent whether it can reach ToolJet:

> Can you connect to ToolJet?

The agent should confirm the connection and name your workspace. To see or revoke the connection later, go to **Profile settings > Connected AI clients** in ToolJet.

## Connect with a Personal Access Token

### How It Works

**Your MCP client > ToolJet MCP server > ToolJet workspace**

Your client launches the ToolJet MCP server on your machine from a local copy of the repository. The server reads your ToolJet URL and personal access token from the `env` block in your client's MCP configuration.

A token only works in the workspace it was created in, and every tool call runs with the permissions of the token's owner. The token you choose decides what the agent can see and change.

### Step 1: Create a Personal Access Token

1. In ToolJet, open the workspace you want the agent to build in.
2. Go to **Profile settings > Personal access tokens** and click **Create new token**.
3. Copy the token, which begins with `tj_pat_`. ToolJet shows it only once.

<img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/pat.png" alt="Personal access tokens in Profile settings" />

### Step 2: Clone the Repository

Clone the ToolJet MCP repository. No build step is needed, as the bundle is committed:

```bash
git clone https://github.com/ToolJet/tooljet-mcp.git
```

### Step 3: Register the Server

Add the equivalent of this entry to your client's MCP configuration, using the absolute path to your clone and your own values:

```json
{
  "mcpServers": {
    "tooljet": {
      "command": "node",
      "args": ["/absolute/path/to/tooljet-mcp/bundle/index.js"],
      "env": {
        "TOOLJET_PAT": "tj_pat_...",
        "TOOLJET_DEPLOYMENT_URL": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

| Variable | Required | Description | Default |
| ---------| -------- | ----------- | --------|
| `TOOLJET_DEPLOYMENT_URL` | Yes | URL of your ToolJet instance | `http://localhost:3000` |
| `TOOLJET_PAT` | Yes | The personal access token from Step 1 | |

Most deployments serve the API and the UI from the same origin, so `TOOLJET_DEPLOYMENT_URL` covers both and is the only URL you need. It defaults to localhost, so you can omit it only when you are running ToolJet locally on the default ports.

:::note If your API and UI are on different origins
Add `TOOLJET_URL` to the `env` block with the API origin. The common case is a local ToolJet checkout, where the frontend runs on `:8082` and the backend on `:3000`: point `TOOLJET_DEPLOYMENT_URL` at the frontend and `TOOLJET_URL` at the backend. An explicit `TOOLJET_URL` always wins over the fallback.
:::

:::warning Treat your token as a secret
The agent acts with the permissions of the token's owner in that workspace, so create the token in the workspace you actually want the agent to touch rather than in one with broader access. The token sits in plain text in your client's configuration file, so keep that file out of version control, and always use an `https://` instance URL, since the token is sent to your instance on every call.
:::

If your client supports skills, also load the `skill/` directory from the clone. Without it the tools still work, but the agent has to infer ToolJet's app model instead of following the documented build recipe.

Restart your client after saving the configuration.

### Step 4: Verify the Connection

Ask your agent whether it can reach ToolJet:

> Can you connect to ToolJet?

The agent should confirm the connection and name the workspace your token is pinned to.

Once that works, try a build:

> Build me a tickets dashboard on my ToolJet DB.

The agent should inspect your datasources, create an app, add a query, bind a table to it, and hand back links for editing and testing the finished application.

## Troubleshooting

If something doesn't work, see [Troubleshooting](/docs/build-with-ai/mcp/setup/troubleshooting).

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
