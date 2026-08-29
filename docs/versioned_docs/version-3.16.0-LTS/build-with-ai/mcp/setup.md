---
id: setup
title: Setup
---

:::caution BETA
ToolJet MCP is currently in beta and not recommended for production use.
:::

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

The server reads its configuration from the environment your AI client is launched from. Every client uses the same three variables.

| Variable | Required | Description | Default |
| ---------| -------- | ----------- | --------|
| `TOOLJET_PAT` | Yes | The personal access token from Step 1 | — |
| `TOOLJET_URL` | Yes | URL of your ToolJet Instance | `http://localhost:3000` |
| `TOOLJET_APP_URL` | No | URL of the ToolJet App you wish to edit  | `http://localhost:8082` |

Both URLs default to localhost, so you can omit them only when you are running ToolJet locally on the default ports. If you leave `TOOLJET_APP_URL` at its default while pointing at a deployed instance, the server still works but the app links it hands back will point at localhost.

:::warning Treat your token as a secret
The agent acts with the permissions of the token's owner in that workspace, so create the token in the workspace you actually want the agent to touch rather than in one with broader access. The token sits in plain text in your shell profile or your client's config file, so keep that file out of version control, and always use an `https://` instance URL, since the token is sent to `TOOLJET_URL` on every call.
:::

## Step 3: Install for Your Client

Set the variables above **before** launching your client. A plugin cannot prompt you for secrets, so the server picks them up from the environment at launch. If a credential is missing, the server reports a clear error naming the missing variable rather than failing silently.

Each install below registers two things together: the MCP server and the `tooljet-app-builder` skill, which teaches the agent ToolJet's app model and build recipe. Install both, since the tools alone leave the agent guessing at how the pieces fit.

### Claude Code

```
/plugin install github:ToolJet/tooljet-mcp
```

To install through the marketplace instead, which lets you pull updates later, run these two commands in order. The first registers the marketplace, the second installs the plugin from it:

```
/plugin marketplace add ToolJet/tooljet-mcp
/plugin install tooljet-app-builder@tooljet
```

Restart Claude Code after installing.

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
        "TOOLJET_URL": "https://your-tooljet-instance.com",
        "TOOLJET_APP_URL": "https://your-tooljet-instance.com"
      }
    }
  }
}
```

Clients that support skills should also load the `skill/` directory from the clone. Without it the tools still work, but the agent has to infer ToolJet's app model instead of following the documented build recipe.

## Verify the Connection

Ask your agent to list your workspaces:

> List my ToolJet workspaces.

The agent should call `list_workspaces` and return the workspace your token is pinned to. Once that works, try a build:

> Build me a tickets dashboard on my ToolJet DB.

The agent should inspect your datasources, create an app, add a query, bind a table to it, and hand back links for editing and testing the finished app.

## Troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |
| The server reports a missing variable | `TOOLJET_PAT` or `TOOLJET_URL` didn't reach the server. Export them and restart the client, which reads the environment at launch. |
| Tools don't appear at all | Your client didn't start the server. Confirm `node --version` is 20 or newer and that your client can see it. |
| Calls fail with an authentication error | The token is expired, revoked, or was copied incompletely. Create a fresh one under **Settings → Access tokens**. |
| Calls fail with a connection error | `TOOLJET_URL` is wrong or unreachable from your machine. Confirm it is the backend origin, not the frontend. |
| The agent can't see the workspace you expected    | A token's session is pinned to the workspace it was created in. Create a token in that workspace instead. |
| App links point at localhost | `TOOLJET_APP_URL` is still at its default. Set it to your frontend origin. |
