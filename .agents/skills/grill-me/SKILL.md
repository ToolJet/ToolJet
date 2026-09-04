---
name: grill-me
description: Stress-test a plan or product decision one question at a time until the user and agent share an explicit understanding.
---

# Grilling

Use this skill when a behavior decision is unresolved or when the user asks to stress-test a
plan. Walk the decision tree one branch at a time. Do not silently choose product behavior.

## Protocol

1. Look up facts in the repository or other available sources before asking about them.
2. Ask exactly one decision question at a time.
3. Include a recommended answer and the consequence of each decision.
4. Wait for the user's answer before asking the next question.
5. Stop only when the behavior, edge cases, ownership, and verification boundary are explicit.
6. Do not change production code or tests until the user confirms shared understanding.

This repository copy is intentionally self-contained so widget-test agents do not depend on a
machine-local skill installation.
