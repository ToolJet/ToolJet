---
id: claude-code
title: Claude Code
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Connect ToolJet MCP to Claude Code so your agent can build and modify applications in your ToolJet workspace, whether that's ToolJet Cloud or your own self-hosted domain.

You can connect with OAuth on ToolJet Cloud, or with a personal access token on ToolJet Cloud or a self-hosted instance. To compare the two, see [Choose an Authentication Method](/docs/build-with-ai/mcp/setup#choose-an-authentication-method).

## Prerequisites

- Claude Code installed.
- For the personal access token method: Node.js 20 or newer, available to Claude Code.
- Access to the ToolJet workspace you want the agent to build in.

## Connect with OAuth

:::info Available on ToolJet Cloud
OAuth is available on ToolJet Cloud only. On a self-hosted instance, [connect with a personal access token](#connect-with-a-personal-access-token).
:::

**Claude Code > ToolJet's hosted MCP server > ToolJet workspace**

Claude Code connects to the MCP server that ToolJet hosts, and you authorize it by signing in to your workspace in the browser. There's no token to create and no server to run on your machine.

### Step 1: Copy the Server Command

1. In ToolJet Cloud, open the workspace you want the agent to build in.
2. Open the **Build ToolJet apps from your coding agent** dialog.
3. Under **Connect your agent**, select **OAuth**, then select **Claude Code**.
4. Copy the command. The server URL in it ends with your workspace ID, so each workspace has its own URL.

### Step 2: Add the Server

Run the command in your terminal. It looks like this, with your workspace's URL in place of `<workspace-mcp-url>`:

```bash
claude mcp add --transport http tooljet-oauth '<workspace-mcp-url>'
```

### Step 3: Sign In and Approve Access

1. Open Claude Code in the same directory, run `/mcp`, select **tooljet-oauth**, and authenticate. Claude Code opens ToolJet in your browser.
2. Sign in to the workspace with any method it allows, such as password or SSO. If you're already signed in, ToolJet skips this step.
3. Review the permissions the client is requesting, and check the callback address shown under the buttons. For what each permission allows, see [What You Approve](/docs/build-with-ai/mcp/setup#what-you-approve).
4. Click **Allow access**. Your browser returns you to Claude Code.

### Step 4: Install the App-Builder Skill

The OAuth connection gives your agent ToolJet's tools. To also give it the `tooljet-app-builder` skill, which teaches the agent ToolJet's app model and build recipe, install the skill-only plugin:

```
/plugin marketplace add ToolJet/tooljet-mcp
/plugin install tooljet-app-builder-skills@tooljet
```

Install `tooljet-app-builder-skills`, not the `tooljet-app-builder` plugin used with a personal access token. That plugin also registers a local server, and using both loads the same guidance twice. Restart Claude Code after installing.

### Step 5: Verify the Connection

Ask your agent whether it can reach ToolJet:

> Can you connect to ToolJet?

The agent should confirm the connection and name your workspace. To see or revoke the connection later, go to **Profile settings > Connected AI clients** in ToolJet.

## Connect with a Personal Access Token

### How It Works

**Claude Code > ToolJet MCP server > ToolJet workspace**

The ToolJet plugin runs the ToolJet MCP server on your machine and installs the `tooljet-app-builder` skill, which teaches the agent ToolJet's app model and build recipe. The server reads your ToolJet URL and personal access token from the environment Claude Code is launched from.

A token only works in the workspace it was created in, and every tool call runs with the permissions of the token's owner. The token you choose decides what the agent can see and change.

### Step 1: Create a Personal Access Token

1. In ToolJet, open the workspace you want the agent to build in.
2. Go to **Profile settings > Personal access tokens** and click **Create new token**.
3. Copy the token, which begins with `tj_pat_`. ToolJet shows it only once.

<img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/pat.png" alt="Personal access tokens in Profile settings" />

### Step 2: Set Your Environment Variables

The server reads two variables from the environment Claude Code is launched from.

| Variable | Required | Description | Default |
| ---------| -------- | ----------- | --------|
| `TOOLJET_DEPLOYMENT_URL` | Yes | URL of your ToolJet instance | `http://localhost:3000` |
| `TOOLJET_PAT` | Yes | The personal access token from Step 1 | |

Most deployments serve the API and the UI from the same origin, so `TOOLJET_DEPLOYMENT_URL` covers both and is the only URL you need. It defaults to localhost, so you can omit it only when you are running ToolJet locally on the default ports.

:::note If your API and UI are on different origins
Set `TOOLJET_URL` to the API origin as well. The common case is a local ToolJet checkout, where the frontend runs on `:8082` and the backend on `:3000`: point `TOOLJET_DEPLOYMENT_URL` at the frontend and `TOOLJET_URL` at the backend. An explicit `TOOLJET_URL` always wins over the fallback.
:::

:::warning Treat your token as a secret
The agent acts with the permissions of the token's owner in that workspace, so create the token in the workspace you actually want the agent to touch rather than in one with broader access. The token sits in plain text in your shell profile or settings file, so keep that file out of version control, and always use an `https://` instance URL, since the token is sent to your instance on every call.
:::

Set the variables in one of these two places, **before** launching Claude Code.

#### Option 1: Your Shell Profile

The right choice if you launch Claude Code from a terminal. Adding the variables to your shell profile makes them persist across sessions.

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

Launch Claude Code from that same terminal once the variables are set.

#### Option 2: Claude Code Settings File

More reliable than a shell profile if you launch Claude Code from VS Code, the desktop app, or an application icon, since those may never read your shell profile. Set the variables for every project, or for one project only.

##### All Projects

Add this `env` block to `~/.claude/settings.json`. If the file already contains other settings, add `env` alongside them rather than replacing the file:

```json
{
  "env": {
    "TOOLJET_PAT": "tj_pat_...",
    "TOOLJET_DEPLOYMENT_URL": "https://your-tooljet-instance.com"
  }
}
```

##### A Single Project

Use this when different projects connect to different ToolJet instances. The variables apply only when Claude Code runs in that directory.

Add the same block to `.claude/settings.local.json` inside the project:

```json
{
  "env": {
    "TOOLJET_PAT": "tj_pat_...",
    "TOOLJET_DEPLOYMENT_URL": "https://your-tooljet-instance.com"
  }
}
```

Restart Claude Code for the change to take effect. Note that `/config` manages common settings such as theme and model, but does not expose `env`; that block is edited by hand.

#### Verify Before You Continue

If you used your shell profile, confirm the variables are set in the terminal you'll launch Claude Code from. Both must print a value; if either is empty, the server reports a missing-variable error at startup.

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

### Step 3: Install the Plugin

The plugin registers two things together: the MCP server and the `tooljet-app-builder` skill. Claude Code offers two ways to install it, and the difference is whether the source is registered for future updates.

#### Install Through the Marketplace

Run these two commands in order. The first registers the ToolJet repository as a plugin marketplace, and the second installs the plugin from its catalog:

```
/plugin marketplace add ToolJet/tooljet-mcp
/plugin install tooljet-app-builder@tooljet
```

Because the marketplace stays registered, you can pull newer versions later with `/plugin marketplace update tooljet`. This is the recommended option.

#### Install Directly From the Repository

This is a single command, and no marketplace is registered:

```
/plugin install github:ToolJet/tooljet-mcp
```

The install is a one-time snapshot. There is no registered source to refresh, so updating means uninstalling and installing again. Use this for a quick trial.

Restart Claude Code after installing either way.

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
