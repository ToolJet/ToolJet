# import-export-resources module

Owns workspace resource export, import, and app cloning, coordinating app definitions and ToolJet Database schemas.

## Domain terms

- **Declared variable** — name-keyed initial-value definition in app settings or page variables.
- **Import bundle** — exported apps/modules plus optional ToolJet Database schemas.

## Key files

| File | Role |
|---|---|
| `controller.ts` | v2 resources export/import/clone routes and authorization guards |
| `service.ts` | workspace-scoped import orchestration; clone via export/import |
| `guards/import-variables.guard.ts` | validates original import bodies before Nest transforms or strips keys |
| `../../helpers/import-variable-validation.helper.ts` | shared import-only variable shape/scope/cycle preflight |

## Edition split

- EE extends this service/controller in `server/ee/import-export-resources/`; module and external-API import routes reuse the preflight guard.

## Invariants & gotchas

- Validate the entire app/module bundle before importing any tables or apps. A later invalid definition must not leave earlier resources behind.
- Import variable validation is mandatory, independent of the general app-validation report/enforce mode. Accept missing, null, or object maps; reject malformed maps, reserved names, invalid entries, module page declarations, and static cycles with contextual errors.
- ID-keyed development definitions never shipped. Reject them explicitly; do not re-key entries, drop fields, or default malformed flags. Older released export schemas without declared variables remain supported.
- Guards must run before `ValidationPipe`, which strips prototype-related keys. Do not move this check into DTO transforms or controller bodies.
- Never evaluate imported JavaScript. Static dependency parsing does not prove dynamic property-name references or runtime-created dependencies.
- Keep direct version/page saves and copy-only paths outside this import-only policy.

## Related modules

- `apps` — shared definition importer, nested modules, reference remapping.
- `tooljet-db` — database schema import/export.
- `app-validation` — general rules, separate from mandatory import-variable preflight.
