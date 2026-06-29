<!-- refreshed: 2026-06-29 -->
# Architecture

**Analysis Date:** 2026-06-29

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React 18 SPA)                     │
├──────────────────┬──────────────────┬───────────────────────┤
│   App Builder    │   App Viewer     │   Settings / Auth     │
│ `frontend/src/   │ `frontend/src/   │ `frontend/src/        │
│  AppBuilder`     │  ViewerApp.jsx`  │  modules`             │
├──────────────────┴──────────────────┴───────────────────────┤
│  Zustand stores `frontend/src/_stores` (Immer)              │
│  REST services  `frontend/src/_services/*.service.js`       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS  /api/... (+ WebSocket)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVER (NestJS 11 modular monolith)             │
│  Entry `server/src/main.ts` → `AppModule` registers ~60     │
│  feature modules under `server/src/modules/*`               │
│  Per-module: controller.ts → service.ts → repository.ts     │
│  Global: ResponseInterceptor, AllExceptionsFilter,          │
│  ValidationPipe, Ability (CASL) guards                      │
└───────────┬───────────────────────────┬─────────────────────┘
            │ TypeORM                    │ dynamic import
            ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  PostgreSQL (2 datasources)│  │ PLUGINS (48 connectors)      │
│  default + `tooljetDb`     │  │ `plugins/packages/*`         │
│  + Redis/BullMQ, PostgREST │  │ implement `QueryService`     │
└──────────────────────────┘  └──────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Server bootstrap | NestJS app creation, middleware, prefix, listen | `server/src/main.ts` |
| Root module | Registers all feature modules, schedulers, BullBoard | `server/src/modules/app/module.ts` |
| Module loader | Dynamic edition-aware module loading, TypeORM/Bull/OTEL roots | `server/src/modules/app/loader.ts` |
| Edition resolver | Resolves CE/EE/Cloud import paths (`dist/src/modules` vs `dist/ee`) | `server/src/modules/app/constants/index.ts` |
| Data query exec | Resolve + run queries against datasources | `server/src/modules/data-queries/service.ts` |
| Plugin loader | Load/register marketplace plugins | `server/src/modules/plugins/service.ts` |
| Plugin contract | `QueryService` interface all connectors implement | `plugins/packages/common/lib/query_service.interface.ts` |
| ORM config | Builds both TypeORM datasource configs | `server/ormconfig.ts` |
| App Builder UI | Drag-drop editor, canvas, widgets | `frontend/src/AppBuilder/AppBuilder.jsx` |
| Client state | Zustand+Immer stores (editor, session, queries) | `frontend/src/_stores/*.js` |
| Client entry | Bootstraps React, i18n, Sentry, RootRouter | `frontend/src/index.jsx` |

## Pattern Overview

**Overall:** Monorepo (npm workspaces) with a **NestJS modular monolith** backend, a **React SPA** frontend, and a **Lerna plugin ecosystem** of data-source connectors.

**Key Characteristics:**
- Per-feature NestJS modules with uniform `controller → service → repository` layering
- Edition split (CE/EE/Cloud) via dynamic `import()` path resolution, not build-time flags
- Plugins are independent packages implementing a shared `QueryService` contract
- Client state via Zustand stores with Immer; server access via thin REST service wrappers
- Two PostgreSQL TypeORM datasources: app metadata (default) and ToolJet DB (`tooljetDb`, fronted by PostgREST)

## Layers

**Frontend Presentation:**
- Purpose: App builder UI, viewer runtime, settings/auth screens
- Location: `frontend/src/AppBuilder`, `frontend/src/modules`, `frontend/src/components`
- Depends on: stores (`_stores`), services (`_services`)
- Used by: end users via browser

**Frontend State / Data Access:**
- Purpose: Client-side state and REST calls
- Location: `frontend/src/_stores` (Zustand+Immer), `frontend/src/_services`
- Depends on: server REST API
- Used by: UI components

**Server Controllers:**
- Purpose: HTTP routing, DTO validation, guards (CASL ability)
- Location: `server/src/modules/<feature>/controller.ts`
- Depends on: services

**Server Services:**
- Purpose: Business logic, transactions (`dbTransactionWrap`)
- Location: `server/src/modules/<feature>/service.ts`
- Depends on: repositories, other module services, plugins

**Server Repositories / Persistence:**
- Purpose: TypeORM entity access
- Location: `server/src/modules/<feature>/repository.ts`, `server/src/entities`
- Depends on: PostgreSQL via `server/ormconfig.ts`

**Plugins:**
- Purpose: External data-source connectivity
- Location: `plugins/packages/<connector>/lib/index.ts`
- Depends on: `@tooljet-plugins/common`
- Used by: data-queries / plugins modules

## Data Flow

### Primary Request Path (run a query)

1. UI triggers query run via `frontend/src/_services/dataquery.service.js`
2. HTTP `POST /api/data_queries/.../run` hits `server/src/modules/data-queries/controller.ts`
3. `DataQueriesService.runQueryForApp` / `runAndGetResult` resolves options (`server/src/modules/data-queries/service.ts:278`)
4. Connector loaded and `QueryService.run()` invoked (`plugins/packages/<connector>/lib/index.ts`)
5. `ResponseInterceptor` wraps response (`server/src/modules/app/interceptors/response.interceptor.ts`)
6. Result returned to client, written into Zustand `currentStateStore` / `queryPanelStore`

### Server Bootstrap Flow

1. `import './otel/tracing'` first (`server/src/main.ts:1`)
2. `AppModule.register({ IS_GET_CONTEXT: false })` builds dynamic module (`module.ts`)
3. `AppModuleLoader.loadModules` wires TypeORM (2 datasources), BullMQ, EventEmitter, Schedule, OTEL (`loader.ts`)
4. Global interceptors/filters/pipes + versioning + CSRF + static assets applied (`main.ts:172`)
5. `app.listen(port)` on `LISTEN_ADDR`

**State Management:**
- Client: Zustand stores in `frontend/src/_stores` (Immer middleware); resolver in `resolverStore.js`
- Server: stateless request handling; shared state in Redis/Postgres; `request-context` module for per-request scope

## Key Abstractions

**Feature Module:**
- Purpose: Self-contained NestJS bounded context
- Examples: `server/src/modules/apps`, `server/src/modules/data-sources`
- Pattern: `controller.ts` + `service.ts` + `repository.ts` + `dto/` + `ability/` + `module.ts`

**SubModule / dynamic loading:**
- Purpose: Edition-aware provider resolution
- Examples: `server/src/modules/app/sub-module.ts`, `server/src/modules/app/loader.ts`
- Pattern: `await import(\`${importPath}/${module}/${path}\`)` where path = `dist/src/modules` (CE) or `dist/ee` (EE/Cloud)

**QueryService connector:**
- Purpose: Uniform data-source operation contract
- Examples: `plugins/packages/mysql/lib/index.ts`
- Pattern: `class implements QueryService { run(); testConnection(); getConnection(); }`

**Zustand store:**
- Purpose: Client state slice
- Examples: `frontend/src/_stores/editorStore.js`, `currentStateStore.js`
- Pattern: `create(immer((set, get) => ({...})))`

## Entry Points

**Server:**
- Location: `server/src/main.ts`
- Triggers: `npm --prefix server run start:dev`
- Responsibilities: Bootstrap NestJS, middleware, listen on port 3000

**Frontend:**
- Location: `frontend/src/index.jsx` → `frontend/src/RootRouter.jsx`
- Triggers: Webpack dev server (port 8082)
- Responsibilities: i18n init, Sentry, route splitting (builder vs viewer)

**Migrations CLI:**
- Location: `server/src/migration-helpers/db-migrations-datasource.ts` (schema), `data-migrations-datasource.ts` (data)
- Triggers: `npm run db:migrate`

## Architectural Constraints

- **Threading:** Single Node event loop; background work via BullMQ workers (`worker:prod`) over Redis.
- **OTEL ordering:** `import './otel/tracing'` MUST be the first import in `server/src/main.ts` to patch modules before load.
- **Two datasources:** `default` (app metadata) and `tooljetDb` (user data, via PostgREST). Inject with `@InjectEntityManager('tooljetDb')`.
- **Edition resolution:** Module paths resolved at runtime by `TOOLJET_EDITION` env via `getImportPath`; EE code lives in `server/ee` (mirrors `server/src/modules`).
- **Global state:** `globalThis.TOOLJET_VERSION` set at bootstrap; schedulers (`@Cron`) inert in test mode.

## Anti-Patterns

### Hardcoding edition logic in feature modules

**What happens:** Conditionally branching on `TOOLJET_EDITION` inside a feature service.
**Why it's wrong:** Bypasses the dynamic-import edition mechanism in `loader.ts`/`constants/index.ts`, causing CE/EE drift.
**Do this instead:** Place edition-specific implementations in the parallel `server/ee` tree resolved by `getImportPath`.

### Bypassing service layer from controllers

**What happens:** Controllers calling repositories or TypeORM directly.
**Why it's wrong:** Skips transaction wrapping (`dbTransactionWrap`) and business invariants.
**Do this instead:** Route all data access through `service.ts` → `repository.ts` (see `server/src/modules/data-queries/service.ts`).

## Error Handling

**Strategy:** Global `AllExceptionsFilter` (`server/src/modules/app/filters/all-exceptions-filter.ts`) plus domain filters (TooljetDB exceptions).

**Patterns:**
- Throw Nest HTTP exceptions (`BadRequestException`, `NotFoundException`) from services
- Plugins throw `QueryError` from `@tooljet-plugins/common`

## Cross-Cutting Concerns

**Logging:** Pino via `nestjs-pino` + OpenTelemetry tracing (`server/src/otel`), Sentry.
**Validation:** `ValidationPipe({ whitelist: true, transform: true })` global + class-validator DTOs; Joi for config.
**Authentication:** Passport JWT + CASL ability guards per module (`<feature>/ability/guard.ts`), validated at boot by `GuardValidator`.

---

*Architecture analysis: 2026-06-29*
