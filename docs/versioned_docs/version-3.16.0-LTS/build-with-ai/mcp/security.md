---
id: security
title: Security Best Practices
---

:::caution BETA
ToolJet MCP is currently in beta and not recommended for production use.
:::

Connecting an AI agent to your ToolJet workspace gives it real access to real data. This page covers what that access includes, how to scope it, and the safeguards built into the server.

## Understand What the Agent Can Reach

An agent connected over MCP acts with the permissions of your access token and can run read queries against the data sources in that workspace. Because an agent's exploration is not deterministic and depends on the model you use, assume that any data reachable from that workspace may be read while it works.

This is the single most important thing to internalize before connecting. You are not granting access to one app or one table. You are granting access to everything the token's owner can reach in that workspace.

## Scope the Token to One Workspace

A personal access token's session is pinned to the workspace it was created in and cannot reach any other. This is the strongest boundary available to you, so use it deliberately.

- Create the token **in the workspace you actually want the agent to build in**, not in one with broader access.
- Prefer a workspace whose data you are comfortable exposing over your most sensitive one.
- Create separate tokens for separate workspaces rather than reusing one broadly scoped token.
- Revoke tokens you no longer use. A token stays valid until it is revoked.

## Keep Development and Production Separate

By default, both ToolJet MCP and ToolJet AI operate only in the **development** [environment](/docs/development-lifecycle/environment/self-hosted/multi-environment), so an agent reads the data sources configured for development and not the ones behind staging or production.

We recommend connecting MCP only to instances whose development environment points at development data. If your development environment is wired to a production database, that separation gives you nothing.

## Protect the Token

The token is a credential with the same reach as the account that created it. Treat it accordingly.

- **Keep it out of version control.** It sits in plain text in your shell profile or your client's configuration file. If that file lives in a repository, the token is in your git history.
- **Use a project-local file that is already ignored.** For a single project, `.claude/settings.local.json` is git-ignored by default; `.claude/settings.json` is not.
- **Always use an `https://` instance URL.** The token is sent to `TOOLJET_URL` on every call, so an `http://` origin exposes it on the wire.
- **Do not paste it into a chat with your agent.** It belongs in the environment, not in a conversation that may be logged or retained by your model provider.
- **Rotate it if it is ever exposed**, including in a screen share or a support thread.

## What Leaves Your Machine

The MCP server runs locally and talks only to your ToolJet instance. It collects no analytics and sends no usage data to ToolJet or anyone else.

Timing metadata is attached to each tool result for the agent's benefit. It is written to disk only if you explicitly set `TOOLJET_TELEMETRY_PATH`, in which case it goes to a local file you choose and contains metrics only: tool name, duration, request counts, and response sizes. Query results and app content are never included.

Your prompts and the data the agent reads are, however, processed by your AI client's model provider. Their retention policy applies, not ToolJet's.

The connector is covered by [ToolJet's privacy policy](https://tooljet.com/privacy).

## Token Usage and Billing

The number of tokens consumed by an operation depends on the model you select, its reasoning effort setting, and the complexity of the request. These tokens are billed by your AI client's model provider, not by ToolJet, and building through MCP does not draw down your ToolJet AI credits.

## Related

- [Setup](/docs/build-with-ai/mcp/setup) — create a token and configure your client
- [Supported Tools](/docs/build-with-ai/mcp/supported-tools) — everything an agent can do once connected
