---
id: setup
title: Setup
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

ToolJet MCP connects your AI coding assistant to your ToolJet workspace, so your agent can build and modify apps in the instance you already use, whether that's ToolJet Cloud or your own self-hosted domain.

## Prerequisites

Before you begin, you'll need:

1. A ToolJet personal access token for the workspace you want to build in
2. Node.js 20 or newer, available to your AI client
3. One of the supported AI clients

## Step 1: Create a Personal Access Token

In ToolJet, go to **Profile Settings → Personal access tokens** and create a token. Create it **in the workspace you want the agent to build in**: a token's session is pinned to the workspace it was created in and cannot reach any other, so the workspace you choose here decides what the agent can see and change.

Copy the token, which begins with `tj_pat_`. You won't be able to view it again.

<img className="screenshot-full img-full" src="/img/tooljet-ai/mcp/pat.png" alt="Personal Access Token" />

## Step 2: Set Your Environment Variables

The server reads its configuration from the environment your AI client is launched from. Every client uses the same two variables.

| Variable | Required | Description | Default |
| ---------| -------- | ----------- | --------|
| `TOOLJET_DEPLOYMENT_URL` | Yes | URL of your ToolJet instance | `http://localhost:3000` |
| `TOOLJET_PAT` | Yes | The personal access token from Step 1 | — |

Most deployments serve the API and the UI from the same origin, so `TOOLJET_DEPLOYMENT_URL` covers both and is the only URL you need. It defaults to localhost, so you can omit it only when you are running ToolJet locally on the default ports.

:::note If your API and UI are on different origins
Set `TOOLJET_URL` to the API origin as well. The common case is a local ToolJet checkout, where the frontend runs on `:8082` and the backend on `:3000`: point `TOOLJET_DEPLOYMENT_URL` at the frontend and `TOOLJET_URL` at the backend. An explicit `TOOLJET_URL` always wins over the fallback.
:::

:::warning Treat your token as a secret
The agent acts with the permissions of the token's owner in that workspace, so create the token in the workspace you actually want the agent to touch rather than in one with broader access. The token sits in plain text in your shell profile or your client's config file, so keep that file out of version control, and always use an `https://` instance URL, since the token is sent to your instance on every call.
:::

Where you put these depends on your client. Pick one of the options below and set the variables **before** launching your client.

### Option 1: Your Shell Profile

Works with every client, and the right choice if you launch your AI client from a terminal. Adding the variables to your shell profile makes them persist across sessions.

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

Launch your client from that same terminal once the variables are set.

### Option 2: Claude Code Settings File

More reliable than a shell profile if you launch Claude Code from VS Code, the desktop app, or an application icon, since those may never read your shell profile. Set the variables for every project, or for one project only.

#### All Projects

Add this `env` block to `~/.claude/settings.json`. If the file already contains other settings, add `env` alongside them rather than replacing the file:

```json
{
  "env": {
    "TOOLJET_PAT": "tj_pat_...",
    "TOOLJET_DEPLOYMENT_URL": "https://your-tooljet-instance.com"
  }
}
```

<details>
<summary>How to find the settings.json file</summary>

Claude Code stores its configuration in a hidden `.claude` folder in your home directory. A project's `.claude` folder sits at the root of that project instead.

<Tabs>

<TabItem value="mac" label="macOS / Linux" default>

The file is at `~/.claude/settings.json`.

Open it directly:

`code ~/.claude/settings.json`

To browse to it instead, press `Cmd + Shift + G` in Finder and enter `~/.claude`. On Linux, press `Ctrl + H` in your file manager to reveal hidden folders.

If the file doesn't exist yet, create it:

`mkdir -p ~/.claude && echo '{}' > ~/.claude/settings.json`

</TabItem>

<TabItem value="windows" label="Windows">

The file is at `%USERPROFILE%\.claude\settings.json`.

Open it directly:

`code $env:USERPROFILE\.claude\settings.json`

To browse to it instead, paste `%USERPROFILE%\.claude` into the File Explorer address bar.

If the file doesn't exist yet, create it:

`New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude" | Out-Null`
`'{}' | Out-File -Encoding utf8 "$env:USERPROFILE\.claude\settings.json"`

</TabItem>

</Tabs>

</details>

#### A Single Project

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

### Option 3: Clients Other Than Claude Code

Most other clients accept the variables inline in their own MCP configuration file, alongside the server definition, rather than reading them from the environment. See [Other MCP clients](#other-mcp-clients) in Step 3 for the full entry.

### Verify Before You Continue

Confirm the variables are actually set in the environment your client will launch from. Both must print a value; if either is empty, the server reports a missing-variable error at startup.

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

## Step 3: Install for Your Client

Set the variables above **before** launching your client. A plugin cannot prompt you for secrets, so the server picks them up from the environment at launch. If a credential is missing, the server reports a clear error naming the missing variable rather than failing silently.

Each install below registers two things together: the MCP server and the `tooljet-app-builder` skill, which teaches the agent ToolJet's app model and build recipe. Install both, since the tools alone leave the agent guessing at how the pieces fit.

### Claude Code

Claude Code offers two ways to install, and the difference is whether the source is registered for future updates.

#### Install Through The Marketplace
Run these two commands in order. The first registers the ToolJet repository as a plugin marketplace, and the second installs the plugin from its catalog:

```
/plugin marketplace add ToolJet/tooljet-mcp
/plugin install tooljet-app-builder@tooljet
```

Because the marketplace stays registered, you can pull newer versions later with `/plugin marketplace update tooljet`. This is the recommended option.

#### Install Directly From The Repository
This is a single command, and no marketplace is registered:

```
/plugin install github:ToolJet/tooljet-mcp
```

The install is a one-time snapshot. There is no registered source to refresh, so updating means uninstalling and installing again. Use this for a quick trial.

Restart Claude Code after installing either way.

### Codex

```
codex plugin marketplace add ToolJet/tooljet-mcp --ref main
codex plugin add tooljet-app-builder@tooljet
```

On Codex desktop, run the marketplace command, restart the app, open **Plugins**, select the ToolJet source, and install **ToolJet App Builder**. In the Codex CLI you can also install it from `/plugins`.

### Other MCP clients

Any client that can launch a stdio MCP server works. Clone the repository, then register the bundled server. No build step is needed, as the bundle is committed:

```bash
git clone https://github.com/ToolJet/tooljet-mcp.git
```

Add the equivalent of this entry to your client's MCP configuration, using the absolute path to your clone:

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

Clients that support skills should also load the `skill/` directory from the clone. Without it the tools still work, but the agent has to infer ToolJet's app model instead of following the documented build recipe.

## Verify the Connection

Ask your agent whether it can reach ToolJet:

> Can you connect to ToolJet?

The agent should confirm the connection and name the workspace your token is pinned to. If it reports that no ToolJet tools are available, or that a credential is missing, see [Troubleshooting](#troubleshooting) below.

Once that works, try a build:

> Build me a tickets dashboard on my ToolJet DB.

The agent should inspect your datasources, create an app, add a query, bind a table to it, and hand back links for editing and testing the finished app.

## Troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |
| The server reports a missing variable | `TOOLJET_PAT` or `TOOLJET_DEPLOYMENT_URL` didn't reach the server. Export them and restart the client, which reads the environment at launch. |
| Tools don't appear at all | Your client didn't start the server. Confirm `node --version` is 20 or newer and that your client can see it. |
| Calls fail with an authentication error | The token is expired, revoked, or was copied incompletely. Create a fresh one under **Settings → Access tokens**. |
| Calls fail with a connection error | `TOOLJET_DEPLOYMENT_URL` is wrong or unreachable from your machine. If your API and UI are on different origins, set `TOOLJET_URL` to the backend origin. |
| The agent can't see the workspace you expected    | A token's session is pinned to the workspace it was created in. Create a token in that workspace instead. |
| App links point at localhost | `TOOLJET_DEPLOYMENT_URL` is still at its default. Set it to your instance URL. |
