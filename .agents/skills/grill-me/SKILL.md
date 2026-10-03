---
name: grill-me
description: >-
  Stress-test a plan, design, or issue by walking every decision branch one question at a time
  until each is explicitly resolved and recorded. Use when asked to grill, stress-test, poke holes
  in, or challenge a plan or design, and when `kickoff` offers a grill between planning and
  filing. For App Builder widget test contracts use `app-builder-grill-me` instead.
---

# Grill me

The job is to find the gaps before code does. A grill that ends with "looks good overall" hasn't done its job.

## Input

- A plan file (for example `.agents/plans/<issue>-<slug>.md`), a GitHub issue (`gh issue view <n> --repo <repo> --comments`), or a design already in the conversation.
- If none is available, ask for one.

## Protocol

1. **Map the decision tree.** List every decision, assumption, and open question in the input. Order them by dependency: don't ask about B while B depends on the answer to A.
2. **Look before asking.** If the code can answer a question, read it and present what you found instead of asking.
   - Start from the nearest `AGENTS.md`, `UBIQUITOUS_LANGUAGE.md`, and `.agents/context/product-map.md` / `architecture-map.md`.
   - ToolJet-specific branches to probe:
     - CE/EE/Cloud scope and which submodule holds the change;
     - CASL abilities and guards;
     - entity and migration shape;
     - behavior on existing data;
     - git-sync, import/export and versioning of anything persisted in an app definition.
3. **Ask exactly one question per message.** State the decision, your recommended answer, and what each option leads to.
4. **Probe the answer.** A quick "yes" to a non-obvious decision gets one follow-up: why this and not the alternative? Confidence is not correctness.
5. **Record the resolution** before moving on, as `Decision → resolution — rationale`.
6. **Stop only when every branch is resolved:** behavior, edge cases, edition scope, ownership, and how each outcome will be verified.

## Output

```
## Resolved decisions
1. **<decision>**: <resolution> — <rationale>
...
## Still open
- <anything the user deferred, with the owner>
```

If the input was a plan file, update it with the resolutions. If it was a GitHub issue, offer to append them as a comment. Never edit the issue body.

## Rules

- No code or test changes while grilling.
- No batching of questions, and no "all resolved" without the list above.
- Label claims **Confirmed** (seen in code or docs), **Inference**, or **Unknown**.
