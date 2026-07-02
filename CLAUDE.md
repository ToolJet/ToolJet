# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

ToolJet is an open-source low-code platform for building internal tools. It has a React frontend, NestJS backend, and 50+ data-source plugins organized as separate packages.

**Branch strategy:** `main` is beta; `lts-3.16` is stable. Branch naming:
- Bug fix: `fix/<suitable-name>`
- Enhancement to existing UI/feature: `enhance/<suitable-name>`
- New feature: `feature/<suitable-name>`

---

## Commands

### Development Setup
```bash
# Install all dependencies
npm install
npm --prefix frontend install
npm --prefix server install
cd plugins && npm install

# Database
npm run db:setup           # Create + migrate + seed (development)
```

### Running Services
```bash
# Start everything with Docker (recommended)
docker-compose up

# Frontend dev server (port 8082)
npm --prefix frontend start

# Backend dev server (port 3000, watch mode)
npm --prefix server run start:dev

# Plugins (TypeScript watch mode)
cd plugins && npm run start
```

### Building
```bash
npm run build              # Build everything
npm run build:frontend     # Webpack production build
npm run build:server       # NestJS build
npm run build:plugins:prod # Build all plugin packages
```

### Testing
```bash
# Frontend (Jest + React Testing Library)
npm --prefix frontend run test
npm --prefix frontend run test -- --testNamePattern="<test name>"
npm --prefix frontend run test -- <path/to/test.test.js>

# Backend (Jest)
npm --prefix server run test
npm --prefix server run test -- --testNamePattern="<test name>"
npm --prefix server run test -- <src/path/to/file.spec.ts>
npm --prefix server run test:watch
npm --prefix server run test:e2e

# Plugins
cd plugins && npm run test
```

### Linting & Formatting
```bash
npm --prefix frontend run lint
npm --prefix frontend run format
npm --prefix server run lint
npm --prefix server run format
```

### Database Operations
```bash
npm --prefix server run db:migrate   # Run pending migrations
npm --prefix server run db:seed      # Seed database
npm --prefix server run db:reset     # Reset + re-migrate + re-seed
npm --prefix server run db:drop      # Drop database
```

---

## Architecture

### Top-Level Structure

| Directory | Purpose |
|-----------|---------|
| `frontend/` | React 18 app (Webpack, Zustand, Tailwind) |
| `server/` | NestJS backend (TypeORM, PostgreSQL, Redis) |
| `plugins/` | 50+ data source connectors (Lerna monorepo) |
| `marketplace/` | Marketplace app templates (Lerna) |
| `cli/` | `@tooljet/cli` command-line tool |
| `cypress-tests/` | E2E test suite |
| `docker/` | Dockerfiles for all services |
| `deploy/` | Deployment scripts for various cloud providers |

### Frontend (`frontend/src/`)

**Key directories:**
- `AppBuilder/` — The main editor: canvas, drag-and-drop, widget renderer, resolution engine
- `_ui/` — 53+ shared Radix UI-based primitive components (check here before creating new ones)
- `_components/` — Higher-level shared components
- `_stores/` — Zustand state stores
- `_hooks/` — Custom React hooks
- `_services/` — API client utilities
- `_styles/` — SCSS + Tailwind design tokens (`designtheme.scss`, `tailwind.config.js`)
- `_lib/` — JavaScript execution sandbox

**AppBuilder rendering pipeline:**
```
AppCanvas → Container → WidgetWrapper → RenderWidget → Widget
```
- Widgets receive resolved props from `RenderWidget`. They must NOT directly access store state.
- `setExposedVariable` and `fireEvent` are passed as callbacks for widgets to communicate outward.

**Resolution system (`{{}}` expressions):**
```
unresolved value → extractAndReplaceReferencesFromString → resolveDynamicValues → resolveCode (new Function()) → resolved value in resolvedSlice
```
- `{{...}}` references MUST be registered via `addReferencesForDependencyGraph` or renders go stale.
- After `setExposedValue`, `updateDependencyValues` MUST be called to propagate changes.
- Inside ListView/Kanban, `customResolvables` provide row-scoped context (`listItem` / `cardData` — don't mix them).

**Event system:**
```
fireEvent → handleEvent → executeActionsForEventId → executeAction
```
- Event definitions live in `eventsSlice`, not in component definitions.
- Events support `runOnlyIf` and `debounce`.

**State management:**
- Zustand with Immer middleware — no Redux/MobX/Recoil.
- AppBuilder store (`AppBuilder/_stores/store.js`) has 30+ slices namespaced by `moduleId` (default: `'canvas'`).
- Global stores (`appDataStore`, `currentStateStore`, `dataQueriesStore`, `resolverStore`) should NOT be used in AppBuilder code unless absolutely necessary. Prefer the AppBuilder store.
- Always use `shallow` comparison in `useStore` when selecting objects/arrays.

**Performance rules:**
- Viewer (`/applications/*`) and editor are separate lazy bundles via `RootRouter.jsx`. Do not import editor-only code into viewer paths.
- Avoid `JSON.parse(JSON.stringify(...))` or `_.cloneDeep` in render/hot paths — use Immer.
- New widgets MUST be lazy-loaded.
- Use `useBatchedUpdateEffectArray` for batched state updates in widgets.

**Subcontainer architecture (ListView/Kanban):**
- `SubcontainerContext` carries `contextPath`: `[{ containerId, index }, ...]`.
- ListView nesting is limited to **2 levels**. Only row 0 is editable; others are read-only mirrors.
- `findNearestSubcontainerAncestor` is critical for dependency resolution when walking the component tree.

### Backend (`server/src/`)

**Key directories:**
- `modules/` — 61+ NestJS feature modules (auth, app, data-queries, data-sources, AI, workflows, etc.)
- `entities/` — TypeORM database entities
- `dto/` — Data Transfer Objects
- `migration-helpers/` — Database migration utilities

**Key integrations:**
- **Queue:** BullMQ + Redis for async job processing
- **Workflows:** Temporal.io for long-running async workflows
- **Auth:** Passport.js + JWT; CASL for authorization
- **AI:** Vercel AI SDK supporting Anthropic, OpenAI, Google, Mistral
- **Observability:** OpenTelemetry (OTLP), Sentry, Pino logging
- **Code execution:** JavaScript via `new Function()` sandbox; Python via nsjail + Pyodide

### Plugins (`plugins/packages/`)

Each connector is an independent Lerna package with client and server entry points. Build via `npm run build:plugins:prod` from root.

---

## Coding Standards

### Styling
- Tailwind classes **MUST** use the `tw-` prefix (e.g., `tw-flex`, `tw-bg-default`). Unprefixed Tailwind is a bug.
- **NEVER** hardcode hex/rgb/hsl colors. Use CSS variable tokens via Tailwind (`tw-text-default`, `tw-bg-page-default`) or `var(--text-default)`.
- Prefer Tailwind over Bootstrap. Do not extend legacy `react-bootstrap` usage.
- Use custom typography utilities (`tw-font-title-default`, `tw-font-body-default`) instead of ad-hoc font-size/weight.

### Components & Imports
- Check `frontend/src/_ui/` before creating new UI components.
- Functional components with hooks only — no class components.
- Use `@/` path alias (maps to `frontend/src/`): `import Button from '@/_ui/Button'`. No deep relative paths.
- Icons: use `@tabler/icons-react` or `lucide-react` only — do not add new icon packages.

### Backward Compatibility (CRITICAL for AppBuilder)
No change should break existing saved applications. Always ask: "Would an app saved before this change still load and behave correctly after it?"

### Data Migrations
New migrations in `server/data-migrations/` MUST include progress logging:
1. **Baseline** — `[START] {Action} | Total: {Total}`
2. **Progress** — `[PROGRESS] {Current}/{Total} ({Percentage}%)`
3. **Confirmation** — `[SUCCESS] {Action} finished.`

Never do silent bulk updates without console feedback.

### Security
- No API keys/secrets in client-side code.
- Backend: parameterized queries only — never concatenate user input into SQL.
- `resolveCode` uses `new Function()` — be cautious about evaluated expressions.

### Common Review Flags to Avoid
- Hardcoded colors (hex/rgb/hsl in JSX or SCSS)
- Missing `tw-` prefix on Tailwind classes
- New `react-bootstrap` imports
- Class components
- `console.log` / debug leftovers
- Unused imports
- Missing `key` props in `.map()`
- Missing `shallow` in `useStore` selectors
- Direct DOM manipulation (except canvas drop calculations)
- Global store usage in AppBuilder code
