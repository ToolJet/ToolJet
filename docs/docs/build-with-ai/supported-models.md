---
id: supported-models
title: Supported Models
---

ToolJet's AI app builder can run on models from five providers. This page lists every model you can pick, what each one is good at, what a build typically costs in credits, and where your prompts are sent when a model is used.

## Choosing a model

Open the model picker in the AI chat. It shows a **Recommended** list across providers and a tab per provider. Each row carries a one-line character, a typical credit range for a one-page app and for a four-page app, and typical build minutes. The figures come from ToolJet's own same-prompt tests, in which every model built the same set of apps and each app was opened and checked. Your prompt, your data sources and the size of the app you ask for move the numbers.

On the **free plan** the picker offers DeepSeek V4.1 Flash, GPT-5.6 Luna and GPT-5.6 Terra, with GPT-5.6 Luna selected by default. Every other model is shown with what unlocks it. Paid plans can use every model below.

One credit is one US cent of the provider's list price for the tokens a build used. A build's exact credits appear in the chat while it runs and in your workspace's credit history afterwards.

## The models

### Recommended

| Model | Provider | Why it is recommended | One page | Four pages | Minutes |
|---|---|---|---|---|---|
| Claude Opus 5 | Anthropic | Most complete: every requested action works, at every app size | 250 to 450 | 400 to 650 | 7 to 21 |
| DeepSeek V4.1 Flash | DeepSeek | Complete apps, fast and cheapest | 20 to 30 | 45 to 70 | 10 to 25 |
| GPT-5.6 Sol | OpenAI | Balanced: good design at about half the price of Opus | 100 to 200 | 250 to 450 | 7 to 28 |
| GPT-5.6 Luna | OpenAI | Best value: complete apps for 8 to 45 credits in 5 to 17 minutes | 8 to 20 | 20 to 45 | 5 to 17 |

### OpenAI

| Model | Character | One page | Four pages | Minutes |
|---|---|---|---|---|
| GPT-6 Astra | Polished layouts; complete workflows on structured data | 250 to 350 | 300 to 550 | 6 to 17 |
| GPT-5.6 Sol | Well-designed pages for most apps at a mid-range price | 100 to 200 | 250 to 450 | 7 to 28 |
| GPT-5.6 Terra | Fast, cheap first drafts of small tools | 50 to 120 | 75 to 120 | 4 to 8 |
| GPT-5.6 Luna | Complete apps at the lowest price | 8 to 20 | 20 to 45 | 5 to 17 |

### Anthropic

| Model | Character | One page | Four pages | Minutes |
|---|---|---|---|---|
| Claude Fable 5.1 | The richest layouts, at the highest price | 300 to 650 | 600 to 1,350 | 6 to 20 |
| Claude Fable 5 | Rich, composed pages at a premium price | see Fable 5.1 | see Fable 5.1 | |
| Claude Opus 5 | The most complete apps: every requested action works | 250 to 450 | 400 to 650 | 7 to 21 |
| Claude Sonnet 5 | Clean layouts for two to three pages | 150 to 200 | 200 to 550 | 8 to 25 |
| Claude Haiku 4.5 | Lightweight; suited to small edits rather than new apps | about 56 | about 55 | |

### DeepSeek

| Model | Character | One page | Four pages | Minutes |
|---|---|---|---|---|
| DeepSeek V4.1 Flash | Complete apps at the lowest price, without the wait | 20 to 30 | 45 to 70 | 10 to 25 |

DeepSeek V4.1 Flash builds every requested page quickly. Charts sometimes fall back to default colours, and very large pages can stall on a single oversized step. See [Where your prompts go](#where-your-prompts-go) for how ToolJet reaches this model.

### Google

| Model | Character | One page | Four pages | Minutes |
|---|---|---|---|---|
| Gemini 3.6 Flash | Not yet tuned for this builder | 30 to 40 | 40 to 160 | 3 to 12 |

### xAI

| Model | Character | One page | Four pages | Minutes |
|---|---|---|---|---|
| Grok 4.6 | Straightforward, reliable layouts; the longest build times | about 238 | about 349 | 11 to 20 |
| Grok 4.5 | Basic layouts; the longest build times | | | |

## Where your prompts go

Your prompt, the app's structure and the sample data the builder reads are sent to the provider of the model you pick. Nothing is sent to any other provider.

| Provider | Endpoint | Notes |
|---|---|---|
| OpenAI | OpenAI's API | Used for GPT-6 Astra, GPT-5.6 Sol, Terra and Luna. |
| Anthropic | Anthropic's API | Used for the Claude models. |
| DeepSeek | OpenRouter, pinned to Fireworks AI | See below. |
| Google | Google's Gemini API | Used for Gemini 3.6 Flash. |
| xAI | xAI's API | Used for the Grok models. |

### How DeepSeek is served

ToolJet does not send anything to DeepSeek's own API. DeepSeek V4.1 Flash is an open-weight model, and ToolJet runs it through **OpenRouter** with the request pinned to **Fireworks AI**, a US-hosted inference provider. Every request carries three settings that OpenRouter enforces:

- the request may only be served by Fireworks, with no fallback to any other host;
- the host must not collect or train on the prompt or the output;
- the host must operate a zero-data-retention policy, so prompts and outputs are not stored after the response.

The picker shows this as the **No data retention** pill on the DeepSeek row. Pricing is Fireworks' flat rate, which OpenRouter passes through unchanged, so the credit figures above are the same whichever route serves the request.

## Using your own keys

Self-hosted workspaces can bring their own provider keys instead of using ToolJet credits. Set the key for each provider you want to offer:

| Provider | Environment variable |
|---|---|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| DeepSeek (through OpenRouter) | `OPENROUTER_API_KEY` |
| Google | `GEMINI_API_KEY` |
| xAI | `GROK_API_KEY` |

With your own keys, usage is billed by the provider directly and no ToolJet credits are consumed. The DeepSeek key is an OpenRouter key, and the Fireworks pin and the retention settings above still apply to every request.
