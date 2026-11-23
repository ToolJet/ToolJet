# app-validation — Agent Context

Validates app-definition writes (pages, components, layouts, queries, events, version
settings) inside the save transactions. Modes per write source (`core/constants.ts`):
`report` logs and returns warnings, `enforce` rejects with a structured 400.

## Layout

| Path | Role |
| --- | --- |
| `module.ts`, `service.ts` | Nest surface. Do not move: `SubModule.getProviders` resolves `app-validation/service`, and `server/ee/app-validation/service.ts` extends it. |
| `types.ts`, `version-index.ts`, `export-reader.ts`, `lock.ts` | Public API imported by the apps/pages/components/events/data-queries/versions services (CE and EE). Keep at the root. |
| `catalog/` | Single source of truth for validation data. One JSON per entity (`events.json`, `pages.json`, `queries.json`, `components.json`, `layouts.json`) plus `widgets.ts` (reads the server widget-config) and `actions.ts` (reads `events.json`). Everything re-exported through `catalog/index.ts`. |
| `core/` | Machinery: `runner`, `values`, `mode`, `constants`, `exception`, `warnings.interceptor`. |
| `rules/` | One `<area>.rules.ts` per entity, registered in `rules/index.ts`. |

## No-drift contract

Each catalog JSON's `$sources` names the frontend module it mirrors. The tripwire is
`frontend/src/AppBuilder/__tests__/validationCatalogParity.spec.js`: it imports the editor's
own definitions (ActionTypes, pageEventsMeta, dataQueryEvents, appCanvasConstants,
validateQueryName/validateKebabCase, the WidgetManager widget list) and these JSONs. It
covers action ids, page and query events, name and handle patterns, canvas columns, widget
coverage (every widget the editor can place exists in the server widget-config registry)
and per-widget option lists and events — so a frontend-only widget or option cannot
silently trip COMPONENT_UNKNOWN_TYPE / PROPERTY_ENUM_MISMATCH. NOT covered (checked by
hand when their frontend source changes): `targets`, the layout `types`/field lists,
`dynamicEventSources` and the `actionEntityRefs` field names. CI runs the frontend suite
for server-catalog-only edits via the `validation_catalog` filter in ci.yml. Server-side
integrity lives in `server/test/modules/app-validation/unit/catalog-json.spec.ts`.

Adding a widget: create BOTH configs (frontend WidgetManager + server widget-config — the
widget-generator skill writes both); the validation layer needs no changes, it reads the
server registry at runtime (type, setting schemas, events).

Adding an event action: follow `.github/instructions/event-action-remapping.instructions.md`
(ActionTypes.js, eventsSlice field name, `catalog/events.json`, both remapping blocks).

## Invariants

- Call `check()` inside the save's transaction with its `manager`, before the write, after
  `lockForValidation` when a uniqueness rule applies. Name lock before cycle lock on every
  component write path; update paths take the name lock only when a write touches `name`.
- `pat` is the only source in `enforce`; a call site that passes `source` (or runs outside
  a request) decides whether PAT writes are blocked. The AI builder's sessions carry
  `AI_BUILDER_API_SOURCE` and resolve to `ai` (report), not `pat`.
- Lookup reads (`ctx.index()`, `ctx.componentsInVersion()`) run in a savepoint on the
  caller's manager: a failing read must not abort the save's transaction.
- Name and reference rules drop to `medium` for bulk sources (`core/severity.ts`
  `referenceSeverity`), and `copy`/`restore` are hard-capped to `report` in `core/mode.ts`.
- JSON data files and TS modules in `catalog/` must not share a basename: jest resolves
  `json` before `ts` (`moduleFileExtensions`), so `foo.ts` next to `foo.json` silently
  imports the JSON. That is why the readers are `widgets.ts`/`actions.ts`.
- Import JSON with `import * as x from './x.json'` — default imports differ between tsc
  and ts-jest.
- `check()` returns blocking issues in `result.errors` even in report mode; the mode only
  controls throwing.
- Data source reachability in `VersionIndex.load` = version-local OR referenced by an
  existing query OR workspace-global (statics, defaults and samples are all stored
  `scope='global'`, `app_version_id=NULL`). Dropping the global clause rejects the first
  query of every fresh app under enforce - pinned by version-index.spec. The export reader
  mirrors this: untagged (global) data sources belong to every version of an export.

## Tests

```
cd server && SKIP_GLOBAL_SETUP=1 NODE_ENV=test npx jest --config jest.config.ts test/modules/app-validation/unit
cd frontend && npx jest src/AppBuilder/__tests__/validationCatalogParity.spec.js
```
