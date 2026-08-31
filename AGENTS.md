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

Frontend conventions, App Builder architecture and glossary: `frontend/AGENTS.md`.

## Product and system orientation

Use these maps to get oriented before tracing unfamiliar behavior:

- `.agents/context/product-map.md` — users, capabilities, user journeys, confirmed business rules, and inferences
- `.agents/context/architecture-map.md` — runtime components, data stores, authentication/authorization, integrations, deployment, failure modes, and end-to-end technical flows

The maps are indexes, not substitutes for current code. Follow their path and symbol references, then verify the relevant implementation, tests, migrations, and recent history. Treat sections labeled **Inference** as hypotheses; never silently promote them to fact.

### Public/private boundary

This root repository is public; `server/ee/` and `frontend/ee/` are separate private submodules. For public issues, PRs, documentation, and support responses:

- Base claims and reproduction steps only on public-repository evidence.
- Do not disclose private source, repository links, customer data, internal deployment details, or private issue/Slack context.
- If private context motivates a public fix, restate the problem as a publicly reproducible invariant and add a public regression test.
- Do not inspect or modify private submodules unless the task explicitly includes them and the current user is authorized.

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

## Evidence-first investigation

For product questions, bug reports, regressions, and root-cause analysis:

1. Normalize the report: expected behavior, observed behavior, edition, version/commit, environment, role, app state, and reproducible inputs. State what is missing.
2. Locate the capability and user journey in `.agents/context/product-map.md`; use `UBIQUITOUS_LANGUAGE.md` for canonical terms.
3. Trace the complete path using `.agents/context/architecture-map.md`: frontend route/state → API controller and guards → service/repository → data store, queue, or connector → response and UI update.
4. Read the closest applicable `AGENTS.md` before reasoning about a module. Inspect relevant tests, migrations, configuration, and recent git history; do not diagnose from filenames or symptoms alone.
5. Write down competing hypotheses and try to falsify them. Distinguish **Confirmed**, **Inference**, and **Unknown** conclusions.
6. Cite concrete repository paths and symbols for technical claims. Include commands, test results, logs, and commit SHAs when they materially support the conclusion.
7. Do not modify code for an analysis-only request. When a fix is requested, reproduce first where feasible, add a regression test, implement the smallest fix, and run the narrowest relevant checks before broader suites.

An investigation handoff should contain: problem statement, scope/impact, reproduction status, evidence, root cause or ranked hypotheses, owning module, recommended next action, and confidence/unknowns.

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
- TypeORM schema migrations in `server/migrations/`; data migrations in `server/data-migrations/`
- Never import `@ee/` or `@cloud/` from CE code — webpack enforces this at compile time
- Backend port reads from `PORT` in `.env`; frontend port via `npm start -- --port <port>`
- Lint before committing. Pre-commit hooks are in the repo (husky + lint-staged, activated by root `npm install`); the hook only lint-fixes frontend files — backend needs `cd server && npm run lint` manually. CI lints all three folders and blocks the PR on failure. Never `--no-verify` unless the user explicitly asks

## Skills

Procedures live in `.agents/skills/` (symlinked into `.claude/skills/`). Load the one matching the task instead of improvising — ToolJet is a superproject with two submodules, and every git operation has to fan out across all three in a fixed order.

| Task | Skill |
|---|---|
| Merge a branch across root + submodules | `merge` |
| Commit across root + submodules | `commit` |
| Push and open PRs across root + submodules | `create-pr` |

## Context file layout

Context is layered — the closest file to the code you're changing wins:

| File | Scope |
|---|---|
| `AGENTS.md` (this file) | Repo-wide architecture, editions, structure |
| `.agents/context/product-map.md` | Public product capabilities, users, journeys, and business rules |
| `.agents/context/architecture-map.md` | Public system components, data flows, integrations, and failure modes |
| `UBIQUITOUS_LANGUAGE.md` | Canonical domain glossary |
| `server/AGENTS.md` | Backend + testing conventions |
| `server/src/modules/<module>/AGENTS.md` | Per-module purpose, key files, invariants |
| `server/ee/AGENTS.md` | EE-extends-CE rules (in EE submodule) |
| `frontend/AGENTS.md` | Frontend conventions, App Builder architecture, glossary |
| `server/docs/testing.md` | Backend testing — what to test, then how to write it |

**Living-docs rule:** when you meaningfully change a module (new service, changed invariant, renamed concept, new gotcha discovered), update its `AGENTS.md` in the same PR. If the module has none yet, create one from `server/docs/agents-module-template.md`. Introducing or renaming a domain term means updating `UBIQUITOUS_LANGUAGE.md` in the same PR — every glossary term should map to a real code identifier or user-facing feature.

Update `.agents/context/product-map.md` when a public capability, user journey, role, or business rule changes. Update `.agents/context/architecture-map.md` when a runtime component, data store, integration boundary, authentication path, deployment topology, or major failure mode changes. Keep evidence links current, preserve explicit inference labels, and review map changes with the same owners as the code. Stale context is worse than no context.
