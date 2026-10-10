# templates module

Serves the template library and creates apps from templates (`/api/library_apps`). A template is a bundled app
definition, optionally with ToolJet DB tables and sample data, that is imported into the user's workspace through the
shared import pipeline (`import-export-resources`), then has its tables seeded from CSV.

## Domain terms

- **Template** — one folder under `server/templates/<id>/`; `<id>` is the template id used everywhere below.
- **Template table** — an entry in a definition's `tooljet_database`; becomes a ToolJet DB table in the workspace.
- **Sample data** — `server/templates/<id>/data/<table_name>/data.csv`, loaded after import.
- **Sample app / onboarding app** — `templates/sample_app_def.json`, `templates/onboard_sample_app.json`; imported the same way.

## Key files

| File | Role |
|---|---|
| `controller.ts` | `GET /library_apps` (manifests + category titles), `POST /library_apps` (create from template), `:identifier/default-name` (next free app name), sample and onboarding apps, `:identifier/plugins` |
| `service.ts` | `perform` → `importTemplate` → `processCsvFile`; theme and table-id preparation before import |
| `server/templates/index.ts` | Reads every `manifest.json` at startup, sorted by name |
| `server/templates/<id>/` | `manifest.json` (`id` = folder name), `definition.json`, `data/<table>/data.csv` |
| `server/scripts/compress-templates.js` | Docker builds minify and Brotli-compress definitions to `.json.br`; `readTemplateJson` prefers them |
| `frontend/assets/custom-components/templates/<id>.html` | Preview shown in the template library, one per template |
| `server/templates/categories.json` | Category id → display title for the gallery; every manifest `category` must be a key here |
| `server/scripts/generate-template-assets.ts` | Writes manifest `sources` from each definition and validates every manifest; `--check` runs in CI |
| `template-assets.ts` | Pure logic behind the generator: data-source derivation, manifest validation |

## Edition split

- EE: `server/ee/templates/` extends the controller and service (constructor only); all logic is CE.
- Theme: without the `CUSTOM_THEMES` license, `withThemeColours` writes the theme's light colours into the app and sets the
  default theme. With it, EE `AppImportExportService.importTheme` creates or links the workspace theme — only for
  template imports (`isTemplateApp`), never for file import, clone or Git sync.

## Invariants & gotchas

- Every import gets fresh template table ids (`withFreshTableIds`). Import stores a table's incoming id as its
  `co_relation_id` and reuses any table that already has it (added for Git sync). Template ids are fixed, so without
  this a second app from the same template attaches to the first app's tables and seeding fails on unique columns.
- The ids are replaced everywhere in the definition (tables, query `table_id`s, foreign keys); the seeding loop matches
  created tables back to the definition by id, so both must use the same, already-replaced definition.
- Tables are seeded one at a time, in definition order, and awaited: a referencing table needs its parent's rows, and a
  failure must surface as `Failed to process CSV file` instead of a false success. The app is already created by then.
- CSV headers must be a subset of the table's columns. Blank cells take the column default or NULL, so required text
  columns that may be blank in sample data must not be `NOT NULL` without a default.
- Every route that takes a template identifier checks it against the loaded manifests (`findManifest`) before any file
  read; unknown ids return 400 `App definition not found`.
- `default-name` mirrors the `app_versions` name-uniqueness trigger: same branch, same app type, case-sensitive, and it
  always filters by the caller's workspace.
- Template id = folder name = `manifest.json` `id` = preview file name. Nothing maps them.
- After adding or editing a template, run `cd server && npm run templates:generate` and commit its output. CI fails on stale
  `sources`, and on invalid manifests (missing fields, unknown category, name over 90 characters, no preview).
- Manifest `sources` is generated from the data sources the queries use; do not edit it by hand.

## Related modules

- `import-export-resources`, `apps` (`AppImportExportService`) — the import pipeline templates go through.
- `tooljet-db` — table creation (`TooljetDbImportExportService`) and CSV loading (`TooljetDbUtilService.bulkUploadCsv`).
- `licensing` — `CUSTOM_THEMES` decides how template themes are applied.
