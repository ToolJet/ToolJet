---
id: bring-your-own-key
title: Bring Your Own Key (BYOK)
---

<PlanBadge type="enterprise" />

Bring Your Own Key (BYOK) allows you to configure an API key from a supported LLM provider directly within ToolJet's settings. Instead of routing AI requests through ToolJet's managed credentials and consuming ToolJet AI credits, ToolJet will authenticate all AI requests using your own key.

This is useful when you want direct control over your AI usage and costs. Since the API key belongs to your LLM provider account, you get full visibility into consumption, can set your own rate limits and spending caps, and are billed directly by the provider, independently of your ToolJet subscription.

BYOK does not require any infrastructure changes. Requests continue to be processed via ToolJet AI Cloud, with the only difference being the credentials used to authenticate them.

:::info
AI requests still route through ToolJet AI Cloud when using BYOK. If your organization requires that no data leaves your own infrastructure, refer to [ToolJet AI Enterprise](/docs/build-with-ai/tj-ai-enterprise).
:::

This means:

1. **Cost control**: Usage is billed directly to your LLM provider account. ToolJet does not charge ToolJet AI credits for these requests.
2. **Visibility**: You can monitor usage and set spending limits through your LLM provider's dashboard.
3. **Compatibility**: BYOK works on both ToolJet Cloud and Self-hosted deployments; no infrastructure changes are required on your end.

## Configuring Your API Key

1. Navigate to **Workspace Settings → LLM Key** in your ToolJet workspace.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/byok/llm-key.png" alt="llm key" />
2. Enter your API key from your LLM provider (e.g., your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)).
3. Click **Save changes**.

ToolJet will securely forward the key to your server when making AI requests.

## Supported Providers

**Currently, only Anthropic is supported.** Support for additional LLM providers is planned for future releases.

## Frequently Asked Questions

<details id="tj-dropdown">
<summary>**Will I still be charged ToolJet AI credits after configuring BYOK?**</summary>

No. Once a valid API key is configured, all AI requests are authenticated using your key and billed directly to your LLM provider account. ToolJet AI credits are not consumed.
</details>

<details id="tj-dropdown">
<summary>**Does my API key get stored by ToolJet?**</summary>

Your API key is stored securely within your ToolJet workspace settings. It is used solely to authenticate AI requests on your behalf.
</details>

<details id="tj-dropdown">
<summary>**Does BYOK work if I am using ToolJet Cloud?**</summary>

Yes. BYOK is compatible with both ToolJet Cloud and self-hosted deployments.
</details>

<details id="tj-dropdown">
<summary>**Can I switch back to ToolJet AI credits after configuring BYOK?**</summary>

Yes. You can remove your API key from **Workspace Settings → LLM Key** at any time to revert to ToolJet AI credits.
</details>

<details id="tj-dropdown">
<summary>**What happens if my API key is invalid or expires?**</summary>

AI-powered features will fail to execute until a valid key is provided. You will need to update the key in **Workspace Settings → LLM Key**.
</details>