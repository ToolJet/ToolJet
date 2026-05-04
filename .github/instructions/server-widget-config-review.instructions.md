---
applyTo: "server/src/modules/apps/services/widget-config/**/*"
excludeAgent: "coding-agent"
---

# Server Widget Config — Code Review Rules

## Frontend Sync (CRITICAL)

When any file here is modified, the corresponding config in `frontend/src/AppBuilder/WidgetManager/widgets/` MUST also be updated. Flag PRs that modify one without the other.

## Key Changes Require Migrations

If a config change moves, renames, or removes a key, a migration MUST be written in `server/migrations/` to transform saved app definitions. Flag any key restructuring that lacks an accompanying migration.

## Backward Compatibility

No change should break existing saved applications. Always ask: "Would an app saved before this PR still load and behave correctly after it?"
