# marketplace plugins

Third-party data source connectors ("marketplace plugins") that are built separately from the core `plugins/` packages and installed into a workspace by users. Each plugin is an npm workspace under `marketplace/plugins/<id>/`. Not to be confused with built-in connectors in `plugins/packages/`.

## Layout

```
marketplace/plugins/<id>/
  package.json          # @tooljet-marketplace/<id>, build via ncc
  lib/index.ts          # QueryService implementation
  lib/types.ts          # SourceOptions / QueryOptions
  lib/manifest.json     # connection form + source.kind
  lib/operations.json   # query editor form
  lib/icon.svg
  __tests__/index.js    # jest
  openapi-specs/        # only for OpenAPI-mode plugins
```

- Shared helpers: `marketplace/plugins/common` (`@tooljet-marketplace/common`).
- `manifest.json` and `operations.json` set `$schema` to the raw GitHub URL of `plugins/schemas/manifest.schema.json` / `plugins/schemas/operations.schema.json`. Validate against the local files.

## Scaffold and register

- `npx tooljet plugin create <name> --type=database|api|cloud-storage`, run from the repo root (`cli/src/commands/plugin/create.ts`). It renders hygen templates from `marketplace/_templates/plugin/new/` and appends an entry to `server/src/assets/marketplace/plugins.json`.
- The `id` in `plugins.json` must match the directory name and be unique. `create` aborts if the id already exists.
- Manual scaffolding must add the same `plugins.json` entry.

## OpenAPI mode

`operations.json` can reference specs as `@spec/<kind>/<name>` (see `marketplace/plugins/aftership/lib/operations.json`). The spec files live in the plugin's `openapi-specs/`. The frontend rewrites `@spec/...` to `${apiUrl}/plugins/specs/<kind>/<name>` (`frontend/src/_services/openapi.service.js::resolveSpecUrl`), served by `GET /plugins/specs/:pluginKind/:specName` (`server/src/modules/plugins/controller.ts::getSpec`), which is looked up by `source.kind`.

## Build and test

```
cd marketplace
npm install
npm run build --workspaces        # build @tooljet-marketplace/common first, as CI does
npm run lint
```

- There is no `build:packages` script. Build is `npm run build` (workspaces); each plugin runs `ncc build lib/index.ts -o dist`.
- `npm run build --workspaces` runs alphabetically, but plugins import `common`'s `dist`, so build it first: `npm run build --workspace=@tooljet-marketplace/common` (`.github/workflows/ci.yml`, marketplace job).
- Tests: `plugins/<id>/__tests__/index.js` is a scaffolded `it.todo` stub in every plugin. No jest/TypeScript config exists under `marketplace/` and CI does not run marketplace tests, so `npx jest` fails to parse `lib/index.ts`. Verify with `npm run build` and lint; add a jest config only if a plugin needs real unit tests.
- Add npm deps to one plugin with `npm i <pkg> --workspace=<package-name>`.

## Invariants & gotchas

- **OAuth widget:** new plugins use `"type": "react-component-oauth"` in `manifest.json` properties. 10 marketplace plugins use it; none use `react-component-oauth-authentication`. That older name is used only by built-in connectors in `plugins/packages/` (restapi, graphql, grpc, grpcv2) and is not handled by `frontend/src/_components/DynamicFormV2.jsx`, which handles only `react-component-oauth`.
- **`customTesting`:** in `DataSourceManager.jsx`, `false`/absent renders the default footer with the test-connection button; `true` renders a footer without it. Existing OAuth plugins are mixed (7 `true`, 2 `false`, 1 unset), so set it deliberately and implement `testConnection` in `lib/index.ts` when it is `false`.
- Do not edit `dist/`; it is a build artifact.
- `source.kind` is the plugin's identity across `plugins.json`, spec lookup, and stored data sources. Never rename it after release.

## Related

- `server/src/modules/plugins/` — install, storage, spec serving
- `server/src/assets/marketplace/plugins.json` — marketplace registry
- `plugins/schemas/` — JSON Schemas for manifest and operations
- `cli/src/commands/plugin/` — `create`, `install`, `delete`
