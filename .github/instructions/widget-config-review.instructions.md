---
applyTo: "packages/widget-definitions/**/*"
excludeAgent: "coding-agent"
---

# Widget Config — Code Review Rules

## Single Source of Truth (CRITICAL)

These are the only widget definitions. The builder (frontend) and the server (defaults on load, validation) both import them from `@tooljet/widget-definitions`. Flag any PR that adds a copy of a widget config anywhere else. A new widget must be exported from `src/index.js` and registered in the frontend `WidgetManager/configs/widgetConfig.js` and the server `apps/services/widget-config/index.js`.

## Key Changes Require Migrations

If a config change moves, renames, or removes a key (e.g., moving `loadingState` from `styles` to `properties`), this WILL break existing apps. A migration MUST be written in `server/migrations/` to transform saved app definitions. Flag any key restructuring that lacks an accompanying migration.

## Widget Definition Rules

- New widgets MUST be lazy-loaded.
- Use `useBatchedUpdateEffectArray` for batched state updates.
- Widget components must be registered in `componentTypes.js`.

## Backward Compatibility

Always ask: "Would an app saved before this PR still load and behave correctly after it?"
