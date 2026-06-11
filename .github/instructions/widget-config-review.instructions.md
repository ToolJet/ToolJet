---
applyTo: "frontend/src/AppBuilder/WidgetManager/widgets/**/*"
excludeAgent: "coding-agent"
---

# Widget Config — Code Review Rules

## Server-Side Sync (CRITICAL)

When any file here is modified, the corresponding config in `server/src/modules/apps/services/widget-config/` MUST also be updated. Flag PRs that modify one without the other.

## Key Changes Require Migrations

If a config change moves, renames, or removes a key (e.g., moving `loadingState` from `styles` to `properties`), this WILL break existing apps. A migration MUST be written in `server/migrations/` to transform saved app definitions. Flag any key restructuring that lacks an accompanying migration.

## Widget Definition Rules

- New widgets MUST be lazy-loaded.
- Use `useBatchedUpdateEffectArray` for batched state updates.
- Widget components must be registered in `componentTypes.js`.

## Backward Compatibility

Always ask: "Would an app saved before this PR still load and behave correctly after it?"
