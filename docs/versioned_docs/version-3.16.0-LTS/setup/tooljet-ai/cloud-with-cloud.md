---
id: cloud-with-cloud
title: Setup ToolJet Cloud AI with ToolJet Cloud
---

This is the default AI setup for any workspace on **ToolJet Cloud**. AI requests are routed through ToolJet AI Cloud and authenticated using ToolJet-managed LLM credentials, billed against your workspace's [AI credits](/docs/build-with-ai/ai-credits).

:::info
See [Setup ToolJet AI &rarr; Overview](/docs/setup/tooljet-ai/overview) for how this fits alongside the other AI setups and how the request is processed end-to-end.
:::

## Prerequisites

None. Every ToolJet Cloud workspace has AI features enabled by default.

## Setup

There is no setup required:

1. Sign in to your ToolJet Cloud workspace.
2. Start using any [AI capability](/docs/build-with-ai/overview#ai-capabilities), for example, generating an application or fixing a component with AI.
3. Usage is metered against your workspace's monthly and add-on AI credits. You can check consumption anytime under **Settings &rarr; Subscription**.

## Billing

Credits are pooled at the **workspace level**. See [Understanding AI Credits](/docs/build-with-ai/ai-credits) for how consumption is calculated and how to purchase add-on credits.

## Switching to a Different Setup

If you'd rather use your own LLM API key while remaining on ToolJet Cloud, so usage is billed directly by your provider instead of consuming AI credits, see [Setup ToolJet Cloud AI (BYOK)](/docs/setup/tooljet-ai/bring-your-own-key).
