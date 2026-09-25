---
id: troubleshooting
title: Troubleshooting
---

Fixes for common problems when connecting ToolJet MCP to [Claude Code](/docs/build-with-ai/mcp/setup/claude-code), [Codex](/docs/build-with-ai/mcp/setup/codex), or [other MCP clients](/docs/build-with-ai/mcp/setup/other-clients).

| Symptom | Cause and fix |
| ------- | ------------- |
| The server reports a missing variable | `TOOLJET_PAT` or `TOOLJET_DEPLOYMENT_URL` didn't reach the server. Set them where your client reads them: your shell profile or Claude Code settings file for Claude Code, your shell profile for Codex, or the `env` block in your MCP configuration for other clients. Then restart your client, which reads them at launch. |
| Tools don't appear at all | Your client didn't start the server. Confirm `node --version` is 20 or newer and that your client can see it. For other MCP clients, also check that the path to `bundle/index.js` is absolute and correct. |
| Calls fail with an authentication error | The token is expired, revoked, or was copied incompletely. Create a fresh one under **Profile settings > Personal access tokens**. |
| Calls fail with a connection error | `TOOLJET_DEPLOYMENT_URL` is wrong or unreachable from your machine. If your API and UI are on different origins, set `TOOLJET_URL` to the backend origin. |
| The agent can't see the workspace you expected | A token's session is pinned to the workspace it was created in. Create a token in that workspace instead. |
| App links point at localhost | `TOOLJET_DEPLOYMENT_URL` is still at its default. Set it to your instance URL. |

## Related

- [Setup](/docs/build-with-ai/mcp/setup)
- [Supported Tools](/docs/build-with-ai/mcp/supported-tools)
- [Security](/docs/build-with-ai/mcp/security)

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
