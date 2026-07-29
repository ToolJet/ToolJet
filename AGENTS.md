# ToolJet — Agent Context

Guidance for AI coding agents (and humans) working in this repo. Canonical file: `AGENTS.md`; `CLAUDE.md` is a symlink to it. Deeper context lives closest to the code — see [Context file layout](#context-file-layout).

## Architecture

Three editions: `ce` (community), `ee` (enterprise), `cloud`. Controlled by `TOOLJET_EDITION` env var.

### Editions & submodules

- CE code lives in `server/src/modules/` and `frontend/src/`
- EE/Cloud code lives in git submodules: `server/ee/` and `frontend/ee/`
- Cloud is a deployment config of EE, not a third code tree: `TOOLJET_EDITION=cloud` runs the same EE submodule code, with cloud-only behavior gated by runtime checks

### Backend (NestJS + TypeORM + PostgreSQL)

Edition pattern: **inheritance**. EE services extend CE base classes.

- `SubModule` base class (`server/src/modules/app/sub-module.ts`) — every module extends this
- `getImportPath()` (`server/src/modules/app/constants/index.ts`) — routes to `src/modules/` (CE) or `ee/` (EE/Cloud) based on `TOOLJET_EDITION`
- EE services extend CE services and call `super()` (e.g., `server/ee/data-queries/service.ts` extends `server/src/modules/data-queries/service.ts`)
- `getTooljetEdition()` (`server/src/helpers/utils.helper.ts`) — runtime edition check

Backend conventions in detail: `server/AGENTS.md`.

### Frontend (React + Webpack)

Edition pattern: **composition** via registries + webpack module replacement.

- Webpack aliases: `@/` → `src/`, `@ee/` → `ee/`, `@cloud/` → `cloud/`
- `NormalModuleReplacementPlugin` replaces `@ee/` and `@cloud/` imports with empty modules for lower editions (compile-time isolation)
- Runtime registries resolve edition-specific modules, components, stores, and slices:
  - `frontend/src/modules/common/helpers/_registry/moduleRegistry.js`
  - `frontend/src/modules/common/helpers/_registry/componentRegistry.js`
  - `frontend/src/modules/common/helpers/getEditionSpecificStores.js`
- `fetchEdition()` (`frontend/src/modules/common/helpers/utils.js`) — runtime edition check

Frontend domain glossary and decisions: `frontend/CONTEXT.md`.

## Project structure

```
server/          # NestJS backend
frontend/        # React + Webpack
plugins/         # Built-in data source connectors (Lerna monorepo, 40+ packages)
marketplace/     # Third-party marketplace plugins
cypress-tests/   # E2E tests (Cypress)
docker/          # Dockerfiles per edition
deploy/          # K8s, Helm, Docker deploy configs
```

## Domain terminology

`UBIQUITOUS_LANGUAGE.md` at repo root is the canonical glossary. Notable traps:

- **Organization** (code entity) = **Workspace** (user-facing term). Same concept.
- **Widget** (legacy) = **Component**.
- **Module** is overloaded: NestJS module (backend) vs reusable app building block (frontend/EE feature). Qualify which you mean.
- Never abbreviate `data_source` as `ds`.

## Node version

`server/package.json` `engines` field is the source of truth; root `.nvmrc` / `.node-version` mirror it. Always `nvm use` before running Node commands — required version differs across branch lines.

## Dev commands

```
cd server && npm run start:dev      # start backend (port from .env PORT)
cd frontend && npm start            # start frontend
cd server && npm run db:setup       # setup database
cd server && npm run db:migrate     # run migrations
cd server && npm test               # run tests
```

### Plugins build (required for migrations)

`db:migrate` depends on `@tooljet/plugins/dist/server`:

```
cd plugins && npm install && npm run build
```

## Key conventions

- Database name convention: `tooljet_{edition}` (see `PG_DB` in `.env`)
- TypeORM schema migrations in `server/src/migrations/` (and `server/ee/migrations/` for EE); data migrations in `server/data-migrations/`
- Never import `@ee/` or `@cloud/` from CE code — webpack enforces this at compile time
- Backend port reads from `PORT` in `.env`; frontend port via `npm start -- --port <port>`

## Context file layout

Context is layered — the closest file to the code you're changing wins:

| File | Scope |
|---|---|
| `AGENTS.md` (this file) | Repo-wide architecture, editions, structure |
| `UBIQUITOUS_LANGUAGE.md` | Canonical domain glossary |
| `server/AGENTS.md` | Backend + testing conventions |
| `server/src/modules/<module>/AGENTS.md` | Per-module purpose, key files, invariants |
| `server/ee/AGENTS.md` | EE-extends-CE rules (in EE submodule) |
| `frontend/CONTEXT.md` | Frontend glossary + decisions log |

**Living-docs rule:** when you meaningfully change a module (new service, changed invariant, renamed concept, new gotcha discovered), update its `AGENTS.md` in the same PR. If the module has none yet, create one from `server/docs/agents-module-template.md`. Stale context is worse than no context.
