---
applyTo: "server/data-migrations/**/*"
---

# 💡 Data Migration Logging Guidelines

To help the team monitor progress during deployments, please ensure new migrations follow these lightweight logging nudges:

## 🟢 Suggested Logging Pattern

1. **Baseline:** Before starting, query and log the total records to be processed.
   - *Log:* `[START] {Action} | Total: {Total}`
   - *Why:* This establishes the "denominator" for progress tracking.

2. **The Ratio:** During execution, log progress using a **current/total** format.
   - *Log:* `[PROGRESS] {Current}/{Total} ({Percentage}%)`
   - *Why:* This allows anyone monitoring the logs to estimate time-to-completion.

3. **Confirmation:** Log a final success message once complete.
   - *Log:* `[SUCCESS] {Action} finished.`

---

## 🔍 Reviewer Checklist
When reviewing changes in `server/data-migrations`, look for:
- [ ] A query that establishes a **Total Count** at the start.
- [ ] Log statements using the **`x/total`** ratio.
- [ ] A clear **Success** log at the end of the script.

---

## 🤖 Instructions for Copilot
When generating code for this path:
- Include a count query for the denominator before processing.
- Wrap iterative logic in a batch/loop that logs `current/total` progress.
- Avoid silent bulk updates that provide no console feedback.