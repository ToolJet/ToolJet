# Technology Stack

**Analysis Date:** 2026-06-29

ToolJet is an open-source low-code platform (v1.18.0, AGPL v3), structured as an npm-workspaces monorepo. There is **no Nx/Turborepo** at the root; plugins/marketplace use Lerna for sub-package versioning.

## Languages

**Primary:**
- TypeScript - Server (`server/`, TS 5.8), plugins (`plugins/`, TS ~4.9), CLI (`cli/`, TS 4.4), marketplace (`marketplace/`)
- TypeScript + JavaScript (JSX) - Frontend (`frontend/`, TS 5.9). Codebase is incrementally migrating JS→TS; new feature files should be `.ts`/`.tsx`.

**Secondary:**
- SCSS / Sass - Frontend styling (`frontend/`, alongside Tailwind)
- SQL - Migrations and ToolJet DB (`server/migrations/`)

## Runtime

**Environment:**
- Node 22.15.1 (pinned in root `package.json` `engines`, `.nvmrc`, `.node-version`)

**Package Manager:**
- npm 10.9.2 (pinned in `engines`)
- Lockfile: `package-lock.json` (v3) present at repo root
- Root uses npm workspaces; scripts delegate to workspaces via `npm --prefix <dir>`

## Frameworks

**Core (Server) — `server/package.json`:**
- NestJS 11.1 (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`) - Backend framework
- Express - Underlying HTTP server
- TypeORM 0.3.24 (`@nestjs/typeorm`) - ORM for PostgreSQL
- BullMQ 5.58 + `@nestjs/bullmq` + `@nestjs/bull` - Job queues over Redis
- `@nestjs/websockets` + `@nestjs/platform-ws` + `ws` 8.17 - WebSocket gateway
- `@nestjs/passport` + `passport-jwt` + `@nestjs/jwt` - JWT auth
- `@nestjs/schedule` - Cron / scheduled tasks
- `@nestjs/throttler` - Rate limiting
- `@temporalio/*` 1.11 (client/worker/workflow/activity) - Workflow orchestration

**Core (Frontend) — `frontend/package.json`:**
- React 18.2 + React DOM 18.2
- Webpack 5 (`frontend/webpack.config.js`) - Bundler, dev server on port 8082
- Zustand 4.3 + Immer 9 - State management
- Radix UI (`@radix-ui/react-*`) + `@base-ui/react` 1.3 - Headless UI primitives
- Tailwind CSS 3.4 (`frontend/tailwind.config.js`) + Sass + Bootstrap 5.2 + `react-bootstrap`
- CodeMirror 6 (`@codemirror/*`, `@uiw/react-codemirror`) - Code editor
- React Router 6.8 (`react-router-dom`)
- ReactFlow 11.7 - Workflow/node graph UI
- Plotly (`plotly.js-dist-min`, `react-plotly.js`) - Charts
- Yjs 13.5 + `y-websocket` - Multiplayer/collaborative editing
- i18next 22.4 + `react-i18next` - Internationalization

**Testing:**
- Server: Jest 30 (`server/jest.config.ts`) + Supertest 7 + `@golevelup/ts-jest`; PollyJS for HTTP recording (e2e)
- Frontend: Jest 29 (config inline in `frontend/package.json`) + Testing Library + jsdom; Storybook 9
- Plugins: Jest 27 + ts-jest 27
- E2E: Cypress (`cypress-tests/`, workflows in `.github/workflows/cypress-*.yml`)

**Build/Dev:**
- Server: `nest build` (uses `ts-loader`), `nest start --watch` (dev)
- Frontend: Webpack 5 + Babel 7 (`frontend/babel.config.js`), `webpack serve --hot` (dev)
- Plugins: esbuild (`plugins/build-packages.js`) + `tsc -b`, generated client/server/operations entry files
- Marketplace: Lerna workspaces (`marketplace/package.json`)
- CLI: oclif 4 (`@oclif/core`) + hygen scaffolding

## Key Dependencies

**Critical (Server):**
- `pg` 8.7 - PostgreSQL driver
- `ioredis` 5 - Redis client (queues, cache, sessions)
- `typeorm` 0.3.24 - Data layer
- `bullmq` 5.58 - Background job processing
- `isolated-vm` 5 - Sandboxed JS execution for user code/queries
- `class-validator` 0.14 + `class-transformer` + `joi` 17 + `ajv` 8 + `zod` 3.25 - Validation
- `@casl/ability` 6.7 - Authorization / permissions
- `bcrypt` 6 - Password hashing
- `futoin-hkdf` + `LOCKBOX_MASTER_KEY` - Secret encryption (lockbox pattern; `rotate:keys` script)
- `ai` 4.3 + `@ai-sdk/anthropic|google|mistral|openai` - LLM/AI features

**Critical (Frontend):**
- `axios` 1.3 - HTTP client
- `@microsoft/fetch-event-source` - SSE streaming
- `react-dnd` + `@dnd-kit/*` + `react-moveable` + `react-rnd` - Drag/drop/resize for app builder
- `@tanstack/react-table` + `react-table` 7 - Tables
- `dompurify` + `sanitize-html` - HTML sanitization

**Infrastructure:**
- `@opentelemetry/*` + `nestjs-otel` 8 - Distributed tracing & metrics
- `nestjs-pino` 4 + `winston` 3 + `pino-pretty` - Logging
- `@sentry/nestjs` 10 (server) / `@sentry/react` 7 (frontend) - Error tracking
- `prom-client` 15 - Prometheus metrics
- `@bull-board/*` - Queue dashboard UI
- `helmet` 8 + `compression` + `cookie-parser` - Express middleware/security

## Configuration

**Environment:**
- Root `.env` (gitignored), template `.env.example`, `.env.test` for tests; loaded via `dotenv`
- DB config: `server/ormconfig.ts` reads env via `server/scripts/database-config-utils.ts`
- Two TypeORM datasources: primary Postgres (`PG_*` / `DATABASE_URL`) and ToolJet DB (`TOOLJET_DB_*` / `TOOLJET_DB_URL`)
- `LOCKBOX_MASTER_KEY` required for encrypting datasource credentials

**Build config files:**
- Root ESLint: `eslint.config.mjs` (flat config, ESLint 9)
- Server: `server/tsconfig.json`, `server/tsconfig.build.json`, `server/eslint.config.js`, `server/jest.config.ts`
- Frontend: `frontend/webpack.config.js`, `frontend/babel.config.js`, `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/tsconfig.json`, `frontend/eslint.config.mjs`
- Prettier: 3.5 (server), 2.8 (frontend) — version split between workspaces
- Husky + lint-staged: pre-commit runs `eslint --fix` on `frontend/src/**/*.{js,jsx}` only (root `package.json`)

## Platform Requirements

**Development:**
- Node 22.15.1, npm 10.9.2
- PostgreSQL + Redis (local or via `docker-compose.yaml` — brings up client, server, plugins, postgres, redis, postgrest with hot-reload mounts)
- Frontend dev server: port 8082; server dev: `nest start --watch`

**Production:**
- Docker images built from `docker/client.Dockerfile`, `docker/server.Dockerfile`, `docker/plugins.Dockerfile` (dev variants in `docker/`)
- Server worker mode via `WORKER=true` env (`worker:prod` script)
- Build pipeline: `npm run build` → plugins (prod/esbuild) → frontend (webpack) → server (nest)
- Editions: community vs `TOOLJET_EDITION=cloud` (`build:frontend:cloud`)

---

*Stack analysis: 2026-06-29*
