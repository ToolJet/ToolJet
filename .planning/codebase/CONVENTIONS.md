# Coding Conventions

**Analysis Date:** 2026-06-29

ToolJet is an npm-workspaces monorepo. Linting/formatting config differs between the
frontend (ESLint 9 flat config) and the server (legacy ESLint `.eslintrc.js`), so the
applicable rules depend on which workspace you are editing.

## Naming Patterns

**Files:**
- **New files prefer TypeScript** (`.ts`/`.tsx`). The codebase is incrementally migrating
  off `.js`/`.jsx`. Only fall back to JS when extending an untyped legacy module makes typing
  it disproportionately large — and say so when you do.
- Server module files use a flat, role-suffixed convention inside each module dir
  (see `server/src/modules/apps/`): `controller.ts`, `service.ts`, `util.service.ts`,
  `repository.ts`, `module.ts`, plus `dto/`, `guards/`, `interfaces/`, `types/`, `constants/`.
- TypeORM entities: `snake_case` filenames with `.entity.ts` suffix — `server/src/entities/user_sessions.entity.ts`.
- Migrations: `<timestamp>-<DescriptiveName>.ts` in `server/migrations/`.
- Frontend components: PascalCase dirs/files — `frontend/src/_components/Pagination`, `frontend/src/components/ui/Button/Button.jsx`.
- Storybook stories: `<Component>.stories.jsx` co-located with the component.
- Frontend tests: live in `__tests__/` dirs, named `*.test.js`.

**Functions / Variables:**
- camelCase for functions and variables across both workspaces.
- Unused vars/args allowed only when prefixed with `_` (enforced via `argsIgnorePattern: '^_'`,
  `varsIgnorePattern: '^_'` on both frontend configs).
- Server allows unused function args freely (`@typescript-eslint/no-unused-vars` set to
  `{ vars: 'all', args: 'none' }` in `server/.eslintrc.js`).

**Types / Classes:**
- PascalCase for classes, NestJS providers, entities, and DTOs.
- Repositories suffixed `Repository`, util services `UtilService`, services `Service`.

## Code Style

**Formatting (Prettier):**
Prettier runs via the `prettier/prettier` ESLint rule (no standalone `.prettierrc`).
Both workspaces share these settings:
- `semi: true`
- `singleQuote: true`
- `printWidth: 120`
- `trailingComma: 'es5'`

Frontend additionally pins (`frontend/eslint.config.mjs`): `arrowParens: 'always'`, `proseWrap: 'preserve'`.
Frontend uses `prettier@^2.8.4`; server uses Prettier 3.5.

**Linting:**
- Root `eslint.config.mjs` dynamically re-exports `frontend/eslint.config.mjs` (flat config, ESLint 9).
  Globally ignores `build/**`, `assets/**`, `cypress-tests/**`.
- Frontend JS/JSX: `eslint:recommended` + react + react-hooks + import-x (remapped to `import/`
  namespace) + jest + prettier. Notable project overrides:
  - `react/prop-types`: off, `react/display-name`: off, `react/no-unknown-property`: off
  - `no-unused-vars`: warn (with `_` ignore)
  - `jest/no-focused-tests`: error, `jest/no-identical-title`: error
- Frontend TS/TSX: `@typescript-eslint/recommended` subset. `no-explicit-any`: warn,
  `no-non-null-assertion`: warn, `explicit-function-return-type`: off.
- Server (`server/.eslintrc.js`): `eslint:recommended` + `@typescript-eslint/recommended` +
  `plugin:prettier/recommended` + `plugin:cypress/recommended`. Looser than frontend:
  `no-explicit-any`: off, `explicit-function-return-type`: off, `no-empty-function`: off.

**Pre-commit (Husky + lint-staged):**
`.husky/pre-commit` runs lint-staged. Root `package.json` `lint-staged` only targets
`./frontend/src/**/*.{js,jsx}` with `eslint --fix`. Server and TS files are NOT auto-linted on commit.

## Import Organization

**Path Aliases:**
- Server (`server/jest.config.ts` + tsconfig): `src/*`, `@modules/*`, `@services/*`, `@entities/*`,
  `@controllers/*`, `@dto/*`, `@plugins/*`, `@helpers/*`, `@ee/*`, `@apps/*`, `@licensing/*`,
  `@instance-settings/*`, `@otel/*`.
- Frontend: `@/*` → `frontend/src/*` (also resolvable bare via `moduleDirectories: ['node_modules','src']`).

**Resolution notes:**
- Frontend import-x resolver allows `.js/.jsx/.ts/.tsx` and webpack config; certain packages are
  whitelisted in `import/no-unresolved` ignore list (e.g. `^@/`, `@radix-ui/`, `react-hot-toast`).

## Error Handling

**Server:** Throw NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, etc. from
`@nestjs/common`). DB writes wrapped in `dbTransactionWrap` (`server/src/helpers/database.helper.ts`).
Validation via global `ValidationPipe` (`server/src/main.ts`) plus class-validator DTOs and Joi.

**Frontend:** UI error surfacing via `react-hot-toast`; error boundaries via `mpx-error-boundary`.

## Logging

**Server:** Pino + OpenTelemetry + Sentry. Do not use `console.*` in server code.
**Frontend:** `console` permitted (declared as a global), but avoid in committed code.

## Comments

- File-level JSDoc block comments are used on server test/spec files describing intent and the
  `@group` runner tag (see `server/test/modules/session/unit/session.service.spec.ts`).
- Inline comments explain non-obvious mocking / config decisions (see `server/jest.config.ts`
  mariadb mock note). Keep comments load-bearing, not narrative.

## Function & Module Design

- Server: NestJS DI throughout — providers injected via constructor, no manual instantiation.
  Keep controllers thin, push logic into `service.ts` / `util.service.ts`.
- Barrel files: used for test helpers (`server/test/test.helper.ts` re-exports from
  `helpers/setup`, `helpers/utils`, `helpers/seed`, `helpers/api`, `helpers/workflows`).
- Plugins: each connector under `plugins/packages/<name>/` is a self-contained package
  (`lib/` source, `__tests__/`, `package.json`), depending on `@tooljet-plugins/common`.

---

*Convention analysis: 2026-06-29*
