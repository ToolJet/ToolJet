---
id: codex
title: Codex
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Connect ToolJet MCP to Codex so your agent can build and modify applications in your ToolJet workspace, whether that's ToolJet Cloud or your own self-hosted domain.

## Prerequisites

- Codex CLI or Codex desktop installed.
- Node.js 20 or newer, available to Codex.
- Access to the ToolJet workspace you want the agent to build in.

## How It Works

**Codex > ToolJet MCP server > ToolJet workspace**

The ToolJet plugin runs the ToolJet MCP server on your machine and installs the `tooljet-app-builder` skill, which teaches the agent ToolJet's app model and build recipe. The server reads your ToolJet URL and personal access token from the environment Codex is launched from.

A token only works in the workspace it was created in, and every tool call runs with the permissions of the token's owner. The token you choose decides what the agent can see and change.

## Step 1: Create a Personal Access Token

1. In ToolJet, open the workspace you want the agent to build in.
2. Go to **Profile settings > Personal access tokens** and click **Create new token**.
3. Copy the token, which begins with `tj_pat_`. ToolJet shows it only once.

<img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/pat.png" alt="Personal access tokens in Profile settings" />

## Step 2: Set Your Environment Variables

The server reads two variables from the environment Codex is launched from.

| Variable | Required | Description | Default |
| ---------| -------- | ----------- | --------|
| `TOOLJET_DEPLOYMENT_URL` | Yes | URL of your ToolJet instance | `http://localhost:3000` |
| `TOOLJET_PAT` | Yes | The personal access token from Step 1 | |

Most deployments serve the API and the UI from the same origin, so `TOOLJET_DEPLOYMENT_URL` covers both and is the only URL you need. It defaults to localhost, so you can omit it only when you are running ToolJet locally on the default ports.

:::note If your API and UI are on different origins
Set `TOOLJET_URL` to the API origin as well. The common case is a local ToolJet checkout, where the frontend runs on `:8082` and the backend on `:3000`: point `TOOLJET_DEPLOYMENT_URL` at the frontend and `TOOLJET_URL` at the backend. An explicit `TOOLJET_URL` always wins over the fallback.
:::

:::warning Treat your token as a secret
The agent acts with the permissions of the token's owner in that workspace, so create the token in the workspace you actually want the agent to touch rather than in one with broader access. The token sits in plain text in your shell profile, so keep that file out of version control, and always use an `https://` instance URL, since the token is sent to your instance on every call.
:::

Add the variables to your shell profile, **before** launching Codex. This makes them persist across sessions.

<Tabs>

<TabItem value="zsh" label="zsh" default>

Replace the placeholder values with your own, then run the command. It appends the variables to `~/.zshrc`:

```bash
cat >> ~/.zshrc <<'EOF'
export TOOLJET_PAT="tj_pat_..."
export TOOLJET_DEPLOYMENT_URL="https://your-tooljet-instance.com"
EOF
```

Load the variables into your current terminal:

```bash
source ~/.zshrc
```

</TabItem>

<TabItem value="bash" label="bash">

Replace the placeholder values with your own, then run the command. It appends the variables to `~/.bashrc`:

```bash
cat >> ~/.bashrc <<'EOF'
export TOOLJET_PAT="tj_pat_..."
export TOOLJET_DEPLOYMENT_URL="https://your-tooljet-instance.com"
EOF
```

Load the variables into your current terminal:

```bash
source ~/.bashrc
```

</TabItem>

<TabItem value="powershell" label="PowerShell">

Replace the placeholder values with your own, then run the commands. They set the variables for your Windows user account:

```powershell
[Environment]::SetEnvironmentVariable("TOOLJET_PAT", "tj_pat_...", "User")
[Environment]::SetEnvironmentVariable("TOOLJET_DEPLOYMENT_URL", "https://your-tooljet-instance.com", "User")
```

Close and reopen PowerShell to load the variables.

</TabItem>

</Tabs>

Launch Codex from that same terminal once the variables are set.

### Verify Before You Continue

Confirm the variables are set in the terminal you'll launch Codex from. Both must print a value; if either is empty, the server reports a missing-variable error at startup.

<Tabs>

<TabItem value="unix" label="macOS / Linux" default>

```bash
echo $TOOLJET_DEPLOYMENT_URL
echo $TOOLJET_PAT
```

</TabItem>

<TabItem value="powershell" label="PowerShell">

```powershell
echo $env:TOOLJET_DEPLOYMENT_URL
echo $env:TOOLJET_PAT
```

</TabItem>

</Tabs>

## Step 3: Install the Plugin

The plugin registers two things together: the MCP server and the `tooljet-app-builder` skill. Run these two commands in order:

```
codex plugin marketplace add ToolJet/tooljet-mcp --ref main
codex plugin add tooljet-app-builder@tooljet
```

On Codex desktop, run the marketplace command, restart the app, open **Plugins**, select the ToolJet source, and install **ToolJet App Builder**. In the Codex CLI you can also install it from `/plugins`.

## Step 4: Verify the Connection

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
