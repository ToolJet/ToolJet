---
applyTo: "server/data-migrations/**/*"
---

# Data Migration — Logging Guidelines

New migrations MUST include progress logging to help monitor deployments.

## Required Logging Pattern

1. **Baseline** — Before processing, query and log total records:
   `[START] {Action} | Total: {Total}`

2. **Progress** — During execution, log using current/total format:
   `[PROGRESS] {Current}/{Total} ({Percentage}%)`

3. **Confirmation** — Log final success:
   `[SUCCESS] {Action} finished.`

## Reviewer Checklist

- [ ] Count query establishes a **total** before processing
- [ ] Log statements use the **`x/total`** ratio pattern
- [ ] Clear **success** log at the end
- [ ] No silent bulk updates without console feedback

## When Generating Migration Code

- Include a count query for the denominator before processing.
- Wrap iterative logic in a batch/loop that logs `current/total` progress.
- Avoid silent bulk updates that provide no console feedback.
