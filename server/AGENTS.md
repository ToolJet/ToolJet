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

- **Schema migrations** (`migrations/`): `{timestamp}-{DescriptiveName}.ts`, `MigrationInterface` with `up`/`down`, QueryRunner API, CASCADE on delete for FKs. Schema shape changes only — no data manipulation here.
- **Data migrations** (`data-migrations/`): any data manipulation that must run on deployment goes here, never in schema migrations.
- Data migrations MUST log progress — `{MIGRATION_NAME}: [START] {action}: {total}`, `[PROGRESS] {i}/{total} ({%}%)`, `[SUCCESS] {action} finished.` No silent bulk updates. Exemplar: `data-migrations/1783372800000-MoveNavigationLayoutStylesToStyles.ts`.
- **Runner / atomicity:** `db:migrate` (and `:prod`) run through `src/migration-helpers/run-all-migrations.ts`, which normally executes all schema migrations then all data migrations in **one transaction** via two `MigrationExecutor` passes sharing a single query runner. A failure in either phase rolls back both — schema no longer commits ahead of a failing data migration. (Exception: enum additions on a fresh install force a two-transaction fallback — see the enum bullet below.) Don't merge the two migration globs into one datasource: TypeORM sorts by class-name timestamp and schema/data timestamps interleave, which would break the all-schema-before-all-data ordering. Keep long-running backfills mindful of `statement_timeout` — the schema locks are held for the whole combined transaction in atomic mode.
- **Enum `ADD VALUE` + same-deploy use (conditional atomicity):** PostgreSQL forbids using an enum value in the transaction that added it via `ALTER TYPE ... ADD VALUE` (55P04) — with **no** exemption for a type created in that same transaction (verified on PG 13). So "add a value in a schema migration, read/write it in a data migration" cannot be one transaction. `run-all-migrations.ts` reconciles this: `planEnumAdditions` scans pending schema migrations for `ALTER TYPE ... ADD VALUE` and checks whether each target type already exists. (a) All target types exist (**upgrade**) → pre-commit those values on a separate connection *before* the shared transaction, then run schema+data atomically. (b) Any target type does **not** exist yet — fresh install / `db:reset`, or a brand-new enum type introduced this run → fall back to two separate transactions (schema commits, then data), the enum-safe ordering; atomicity is lost only for that run (a fresh DB has no data to protect, and PG offers no atomic alternative). Keep new enum additions as literal `ALTER TYPE ... ADD VALUE IF NOT EXISTS '<value>'` SQL so the scanner finds them and the migration's own statement no-ops after pre-commit. Extraction logic + test: `src/migration-helpers/enum-value-additions.ts`, `test/modules/migrations/unit/enum-value-additions.spec.ts`.
- Prefer runtime interpretation of existing values over new sentinel columns + migrations; repurpose existing columns/tables over adding parallel structures.

### Widget config sync (CRITICAL)

Server widget config (`src/modules/apps/services/widget-config/`) and frontend config (`frontend/src/AppBuilder/WidgetManager/widgets/`) must change together. If a config change moves, renames, or removes a key, write a migration.

### Security

- Parameterized queries only. Never concatenate user input into SQL.

### Language

- Never abbreviate `data_source` as `ds`.
- Use glossary terms (`../UBIQUITOUS_LANGUAGE.md`): Workspace not Organization, Component not Widget, Builder/End User not Editor/Viewer.

### Linting & hooks

- Always lint before committing: `cd server && npm run lint`. CI runs the same per folder (`lint-for-server`/`-frontend`/`-plugins` jobs in `.github/workflows/ci.yml`) and a lint failure blocks the PR — catching it locally is strictly cheaper.
- Git hooks live in the repo (husky, root `package.json`; activated by root `npm install`). Pre-commit lint-staged covers frontend files only — backend lint is NOT run by the hook, run it yourself. The pre-push hook runs server lint and typecheck in parallel, no tests; unit and e2e run in CI. `npm run ci:changed` (root) runs the affected tests locally.
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
- `run-ci` coverage gate: changed server lines ≥ 80% covered, no 0% new files, overall coverage not below base branch (`../scripts/coverage-gate.sh`). Details: `docs/testing.md` § Coverage.
- Run: `npm test`, `npm run test:e2e` (`--testPathPatterns`, `-t`, `--group=` filters). `DEBUG_TESTS=true` restores console output.
- Test DB: a stale schema fails with `column ... does not exist`. Use `tools/tj/bin/tj db migrate --test`. `NODE_ENV=test npm run db:migrate` is a silent no-op, and the root `.env` overrides shell vars. In a `tj wt add` worktree the test DB is isolated per branch.

## Module context files

Per-module context lives in `src/modules/<module>/AGENTS.md`. Existing: app, apps, auth, data-queries, data-sources, git-sync, group-permissions, licensing, personal-access-tokens, templates, versions, workflows.

**Maintenance rule:** meaningfully changing a module (new service, changed invariant, renamed concept, discovered gotcha) means updating its `AGENTS.md` in the same PR. No file yet? Create one from `docs/agents-module-template.md`. Keep them ≤80 lines — pointers and invariants, not prose dumps.
