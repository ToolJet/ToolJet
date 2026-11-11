# marketplace plugins

Third-party data source connectors ("marketplace plugins") that are built separately from the core `plugins/` packages and installed into a workspace by users. Each plugin is an npm workspace under `marketplace/plugins/<id>/`. Not to be confused with built-in connectors in `plugins/packages/`.

## Layout

```
marketplace/plugins/<id>/
  package.json          # @tooljet-marketplace/<id>, build via ncc
  tsconfig.json
  README.md
  .gitignore
  lib/index.ts          # QueryService implementation
  lib/types.ts          # SourceOptions / QueryOptions
  lib/manifest.json     # connection form + source.kind
  lib/operations.json   # query editor form
  lib/icon.svg
  __tests__/index.js    # it.todo stub, not run
  openapi-specs/        # only for OpenAPI-mode plugins
```

- Shared helpers: `marketplace/plugins/common` (`@tooljet-marketplace/common`).
- `manifest.json` and `operations.json` set `$schema` to the raw GitHub URL of `plugins/schemas/manifest.schema.json` / `plugins/schemas/operations.schema.json`. Validate against the local files.

## Scaffold and register

- Human path, from the repo root: `npx tooljet plugin create <name> --type=database|api|cloud-storage --marketplace`. It prompts for a display name (and a repo URL), renders the hygen templates in `marketplace/_templates/plugin/new/`, runs `npm i` in `marketplace/`, and appends an entry to `server/src/assets/marketplace/plugins.json`. `npx tooljet` is the published `@tooljet/cli` pinned in the root `package.json`, not `cli/src`: without `--marketplace` it asks "is it a marketplace integration?" and a "no" scaffolds into `plugins/packages/`.
- Non-interactive path (agents): `cd marketplace && ../node_modules/.bin/hygen plugin new --name <id> --type <type> --display_name "<Name>" --plugins_path .`, then add the `plugins.json` entry by hand and run `npm i`. The hygen binary comes from the root `npm install` (locked through `@tooljet/cli`). Details: `.agents/skills/create-plugin/SKILL.md`.
- `plugins.json` `id` must be unique and equal both the manifest `source.kind` and the directory name: `@spec/` files are looked up by it (`findByKind` matches `pluginId`, `server/src/modules/plugins/service.ts`), and install outside production reads `marketplace/plugins/<id>/` (`server/src/modules/plugins/util.service.ts`). `create` aborts if the id already exists. The id must also differ from every built-in `source.kind` in `plugins/packages/*/lib/manifest.json` (e.g. `googlesheets`); `validate:plugin` fails on a collision.

## OpenAPI mode

`operations.json` can reference specs as `@spec/<kind>/<name>` (see `marketplace/plugins/aftership/lib/operations.json`). The spec files live in the plugin's `openapi-specs/`. The frontend rewrites `@spec/...` to `${apiUrl}/plugins/specs/<kind>/<name>` (`frontend/src/_services/openapi.service.js::resolveSpecUrl`), served by `GET /plugins/specs/:pluginKind/:specName` (`server/src/modules/plugins/controller.ts::getSpec`), which is looked up by the `plugins.json` id (equal to `source.kind`).

## Build and test

```
cd marketplace
npm install
npm run build --workspaces        # build @tooljet-marketplace/common first, as CI does
npm run validate:plugin -- <id>   # or --all; schemas, registry, built-in kinds, @spec files, handlers
ESLINT_USE_FLAT_CONFIG=false npm run lint   # as CI does
```

- There is no `build:packages` script. Build is `npm run build` (workspaces); each plugin runs `ncc build lib/index.ts -o dist`.
- `npm run build --workspaces` runs alphabetically, but plugins import `common`'s `dist`, so build it first: `npm run build --workspace=@tooljet-marketplace/common` (`.github/workflows/ci.yml`, marketplace job).
- Tests: `plugins/<id>/__tests__/index.js` is a scaffolded `it.todo` stub in every plugin. No jest/TypeScript config exists under `marketplace/` and CI does not run marketplace tests, so `npx jest` fails to parse `lib/index.ts`. Verify with `npm run build`, `validate:plugin`, and lint; add a jest config only if a plugin needs real unit tests.
- Add npm deps to one plugin with `npm i <pkg> --workspace=<package-name>`.

## Local install

- Source: with `NODE_ENV` other than `production` (`cd server && npm run start:dev`), install reads `dist/index.js`, `lib/*.json`, `lib/icon.svg` and `openapi-specs/` from `marketplace/plugins/<id>/`; in production it fetches them from the marketplace host, so an unpublished plugin fails (`util.service.ts`). Install and reload copy those files into the database; nothing watches the directory, so rebuild before reloading.
- `ENABLE_MARKETPLACE_DEV_MODE=true` (server env, restart to apply) shows the reload button in Installed plugins and makes the server re-read plugin code on every query instead of its in-memory cache (`plugin-selector.service.ts`). Forced off on Cloud (`server/src/modules/configs/service.ts`). No code reads `ENABLE_MARKETPLACE_FEATURE`.
- Access: marketplace pages need an admin, super admin or builder, and are hidden on Cloud (`frontend/src/Routes/MarketplaceRoute.jsx`). Registry cards come from `plugins.json` via the server.
- `GET /plugins/specs/...` responses carry `Cache-Control: public, max-age=3600` (`controller.ts::getSpec`).
- Headless: `cd server && PLUGINS_TO_INSTALL=<id> npm run plugins:install`; the root `.env` overrides the shell env.

## Invariants & gotchas

- **OAuth widget:** new plugins use `"type": "react-component-oauth"` in `manifest.json` properties. marketplace plugins use it; none use `react-component-oauth-authentication`. That older name is used only by built-in connectors in `plugins/packages/` (restapi, graphql, grpc, grpcv2) and is not handled by `frontend/src/_components/DynamicFormV2.jsx`, which handles only `react-component-oauth`.
- **`customTesting`:** in `DataSourceManager.jsx`, `false`/absent renders the default footer with the test-connection button; `true` renders a footer without it. Existing OAuth plugins are mixed (`true`, `false`, and unset all occur), so set it deliberately and implement `testConnection` in `lib/index.ts` when it is `false`.
- Do not edit `dist/`; it is a build artifact.
- `source.kind` is the plugin's identity across `plugins.json`, spec lookup, and stored data sources. Never rename it after release.

## Related

- `server/src/modules/plugins/` — install, storage, spec serving
- `server/src/assets/marketplace/plugins.json` — marketplace registry
- `plugins/schemas/` — JSON Schemas for manifest and operations
- `cli/src/commands/plugin/` — `create`, `install`, `delete`
