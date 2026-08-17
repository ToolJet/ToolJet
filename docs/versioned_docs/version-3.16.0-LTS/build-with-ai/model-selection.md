---
id: model-selection
title: Selecting an AI Model
---

ToolJet AI lets you control which LLM powers your AI chats. Depending on your workspace's AI setup, you can either switch between providers, or pick an exact model.

:::info
Switching the provider is available for workspaces using **ToolJet Managed AI Server**. Picking an exact model requires configuring **OpenRouter** as your LLM provider under [Bring Your Own Key (BYOK)](/docs/setup/tooljet-ai/bring-your-own-key).
:::

## Switching the AI Provider

If your workspace uses ToolJet Managed AI Server (the default on ToolJet Cloud and self-hosted), each user can switch which LLM provider powers their own AI chats, for example, between Anthropic and Grok.

This only lets you pick the provider, not an exact model within it. If you need a specific model, see [Selecting an Exact Model](#selecting-an-exact-model) below.

### How It Works

- **Per-user setting**: The provider you select is a personal preference. Other users in your workspace can pick a different provider for themselves without affecting your setting.
- **Applies to all your chats**: Once you switch, the new provider is used across all of your AI chats in the workspace, not just the chat you switched it in.

### Where to Find It

1. Open the AI chat interface in App Builder.
2. Click the context window indicator at the bottom of the chat.
    <img className="screenshot-full img-s"  src="/img/tooljet-ai/best-practice/context-v2.png" alt="tooljet ai doc assistant" />
3. Use the **LLM provider** option in the panel to select a different provider.

### When You Can Switch

- You can pick a provider freely before sending your first prompt in a chat.
- Once you send a prompt, ToolJet AI carries out the work in phases (for example, asking clarifying questions first, then generating). You can't change the provider in the middle of a phase, since it has to be completed by the same provider that started it. You can switch once the current phase finishes and before the next one begins.

:::info
If your admin has configured [BYOK](/docs/setup/tooljet-ai/bring-your-own-key) or [ToolJet Enterprise AI](/docs/setup/tooljet-ai/tj-ai-enterprise) for the workspace, the LLM is enforced by the admin and this per-user switch is not available.
:::

## Selecting an Exact Model

To choose a specific model instead of just a provider, configure **OpenRouter** as your LLM provider under BYOK. Only models that are compatible with ToolJet AI are available.

:::info
This is configured at the instance level by an admin, like the rest of BYOK, it is not a per-user setting.
:::

#### Steps

1. Navigate to **Settings → LLM Key** in your ToolJet workspace.
2. From the provider dropdown, select **OpenRouter**.
    <img className="screenshot-full img-m"  src="/img/tooljet-ai/model/open-router.png" alt="tooljet ai doc assistant" />
3. A second dropdown appears listing the available models. Select the model you want to use.
    <img className="screenshot-full img-s"  src="/img/tooljet-ai/model/models.png" alt="tooljet ai doc assistant" />
4. Enter your OpenRouter API key.
5. Click **Save changes**.

See [Bring Your Own Key (BYOK)](/docs/setup/tooljet-ai/bring-your-own-key) for the full BYOK setup guide.

## Things to Keep in Mind

- Different providers and models can consume a different number of credits for the same task. See [Understanding AI Credits](/docs/build-with-ai/ai-credits) for how credit consumption is calculated.
- Non-default providers and models haven't yet been individually tuned to match the output quality of the default, so you may notice some difference in results when using them.
- OpenRouter offers a large number of models, but not all of them are fully compatible with ToolJet (for example, some have a context window that doesn't match ToolJet's requirements). If a model you pick behaves unexpectedly, try switching to a different one.
