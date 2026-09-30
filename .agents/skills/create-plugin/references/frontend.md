# Frontend: manifest.json, operations.json, openapi-specs/

Inputs: `plugin-spec.json`, the PRD, the design reference (or none), the plugin directory.
Read `manifest-and-operations.md` first; widget names must match it exactly.

On a fix round, change only what the reported error names.

## 1. Design reference

If there is one, open it (Figma through whatever Figma tool the harness has, a screenshot as an
image) and note field order, labels, grouping, and widgets. Match them. Without one, follow the
nearest existing plugin of the same auth type.

## 2. manifest.json

1. Pick the template in `../assets/templates/` for `auth.type` and `schemaVersion` (table in
   `manifest-and-operations.md`) and replace the scaffolded manifest with it.
2. Fill `title`, `description`, `source.name` (display name), `source.kind` (the plugin id),
   and the manifest `type` (`api`, `database`, or `cloud-storage`).
3. Add connection-wide fields only: credentials, base URL, account or region. Per-request values
   belong in operations. Fixed or multiple hosts need no field (`backend.md`, Dependencies).
4. Encrypt every secret. Keep `required` in step with the fields.
5. Set `customTesting` deliberately (`marketplace/AGENTS.md`) and tell the backend job which
   value you chose.

## 3. operations.json

- **No `operationsMode`**: start from `v1/api-operations.json` or `v1/database-operations.json`.
  One `list` entry per spec operation (`value` = `name`, `name` = `displayName`), one sibling
  group per operation. Parameter widgets: string and number `codehinter` 36px, JSON and array
  `codehinter` 150px, boolean `toggle`, enum `dropdown`. Every codehinter gets
  `"className": "codehinter-plugins"`.
- **`operationsMode: "api-endpoint"`**: start from `v1/api-endpoint-operations.json`; set
  `key` to `<id>_operation` and `spec_url` to the spec's `specUrl` value (string or object).
  Write the spec files with `scripts/split-spec.mjs` (`intake-openapi.md` section 3), so every
  `@spec/<id>/<name>` has `openapi-specs/<name>.yaml` (or `.json`) in the plugin.

Keep the `$schema` URLs from the templates; editors use them for hints.

## 4. icon.svg

Leave it if SKILL.md step 3 placed one. Otherwise keep the scaffolded placeholder and tell the
user to supply the real logo.
