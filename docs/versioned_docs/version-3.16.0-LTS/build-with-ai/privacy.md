---
id: privacy
title: Privacy Policy
---

<br/>

### 1. Data Sharing Commitments

You decide which data sources ToolJet's AI features can reach, and this section describes what is shared when you use them.

**Credential Security**: We do not share any data source credentials (such as database passwords or API keys) with our AI servers or third-party LLM providers. If you are self-hosting, these credentials never leave your deployment. If you are using ToolJet Cloud, this data never leaves our secure servers.

**Data Discovery**: Your schema is what the AI is designed to work from, but it is not a boundary we can enforce. When the AI explores a connected data source to identify the entities relevant to your application, we cannot guarantee that it will not read data within your tables. Discovery is not deterministic, and its behavior depends on the underlying model you select. If a table must never be read by the AI, do not expose it through the credentials you connect.

### 2. Deployment Options

You can meet your organization's specific security, compliance, and data residency requirements while maintaining control over your infrastructure with our self-hosted deployment option.

While we currently utilize cloud-based LLMs (such as Anthropic and OpenAI) for AI features, these integrations can be managed or disabled by workspace administrators.

If you require a strictly air-gapped environment, you can set up a separate instance of ToolJet for development, or choose to disable the AI schema-reading capabilities to ensure no structural data leaves your internal network.

Self-hosted enterprise plan of ToolJet has an option to deploy our AI gateway on-premise with your own LLM keys. Reach out to hello@tooljet.com for details.

### 3. Data Usage Policies

Your proprietary information, business processes, and competitive advantages remain exclusively yours.

**Zero Training Policy**: We do not use any user data, database schemas, or sample data to train, fine-tune, or improve our AI models, nor do we allow our third-party LLM providers to do so. Your data is strictly used to facilitate the operation of the ToolJet platform.

### 4. Questions and Clarifications

For clarifying any information on this page, please reach out to hello@tooljet.com.