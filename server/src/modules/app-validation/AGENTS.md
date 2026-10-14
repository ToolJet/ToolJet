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
validateQueryName/validateKebabCase, the WidgetManager widget list) and these JSONs, and
fails on any mismatch — the same cross-tree parity pattern the widget configs use. It also
asserts every widget the editor can place exists in the server widget-config registry, so a
frontend-only widget cannot silently trip COMPONENT_UNKNOWN_TYPE. Server-side integrity
lives in `server/test/modules/app-validation/unit/catalog-json.spec.ts`.

Adding a widget: create BOTH configs (frontend WidgetManager + server widget-config — the
widget-generator skill writes both); the validation layer needs no changes, it reads the
server registry at runtime (type, setting schemas, events).

Adding an event action: follow `.github/instructions/event-action-remapping.instructions.md`
(ActionTypes.js, eventsSlice field name, `catalog/events.json`, both remapping blocks).

## Invariants

- JSON data files and TS modules in `catalog/` must not share a basename: jest resolves
  `json` before `ts` (`moduleFileExtensions`), so `foo.ts` next to `foo.json` silently
  imports the JSON. That is why the readers are `widgets.ts`/`actions.ts`.
- Import JSON with `import * as x from './x.json'` — default imports differ between tsc
  and ts-jest.
- Bulk sources (`import`, `git`, `copy`, `restore`) get reference severities downgraded in
  rules, and `copy`/`restore` are hard-capped to `report` in `core/mode.ts`.
- `check()` returns blocking issues in `result.errors` even in report mode; the mode only
  controls throwing.
- Data source reachability in `VersionIndex.load` = version-local OR referenced by an
  existing query OR workspace-global (statics, defaults and samples are all stored
  `scope='global'`, `app_version_id=NULL`). Dropping the global clause rejects the first
  query of every fresh app under enforce - pinned by version-index.spec.

## Tests

```
cd server && SKIP_GLOBAL_SETUP=1 NODE_ENV=test npx jest --config jest.config.ts test/modules/app-validation/unit
cd frontend && npx jest src/AppBuilder/__tests__/validationCatalogParity.spec.js
```
