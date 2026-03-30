---
id: bring-your-own-key
title: Bring Your Own AI Key & Self-hosted AI
---

ToolJet provides flexible approaches for integrating AI capabilities into your workspace, designed to accommodate varying requirements around data security, infrastructure control, and cost management.

1. **Using ToolJet AI Credits** - Use ToolJet's fully managed AI infrastructure with no external setup required. AI requests are routed through ToolJet's servers and billed against the AI credits allocated to your workspace, no LLM provider account or API key needed. Refer to [Understanding AI Credits](/docs/build-with-ai/ai-credits) documentation for more information.
2. **Bring Your Own Key**: Supply your own LLM provider API key. All AI requests are processed using your key via ToolJet's AI server — no ToolJet credits are consumed.
3. **Self-hosted AI**: Deploy a ToolJet-provided Python server image within your own infrastructure. AI workloads execute entirely on your servers; no data is transmitted to or processed by ToolJet.

| Capability                   | ToolJet AI Credits | Bring Your Own Key | Self-hosted AI |
| ---------------------------- |:------------------:|:------------------:|:--------------:|
| Uses your API key            | ❌                  | ✅                  | ✅              |
| Uses ToolJet AI server       | ✅                  | ✅                  | ❌              |
| Available on ToolJet cloud   | ✅                  | ✅                  | ❌              |
| Requires self-hosting        | ❌                  | ❌                  | ✅              |
| AI credits required          | ✅                  | ❌                  | ❌              |

## Bring Your Own Key (BYOK)

Bring Your Own Key allows you to configure an API key from a supported LLM provider directly within ToolJet's settings. Once configured, all AI-powered features will authenticate using your key rather than ToolJet-managed credentials. This means:
1. **Cost control**: Usage is billed directly to your LLM provider account. ToolJet does not charge AI credits for these requests.
2. **Visibility**: You can monitor usage and set spending limits through your LLM provider's dashboard.
3. **Compatibility**: BYOK works on both ToolJet Cloud Deployment and a Self Hosted Deployment; no infrastructure changes are required on your end.

### Configuring Your API Key

1. Navigate to Settings → LLM Key in your ToolJet workspace.
2. Enter your API key from your LLM provider (e.g., your Anthropic API key from console.anthropic.com).
3. Click Save.

### Supported Providers

**Currently, only Anthropic is supported**. Support for additional LLM providers is planned for future releases.

## Self-hosted AI

Self-hosted AI enables you to run all AI workloads entirely within your own infrastructure by deploying a ToolJet-provided Python server image. Unlike BYOK, no AI request data is transmitted to ToolJet servers. This option is intended for organizations with strict data residency or compliance requirements, or those operating in air-gapped or private-cloud environments.

When to use Self-hosted AI:

- **Full data isolation**: All AI execution happens on infrastructure you control. ToolJet servers are not involved in processing requests.
- **Flexible key management**: You can supply the API key through the ToolJet UI or inject it directly as an environment variable on the Python server, passing through environment variable is preferable for secrets management in automated or containerized deployments.

:::info Not available on ToolJet Cloud
Self-hosted AI requires that you deploy and operate the ToolJet Python server image yourself.
:::

### Configuring Your API Key

There are two methods for providing your LLM API key to the self-hosted Python server:

#### Configure via the ToolJet UI

This method is suitable when you prefer centralised key management through the ToolJet interface.

1. Navigate to Settings → LLM Key in your ToolJet workspace.
2. Enter your API key.
3. Click Save.

ToolJet will securely forward the key to your Python server when making AI requests.

### Use an Environment Variable

This method is recommended for production deployments, CI/CD pipelines, or environments where secrets should not be entered through a UI.

1. In Settings → LLM Key, enable the Use environment variable toggle.
2. Set the `ANTHROPIC_API_KEY` environment variable directly on your Python server:

The server will read the key from the environment at runtime. ToolJet will not transmit the key from the UI.

### Supported Providers

**Currently, only Anthropic is supported**. Support for additional LLM providers is planned for future releases.