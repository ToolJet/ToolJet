# Codebase Structure

**Analysis Date:** 2026-06-29

## Directory Layout

```text
ToolJet/                      # npm workspaces monorepo (no Nx/Turbo)
├── frontend/                 # React 18 SPA (Webpack 5, Tailwind, Zustand)
│   └── src/
│       ├── AppBuilder/       # Drag-drop app editor (canvas, widgets, query mgr)
│       ├── modules/          # Feature areas (auth, dashboard, Settings, workflows)
│       ├── _stores/          # Zustand + Immer state slices
│       ├── _services/        # REST API wrappers (*.service.js)
│       ├── _components/ _ui/ ToolJetUI/  # Shared UI primitives
│       ├── _hooks/ _hoc/ _helpers/ _utils/  # Reusable logic
│       ├── TooljetDatabase/  # ToolJet DB UI
│       ├── WorkflowEditor/   # Workflow builder
│       ├── index.jsx         # Entry point
│       └── RootRouter.jsx    # Route splitting (builder vs viewer)
├── server/                   # NestJS 11 backend
│   ├── src/
│   │   ├── main.ts           # Bootstrap entry
│   │   ├── modules/          # ~60 feature modules (CE)
│   │   │   └── app/          # Root module + loader + edition resolver
│   │   ├── ee/               # Enterprise edition modules (mirrors modules/)
│   │   ├── entities/         # TypeORM entities
│   │   ├── helpers/          # bootstrap, database, utils helpers
│   │   ├── migration-helpers/# Two datasource definitions
│   │   ├── otel/             # OpenTelemetry tracing
│   │   ├── dto/ constants/ mails/
│   ├── migrations/           # 200+ TypeORM migrations (timestamp-named)
│   └── ormconfig.ts          # Both datasource configs
├── plugins/                  # Lerna monorepo of 48 connectors
│   ├── packages/
│   │   ├── common/           # @tooljet-plugins/common (shared contract)
│   │   └── <connector>/lib/  # e.g. mysql, mongodb, graphql
│   └── lerna.json
├── cli/                      # @tooljet/cli plugin scaffolder
├── marketplace/              # Marketplace workspace
├── cypress-tests/            # E2E suite
├── docker/                   # Dev Dockerfiles
└── docs/ deploy/ release-scripts/
```

## Directory Purposes

**`frontend/src/AppBuilder`:**
- Purpose: The low-code editor — canvas, widgets, query panel, right/left sidebars
- Key files: `AppBuilder.jsx`, `AppCanvas/`, `WidgetManager/`, `QueryManager/`

**`frontend/src/_stores`:**
- Purpose: All client state (Zustand + Immer)
- Key files: `editorStore.js`, `currentStateStore.js`, `dataQueriesStore.js`, `resolverStore.js`

**`server/src/modules/<feature>`:**
- Purpose: One NestJS bounded context per feature
- Contains: `controller.ts`, `service.ts`, `repository.ts`, `module.ts`, `dto/`, `ability/`, `guards/`, `types/`
- Key example: `server/src/modules/data-queries`, `server/src/modules/apps`

**`server/src/modules/app`:**
- Purpose: Root composition — wires every feature module
- Key files: `module.ts`, `loader.ts`, `sub-module.ts`, `constants/index.ts` (edition resolution)

**`server/ee`:**
- Purpose: Enterprise edition implementations, structurally mirroring `server/src/modules`
- Resolved at runtime via `getImportPath` when `TOOLJET_EDITION=ee|cloud`

**`plugins/packages/common`:**
- Purpose: Shared connector contract and helpers (`@tooljet-plugins/common`)
- Key files: `lib/query_service.interface.ts`, `lib/queryBuilder.ts`, `lib/query.error.ts`

**`plugins/packages/<connector>`:**
- Purpose: One data-source connector
- Key files: `lib/index.ts`, `lib/manifest.json`, `lib/operations.json`, `lib/types.ts`

## Key File Locations

**Entry Points:**
- `server/src/main.ts`: NestJS bootstrap
- `frontend/src/index.jsx`: React bootstrap

**Configuration:**
- `server/ormconfig.ts`: TypeORM datasources (default + tooljetDb)
- `eslint.config.mjs`: Root flat ESLint config
- `.env` / `.env.example`: Environment (gitignored)

**Core Logic:**
- `server/src/modules/data-queries/service.ts`: Query execution
- `server/src/modules/app/loader.ts`: Module/datasource wiring
- `frontend/src/_stores/editorStore.js`: Builder state

**Testing:**
- `cypress-tests/`: E2E
- `server/**/*.spec.ts`, `plugins/**/__tests__/`: Unit tests

## Naming Conventions

**Files:**
- Server module files: lowercase `controller.ts`, `service.ts`, `repository.ts`, `module.ts`
- Migrations: `<timestamp>-<DescriptiveName>.ts` (e.g. `1778760592536-AddBannerImageToWhiteLabelling.ts`)
- Frontend services: `<name>.service.js`; stores: `<name>Store.js`
- Plugin packages: lowercase connector name dir

**Directories:**
- Server feature modules: kebab-case (`group-permissions`, `app-environments`)
- Frontend shared dirs: underscore-prefixed (`_stores`, `_services`, `_components`)
- Frontend feature dirs: PascalCase (`AppBuilder`, `WorkflowEditor`)

## Where to Add New Code

**New backend feature:**
- Module: `server/src/modules/<feature>/` with `module.ts`, `controller.ts`, `service.ts`, `repository.ts`, `dto/`
- Register in `server/src/modules/app/module.ts`
- EE variant (if any): mirror under `server/ee/<feature>/`
- Prefer TypeScript (`.ts`)

**New data-source connector:**
- Scaffold with `@tooljet/cli` → `plugins/packages/<name>/lib/`
- Implement `QueryService` from `@tooljet-plugins/common`
- Add `manifest.json` + `operations.json`

**New frontend feature:**
- UI: `frontend/src/modules/<Feature>/` or `frontend/src/AppBuilder/<Area>/`
- State: new store in `frontend/src/_stores/`
- API: new `frontend/src/_services/<name>.service.js`
- Prefer `.tsx`/`.ts` for new files

**New migration:**
- `server/migrations/<timestamp>-<Name>.ts`; run `npm run db:migrate`

**Utilities:**
- Server: `server/src/helpers/`
- Frontend: `frontend/src/_helpers/`, `frontend/src/_utils/`

## Special Directories

**`server/ee`:**
- Purpose: Enterprise edition code
- Generated: No · Committed: Yes

**`plugins/dist`, `frontend/build`:**
- Purpose: Build output
- Generated: Yes · Committed: No

**`agent-skills/` (frontend):**
- Purpose: Untracked local skills (see git status)
- Committed: No

---

*Structure analysis: 2026-06-29*
