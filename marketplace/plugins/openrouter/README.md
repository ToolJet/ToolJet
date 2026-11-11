# OpenRouter

One credential for hundreds of models across providers, through
[OpenRouter](https://openrouter.ai). The API is OpenAI-compatible, so the **Base URL** is editable and
this connector also works with Together, Groq, Fireworks, LiteLLM, vLLM or a self-hosted
OpenAI-compatible gateway, including deployments where prompts must not leave the network.

## Operations

| Operation | What it returns |
| --- | --- |
| Chat | `message` plus `finish_reason`, the `model` and `provider` that actually served it, and `usage` |
| Generate embedding | `embedding` for a single input, `embeddings` for several |
| List models | The catalogue with ids, context lengths and pricing, for populating a dropdown |

## Two fields worth knowing about

**Fallback models** names models to try when the first is down, rate limited, or refuses. The response
reports which model and provider answered, so an app can show it.

**Provider data policy** set to "Only providers that do not train on prompts" refuses any provider that
trains on what you send. Use it when customer data goes through this connector.

## Setup

1. Create a key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Paste it into **API Key**. Leave **Base URL** blank for OpenRouter.
3. Optionally set **Site URL** and **App name**; OpenRouter shows them on its dashboards.

## Logo

`lib/icon.svg` is OpenRouter's own glyph (grape) from [openrouter.ai/brand](https://openrouter.ai/brand), used as published: scaled uniformly into ToolJet's 24x24 icon box and centred, with no stretching or recolouring, per their brand rules.
