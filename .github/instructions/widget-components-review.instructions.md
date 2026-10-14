---
applyTo: "frontend/src/AppBuilder/Widgets/**/*"
excludeAgent: "coding-agent"
---

# Widget Components — Code Review Rules

## Component Rules

- New widgets MUST be lazy-loaded.
- Use `useBatchedUpdateEffectArray` for batched state updates.
- Widgets receive resolved props from `RenderWidget`. They must NOT directly access store state.
- `setExposedVariable` and `fireEvent` are passed as callbacks — widgets use these to communicate outward.
- Default values should use design tokens, not hardcoded hex colors.
