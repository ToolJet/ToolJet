---
applyTo: "server/src/modules/apps/services/widget-config/**/*"
excludeAgent: "coding-agent"
---

# Server Widget Config — Code Review Rules

## Frontend Sync (CRITICAL)

When any file here is modified, the corresponding config in `frontend/src/AppBuilder/WidgetManager/widgets/` MUST also be updated. Flag PRs that modify one without the other.

## Key Changes Require Migrations

If a config change moves, renames, or removes a key, a migration MUST be written in `server/migrations/` to transform saved app definitions.

The same change MUST also be added to `migrateProperties()` in `server/src/modules/apps/services/app-import-export.service.ts`, covering the same fields. The DB migration only fixes apps already in the database; an older app export imported later goes through `migrateProperties()` instead. Without it, the imported value stays in the old place and the widget silently falls back to its default. Flag any key restructuring that is missing either of the two.

## Backward Compatibility

No change should break existing saved applications. Always ask: "Would an app saved before this PR still load and behave correctly after it?"
