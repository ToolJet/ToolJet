---
id: ai-model-performance
title: AI Model Performance and Credit Usage
---

# AI Model Performance and Credit Usage

Different AI models can vary significantly in how much of an app they complete, how long they take, and how many credits they use.

To compare them, we tested the same models across **9 ToolJet app-building tasks**, ranging from one-page tools and app edits to four- and five-page apps, detailed specifications, and apps using external data sources.

> **Benchmark snapshot:** Results are based on one run per model per task. Use them as directional guidance, not a guaranteed success rate.

## Recommended models

| What you're building | Recommended model | Key benchmark result |
|---|---|---|
| **One-page tool** | **Luna medium** | Built the one-page visitor log for **10 credits** in **5.2 min** |
| **2–3 page app with workflows** | **Opus 5**, **Astra**, or **Fable 5.1** | Strong feature completion; typically **300–650 credits** and **11–15 min** |
| **4–5 page app** | **Opus 5** | Highest feature completion overall: **9.6/10** average |
| **Large app on a lower credit budget** | **Luna max** | **8.7/10** average features for **19–51 credits**, but slower |
| **Long, exact specification** | **Opus 5**, **Astra**, **Fable 5.1**, or **Luna max** | These models followed **22–24 of 25** explicit requirements in the detailed-spec test |
| **Editing an existing app** | **Luna medium** or **Sol** | All models completed the tested edit; Luna medium used **4 credits** in about **2 min** |
| **External database / ServiceNow workflows** | **Astra** or **Fable 5.1** for write-back | Both completed every tested ServiceNow write action |

## Model comparison

For model selection, the most useful metrics are:

- **Features** — how much of the requested functionality worked when tested.
- **Credits** — the approximate cost of generating the app.

| Model | Avg. features | Credits per build* | Time per build* | Best fit |
|---|---|---|---|---|
| **Opus 5** | **9.6/10** | 273–636 | 6.7–21.0 min | Most complete apps |
| **Luna max** | **8.7/10** | **19–51** | 17.0–61.2 min | Large apps on a budget |
| **Fable 5.1** | 8.4/10 | 344–1,349 | 5.7–19.5 min | High-quality UI and complex apps |
| **Sol** | 8.1/10 | 125–456 | 6.7–28.0 min | Balanced default |
| **Astra** | 8.0/10 | 266–558 | 5.9–17.3 min | Complex workflows and external write-back |
| **Luna medium** | 6.3/10 | **8–27** | 5.1–17.4 min | Small apps and edits |
| **Sonnet 5** | 6.3/10 | 150–547 | 8.0–25.1 min | Smaller multi-page apps |
| **Luna high** | 5.9/10 | 10–49 | 7.3–40.1 min | — |
| **Terra** | 5.3/10 | 55–118 | **4.2–7.9 min** | Small, fast builds |
| **Gemini Flash** | 3.6/10 | 32–161 | 2.6–12.3 min | — |
| **Gemini Pro** | 2.8/10 | 32–118 | **1.6–11.0 min** | — |

\*Ranges cover 1–5 page app-generation tasks and exclude app edits.

## Key trade-offs

### Most complete: Opus 5

**9.6/10 average features · 273–636 credits · 6.7–21.0 min**

Opus had the highest feature-completion score in the benchmark and was the only model to deliver every page working across all three large-app prompts.

Choose Opus when completeness matters more than credit usage.

### Best value for small apps: Luna medium

**6.3/10 average features · 8–27 credits · 5.1–17.4 min**

Luna medium was consistently inexpensive and performed well on one-page tools and edits. It became less reliable as app complexity increased.

Choose Luna medium for smaller apps, straightforward workflows, and incremental changes.

### Large apps on a budget: Luna max

**8.7/10 average features · 19–51 credits · 17.0–61.2 min**

Luna max delivered feature completion close to the higher-cost models while using substantially fewer credits.

The trade-off is time: its builds took between **17 and 61 minutes**, and one reached the turn cap.

### Balanced option: Sol

**8.1/10 average features · 125–456 credits · 6.7–28.0 min**

Sol combined strong feature completion with good UI at a lower typical cost than Opus or Fable.

It performed well across several app types, but missed more requirements on the longest, most detailed specification.

## Cost does not directly predict quality

Higher credit usage did not consistently produce a more complete app.

For a typical four-page build in the benchmark, approximate usage was:

| Model | Approx. credits |
|---|---|
| Luna medium | **20** |
| Sol | **340** |
| Opus 5 | **490** |
| Fable 5.1 | **610** |

For larger apps, choosing a higher-cost model can improve feature completion, but the most expensive model is not always the best choice.

## Things to know

- **Luna max is inexpensive but slow.** Builds ranged from 17 to 61 minutes.
- **Terra is better suited to smaller apps.** It performed well on one- and two-page tasks but often stopped early on larger builds.
- **Luna high was inconsistent in this benchmark.** Luna medium or Luna max were more reliable choices.
- **Fable 5.1 produced consistently strong UI, but at the highest credit usage.**
- **Gemini Flash and Gemini Pro are not optimized for ToolJet app generation.** In this benchmark, they were unreliable on larger tasks and may produce apps that do not work as expected.

## How the benchmark was measured

Each model received one run per task with no quality retries. The generated apps were then tested in the browser, including performing requested actions and verifying their effects in the database.

The benchmark measured:

| Metric | What it represents |
|---|---|
| **Features** | Requested functionality that worked when tested |
| **UI** | Visual quality and usability |
| **Credits** | AI usage at provider list pricing |
| **Time** | Wall-clock time from prompt to final response |

The overall benchmark score weighted these metrics as **35% features, 30% UI, 20% credits, and 15% time**.

> **Credits:** 1 credit represents 1/100 of a US dollar at the provider list price used by the benchmark. Actual ToolJet credit consumption can vary with task complexity and conversation context.
