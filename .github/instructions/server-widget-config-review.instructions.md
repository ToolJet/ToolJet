---
applyTo: "server/src/modules/apps/services/widget-config/**/*"
excludeAgent: "coding-agent"
---

# Server Widget Config — Code Review Rules

## Registry Only (CRITICAL)

This folder holds only the server's widget registry (`index.js`), which imports the definitions from `@tooljet/widget-definitions` (`packages/widget-definitions`). Flag any widget config file added here: definitions belong in `packages/widget-definitions/src/widgets/`.

## Key Changes Require Migrations

If a config change moves, renames, or removes a key, a migration MUST be written in `server/migrations/` to transform saved app definitions. Flag any key restructuring that lacks an accompanying migration.

## Backward Compatibility

No change should break existing saved applications. Always ask: "Would an app saved before this PR still load and behave correctly after it?"
