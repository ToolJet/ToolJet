# ToolJet Server — Agent Context

Backend conventions for the NestJS server. Repo-wide architecture: `../AGENTS.md`. Domain glossary: `../UBIQUITOUS_LANGUAGE.md`.

## Module structure

Modules extend `SubModule` (`src/modules/app/sub-module.ts`) with a dynamic `register()` pattern:

```
modules/{feature}/
├── module.ts          # extends SubModule, static async register()
├── controller.ts      # or controllers/{name}.controller.ts
├── service.ts         # or {name}.util.service.ts
├── repository.ts      # extends Repository<Entity>
├── dto/               # request/response DTOs
├── ability/           # CASL guards per resource
│   └── {resource}/guard.ts   # extends AbilityGuard
└── constants.ts
```

`getImportPath()` (`src/modules/app/constants/index.ts`) routes module resolution to `src/modules/` (CE) or `ee/` (EE/Cloud) based on `TOOLJET_EDITION`.

## Edition separation (CE/EE/Cloud)

- `server/src/` = Community Edition core. `server/ee/` = Enterprise overrides (git submodule, mirrors CE module structure).
- EE services extend CE services and call `super()`. Never import EE code from CE.
- Cloud is a config change on EE, not a third code tree: `TOOLJET_EDITION=cloud` loads the same `ee/` code (`getImportPath()` maps both EE and Cloud to `ee/`). Cloud-only behavior via runtime checks (`getTooljetEdition()` in `src/helpers/utils.helper.ts`), `CloudFeatureGuard`, and conditional module registration (e.g. `SessionTransferModule` is Cloud-only).

## Conventions

### Design principles

- Strong typing always. Never `any` — use precise types, or cast through `unknown` where unavoidable (test private access, caught errors).
- *A Philosophy of Software Design*, pragmatically: deep modules (simple interface hiding a rich implementation, no shallow pass-through layers); design it twice (sketch a second approach before committing to the first); define errors out of existence (make edge cases structurally impossible over exception plumbing); pull complexity downward (absorb it in the module, don't push it onto callers); separate general-purpose from special-purpose code; comment only the non-obvious — design decisions and invariants code can't express.
- *Grokking Simplicity*, pragmatically: separate calculations (pure functions) from actions (effects); stratified design — module-level pure helpers above the class, domain-named types; push effects to the edges.
- Prefer simplicity and readability over cleverness. Optimize for the next reader.

### Entities (TypeORM)

- `@Entity({ name: 'table_name' })` with `@PrimaryGeneratedColumn('uuid')`.
- Columns: snake_case in DB (`@Column({ name: 'organization_id' })`), camelCase in code.
- Timestamps: `@CreateDateColumn()`, `@UpdateDateColumn()`.
- Complex objects: `enum`, `jsonb`, `simple-json`, `json`.
- Note: the `Organization` entity is the **Workspace** domain concept (legacy name).

### Repositories

- `@Injectable()` class extending `Repository<Entity>`, `DataSource` injected; named `{Entity}Repository`, one per module.
- Custom typed query methods (e.g. `getQueriesByVersionId()`, `getOneById()`).
- Wrap mutations in `dbTransactionWrap()`.

### Controllers

- `@Controller()` + `@InitModule(MODULES.X)` + `@InitFeature(FEATURE_KEY.X)`.
- Guards: `@UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)`.
- DTOs from `@modules/{module}/dto/`; custom param decorators like `@App() app: AppEntity`.

### Services

- `@Injectable()`, constructor DI of repositories/services/`ConfigService`/`EntityManager`.
- Naming: `{Feature}Service` or `{Feature}UtilService`.
- Errors: throw `BadRequestException`, `UnauthorizedException`, etc. from `@nestjs/common`.

### Authorization (CASL)

- Guards extend `AbilityGuard` (`src/modules/app/guards/ability.guard.ts`); override `getAbilityFactory()`, `getSubjectType()`, `getResource()`, `forwardAbility()`.
- Resource mapping returns `ResourceDetails` with `resourceType: MODULES.MODULE_NAME`.

### Migrations

How migrations **run** (boot path, locks, upgrade gate, async mode, env vars, runbook) is in `docs/MIGRATION_FLOW.md`. Read it before you change `src/migration-helpers/`, `src/modules/app/middlewares/migration-gate.middleware.ts`, `src/modules/app/migration-runs/` or the `db:setup` step of an entrypoint. Update it in the same PR. This section has the rules for *writing* a migration.

- **Schema migrations** (`migrations/`): name them `{timestamp}-{DescriptiveName}.ts`. Use `MigrationInterface` with `up`/`down`, the QueryRunner API and CASCADE on delete for FKs. Change schema shape only. Do not change data.
- **Data migrations** (`data-migrations/`): put all data changes that must run on deployment here. Never put them in schema migrations.
- **Log progress in data migrations:** `{MIGRATION_NAME}: [START] {action}: {total}`, `[PROGRESS] {i}/{total} ({%}%)`, `[SUCCESS] {action} finished.` Do not write silent bulk updates. Example: `data-migrations/1783372800000-MoveNavigationLayoutStylesToStyles.ts`.
- **Authoring rules.** Async mode applies schema migrations at boot and data migrations later, in separate transactions (`docs/MIGRATION_FLOW.md`, Async mode). Released code must continue to work on the new schema. So:
  1. A schema migration only adds: tables, nullable columns or columns with a default, indexes, enum values, constraints on new tables. Ship a drop, rename, type change or `SET NOT NULL` on an existing column one release later, when no released code reads it. `test/modules/migrations/unit/migration-authoring-rules.spec.ts` checks schema and data migrations newer than `MIGRATION_AUTHORING_RULES_CUTOFF` (`src/migration-helpers/migration-mode.ts`). It also flags every constraint and unique index added in its own statement, because it cannot tell a new table from an existing one; for a new table, add the opt-out comment below (constraints written inside `CREATE TABLE` are fine). In async mode, a pending migration at or before the cutoff makes the full upgrade run as a joint run before boot, unless it is in `ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS` (what a 3.21.58 database still runs; `docs/MIGRATION_FLOW.md`, Schema phase). Never edit an old migration in a way that changes what 3.21.58 sees after the schema phase. To exempt one file, add `// migration-lint: allow-destructive <reason>`.
  2. A data migration that changes the shape of app definitions keeps the old shape readable for one release. No check enforces this.
  3. Every new migration has a non-empty `down()`. A comment that tells why it cannot be reversed is sufficient. The same spec checks this.
  4. Rollback: deploy the previous image. Additions do not break old code. Last resort: restore the pre-upgrade backup. `down()` is for development and support-led recovery. It never runs automatically.
- **Transactions.** A joint run (`MIGRATION_PHASE` unset: blocking mode, Cloud, local `db:migrate`) runs all schema and all data migrations in one transaction. A failure rolls back both. Async mode splits them (`docs/MIGRATION_FLOW.md`, Phases and transactions). The schema locks of a joint run stay held for the full transaction, so keep long backfills within `statement_timeout`.
- **Enum `ADD VALUE` used in the same deploy.** PostgreSQL forbids use of an enum value in the transaction that added it (`55P04`). There is no exemption for a type created in the same transaction (verified on PG 13). `planEnumAdditions` (`run-all-migrations.ts`) scans pending schema migrations for `ALTER TYPE ... ADD VALUE`:
  - All target types exist (upgrade): it pre-commits the values on a separate connection, then runs schema and data in one transaction.
  - A target type does not exist yet (fresh install, `db:reset`, or a new enum type in this run): it runs schema and data in two transactions. A fresh database has no data to protect.
  - Write each enum addition as literal `ALTER TYPE ... ADD VALUE IF NOT EXISTS '<value>'` SQL. The scanner then finds it, and the statement in the migration does nothing after the pre-commit. Code and test: `src/migration-helpers/enum-value-additions.ts`, `test/modules/migrations/unit/enum-value-additions.spec.ts`.
- **`SET LOCAL` lasts for the full transaction.** A joint run shares one transaction for all migrations. A split run shares one for all schema or all data migrations. So `SET LOCAL lock_timeout` (or `statement_timeout`) applies to every later migration. Read the old value with `SHOW lock_timeout`. Restore it at the end with `SELECT set_config('lock_timeout', $1, true)`. Do not copy `1781868342325-AddModuleToAppTypeEnum.ts`, `1781869753341-AddModuleToResourceTypeEnum.ts` or `1782196835449-AddModuleCreateDeleteToGroupPermissions.ts`: they set it and do not restore it.
- Prefer runtime interpretation of existing values to new sentinel columns and migrations. Reuse existing columns and tables. Do not add parallel structures.
- **Released-app viewer cache:** a new table or column that changes what a released app shows, and can change without a new release (permissions, settings, themes), needs a trigger that moves the app's viewer-cache stamp, or viewers keep a stale copy. Checklist: the Released-app viewer cache section of `src/modules/apps/AGENTS.md`.

### Widget config (CRITICAL)

Widget configs live in the shared `packages/widget-definitions` package and are imported by both server (`src/modules/apps/services/widget-config/index.js`) and frontend. If a config change moves, renames, or removes a key, write a migration.

### Security

- Parameterized queries only. Never concatenate user input into SQL.

### Language

- Never abbreviate `data_source` as `ds`.
- Use glossary terms (`../UBIQUITOUS_LANGUAGE.md`): Workspace not Organization, Component not Widget, Builder/End User not Editor/Viewer.

### Linting & hooks

- Always lint before committing: `cd server && npm run lint`. CI runs the same per folder (`lint-for-server`/`-frontend`/`-plugins` jobs in `.github/workflows/ci.yml`) and a lint failure blocks the PR — catching it locally is strictly cheaper.
- Git hooks live in the repo (husky, root `package.json`; activated by root `npm install`). Pre-commit lint-staged covers frontend files only — backend lint is NOT run by the hook, run it yourself. Some branch lines also ship a pre-push hook running affected server tests.
- Hook not installed (fresh clone, `.git/hooks` missing husky)? Run root `npm install` to set it up, or flag it to the user.
- **Never commit or push with `--no-verify` unless the user explicitly asks.** Hooks failing means fix the failure, not bypass it — a bypass only defers the same failure to CI.

## Testing (Jest)

> Tests are documentation first. Describe blocks = table of contents; `it()` = plain English; assertions = response shape. Write failing tests before implementation.

Full reference: `docs/testing.md` — part 1 is judgment (behavior matrix across edition × plan × role × feature gate × tenant scope × resource state, pruning rules, unit vs e2e placement, what to skip, when to delete a test), part 2 is mechanics (run commands, directory layout, isolation model, describe templates, helper layers, `@group`). This section summarises both; read the doc when the summary runs out.

1. What could actually break here?
2. Needs real DB/HTTP round trip to be meaningful? → e2e. Else → unit.
3. Already pinned by a lower-level unit test? → don't re-assert at e2e.
4. Trivial / framework-guaranteed? → skip.
5. Which matrix cells does this cover — and which are deliberately skipped because they short-circuit or don't interact?

- Location: `test/modules/` mirrors `src/modules/`; each module gets `e2e/` and optional `unit/`.
- Placement: a spec lives where the code it needs lives. `test/` runs as CE and must pass without the private submodules. Specs that import EE code or need an `ee`/`cloud` app go in `ee/test/` (same layout). Mixed specs get split. `scripts/check-ee-leak.sh` enforces this on pre-push and in CI.
- Isolation: one-time TRUNCATE in global setup, then **suite-level transaction per spec file with per-test SAVEPOINTs** (no per-test TRUNCATE). A no-op QueryRunner proxy routes service "transactions" through the suite TX; `withRealTransactions(fn)` opts out for tests verifying real rollback.
- Seed data in `beforeAll` (persists across tests in the suite); per-test mocks/config in `beforeEach`; `jest.resetAllMocks()` in `afterEach`; `closeTestApp(app)` in `afterAll` (60s timeout).
- Describe naming: `Controller` → (only when the plan varies) `on the <plan> plan` → `POST /api/x | Intent` → `it('should ... with ...')`. Reads top-to-bottom as a sentence.
- The tree picks the edition: shared behavior is tested once in `test/` with a bare `initTestApp()` (CE). Behavior that differs gets a case in each tree: the CE outcome (403/404/451) in `test/`, the EE/Cloud outcome in the same-named `ee/test/` file; plan variance is one describe per plan in `ee/test/`.
- Assert shape with `toMatchObject()` + `expect.any()`, not per-field assertions. Test failure paths (401/403/404) too.
- Helpers are stratified (import from `'test-helper'` barrel, never direct files): setup (bootstrap) / seed (factories) / api (HTTP) / utils (TypeORM) / domain files. New domain helpers → new file, added to barrel. Use seed helpers, not inline entity construction.
- Tag suites with `/** @group platform|workflows|database|marketplace */` before the outermost describe.
- `run-ci` coverage gate: changed server lines ≥ 80% covered, no 0% new files, overall coverage not below base branch (`../scripts/coverage-gate.sh`). Details: the Coverage section of `docs/testing.md`.
- Run: `npm test`, `npm run test:e2e` (`--testPathPatterns`, `-t`, `--group=` filters). `DEBUG_TESTS=true` restores console output.
- Test DB: a stale schema fails with `column ... does not exist`. Use `tools/tj/bin/tj db migrate --test`. `NODE_ENV=test npm run db:migrate` is a silent no-op, and the root `.env` overrides shell vars. In a `tj wt add` worktree the test DB is isolated per branch.

## Module context files

Per-module context lives in `src/modules/<module>/AGENTS.md`. Existing: app, apps, auth, data-queries, data-sources, git-sync, group-permissions, licensing, personal-access-tokens, templates, versions, workflows.

**Maintenance rule:** meaningfully changing a module (new service, changed invariant, renamed concept, discovered gotcha) means updating its `AGENTS.md` in the same PR. No file yet? Create one from `docs/agents-module-template.md`. Keep them ≤80 lines — pointers and invariants, not prose dumps.
