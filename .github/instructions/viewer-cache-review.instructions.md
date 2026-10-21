---
applyTo: "server/migrations/**/*,server/src/modules/licensing/constants/**/*,server/src/modules/app-permissions/**/*,server/src/modules/organization-themes/**/*,server/src/modules/apps/**/*,server/src/modules/versions/**/*"
excludeAgent: "coding-agent"
---

# Released-App Viewer Cache — Code Review Rules

The viewer reuses a released app saved in the browser while the server's key (`appDataRevision`, `server/src/modules/apps/app-data-revision.ts`) is unchanged. A change the key doesn't see serves viewers a stale app, and no test fails.

Flag a change that alters what an End User sees in a released app, unless the PR also does one of these:

- **New license flag** read by the released app (`getBySlug`) or the released version endpoint → added to `VIEWER_LICENSE_FIELDS`.
- **New table or column an admin or builder can change without a release** (permissions, app or workspace settings, themes) → a migration trigger that calls `tj_viewer_cache_touch_apps`, `tj_viewer_cache_touch_versions` or `tj_viewer_cache_touch_workspaces`, plus a case in `server/test/modules/apps/e2e/viewer-cache-stamps.spec.ts`.
- **Something that differs per viewer** → added to the inputs of `getAppDataRevision`.

No action needed for changes that only ship in a new ToolJet version (code, widget defaults, migrations): the server version is in the key. Full checklist: `server/src/modules/apps/AGENTS.md` § Released-app viewer cache.
