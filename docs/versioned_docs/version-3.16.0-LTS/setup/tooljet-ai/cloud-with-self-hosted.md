---
id: cloud-with-self-hosted
title: Setup ToolJet Cloud AI with ToolJet Self Hosted
---

<PlanBadge type="self-hosted" />

Self-hosted ToolJet instances can use ToolJet-managed AI instead of deploying a separate AI server. AI requests from your instance are sent over the internet to ToolJet AI Cloud, authenticated with ToolJet-managed LLM credentials, and billed against your instance's AI credits.

:::info
See [Setup ToolJet AI &rarr; Overview](/docs/setup/tooljet-ai/overview) for how this fits alongside the other AI setups and how the request is processed end-to-end.
:::

## Prerequisites

- A ToolJet license with the AI feature enabled.
- Outbound HTTPS (443) access from your ToolJet server to ToolJet AI Cloud.

## Whitelisting Network Access

If your instance runs behind a firewall, proxy, or restricted egress policy, allow outbound HTTPS access to the following domains:

| Domain | Purpose |
|---|---|
| `https://api-gateway.tooljet.ai` | Routes AI requests to the configured LLM provider |
| `https://python-server.tooljet.ai` | Backs AI operations that require the Python execution service |

If your instance uses an [HTTP proxy](/docs/setup/http-proxy), make sure these domains are reachable through it.

## Setup

1. Confirm your license includes AI credits. If you need to purchase more, follow the **Self-Hosted Deployment** steps under [Buy Add-on Credits](/docs/build-with-ai/ai-credits#buy-add-on-credits).
2. Whitelist the domains listed above in your firewall, proxy, or network egress rules.
3. No further configuration is needed. AI features become available in your workspace automatically, billed against your instance's pooled AI credits.

## Billing

Credits are pooled at the **instance level** for self-hosted deployments. See [Understanding AI Credits](/docs/build-with-ai/ai-credits#credit-allocation) for details.

## Switching to a Different Setup

- To use your own LLM API key while continuing to route requests through ToolJet AI Cloud, see [Setup ToolJet Cloud AI (BYOK)](/docs/setup/tooljet-ai/bring-your-own-key).
- To keep all AI traffic entirely within your own infrastructure with no data sent to ToolJet AI Cloud, see [Setup ToolJet Enterprise AI](/docs/setup/tooljet-ai/tj-ai-enterprise).
