---
id: tj-ai-enterprise
title: ToolJet AI Enterprise
---

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

ToolJet AI Enterprise is designed for organizations that require complete control over where their data is processed. Rather than routing AI requests through ToolJet Managed AI Server, you deploy a ToolJet-provided server image within your own environment. All AI workloads execute on your servers, using your own LLM API key, no data is transmitted to or processed by ToolJet at any point.

This is particularly relevant for organizations operating under strict data residency regulations, internal compliance policies, or those running in air-gapped or private-cloud environments where external network calls to third-party servers are not permitted.

Benefits of ToolJet AI Enterprise:

- **Cost control**: Usage is billed directly to your LLM provider account. ToolJet does not charge ToolJet AI credits for these requests.
- **Visibility**: You can monitor usage and set spending limits through your LLM provider's dashboard.
- **Full data isolation**: All AI execution happens on infrastructure you control. ToolJet servers are not involved in processing requests.
- **Flexible key management**: Supply your API key through the ToolJet UI or inject it directly as an environment variable on the server. Using an environment variable is preferable for secrets management in automated or containerized deployments.

:::info Not available on ToolJet Cloud
ToolJet AI Enterprise requires that you deploy and operate the ToolJet-provided server image yourself.
:::

## Deploying the Server Image

Please reach out to our support team at [support@tooljet.com](mailto:support@tooljet.com). They will assist you with the server image and the steps required to deploy it.

## Configuring Your API Key

There are two methods for providing your LLM API key to the server:

### Configure via the ToolJet UI

This method is suitable when you prefer centralised key management through the ToolJet interface.

1. Navigate to **Workspace Settings → LLM Key** in your ToolJet workspace.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/byok/llm-key-v2.png" alt="llm key" />
2. Select the provider you want to use. By default "ToolJet managed" will be selected which utilizes the ToolJet AI Credits.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/byok/select.png" alt="llm key" />
3. After that, enter your API key from your LLM provider (e.g., your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)).
4. Click **Save changes**.

ToolJet will securely forward the key to your server when making AI requests.

### Use an Environment Variable

This method is recommended for production deployments, CI/CD pipelines, or environments where secrets should not be entered through a UI.

1. Configure the following environment variables:
    1. `LLM_PROVIDER`: You can set your LLM Provider using this variable.
        | Value | When to use |
        |:------|:------------|
        | `anthropic` | When you want to use Anthropic API Key |
        | `gemini` | When you want to use Gemini API Key |
        | `tooljet_managed` | When you want to use ToolJet Managed AI Credits. |
    2. Set the following variable according to which LLM Provider you are using:
        - `ANTHROPIC_API_KEY=<your-api-key>`: If you are using Anthropic.
        - `GEMINI_API_KEY=<base64-string-of-your-JSON>`: If you are using Gemini.
2. Once you have configured the above variables, navigate to **Workspace Settings → LLM Key** in your ToolJet workspace and turn on the "Apply configuration from environment variable" toggle.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/tooljet-ai/byok/env-var-v3.jpg" alt="llm key" />

The server will read the key from the environment at runtime. ToolJet will not transmit the key from the UI.

## Supported Providers

**Currently, only Anthropic is supported.** Support for additional LLM providers is planned for future releases.

## Frequently Asked Questions

<details id="tj-dropdown">
<summary>**What is the difference between BYOK and ToolJet AI Enterprise?**</summary>

With BYOK, your API key is used but requests are still routed through ToolJet Managed AI Server. With ToolJet AI Enterprise, you host the server yourself, no data leaves your infrastructure at any point.
</details>

<details id="tj-dropdown">
<summary>**Is ToolJet AI Enterprise available on ToolJet Cloud?**</summary>

No. ToolJet AI Enterprise requires you to deploy and operate the ToolJet-provided server image within your own infrastructure.
</details>

<details id="tj-dropdown">
<summary>**Which method of API key configuration should I use?**</summary>

For production or automated deployments, environment variables are recommended as they keep secrets out of the UI and align with standard secret management practices. The UI method is suitable for simpler setups or development environments.
</details>

<details id="tj-dropdown">
<summary>**What happens if both the UI key and the environment variable are configured?**</summary>

When the **Apply configuration from environment variables** toggle is enabled, the server uses the environment variable and ignores any key entered via the UI.
</details>

<details id="tj-dropdown">
<summary>**Can I use ToolJet AI Enterprise in an air-gapped environment?**</summary>

Yes, provided the server image can be deployed within your network and your LLM provider's API is accessible from that environment.
</details>