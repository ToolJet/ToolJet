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

- **Schema migrations** (`src/migrations/`, EE: `ee/migrations/`): `{timestamp}-{DescriptiveName}.ts`, `MigrationInterface` with `up`/`down`, QueryRunner API, CASCADE on delete for FKs.
- **Data migrations** (`data-migrations/`): MUST log progress — `[START] {Action} | Total: {N}`, `[PROGRESS] {i}/{N} ({%})`, `[SUCCESS] {Action} finished.` No silent bulk updates.
- Prefer runtime interpretation of existing values over new sentinel columns + migrations; repurpose existing columns/tables over adding parallel structures.

### Widget config sync (CRITICAL)

Server widget config (`src/modules/apps/services/widget-config/`) and frontend config (`frontend/src/AppBuilder/WidgetManager/widgets/`) must change together. If a config change moves, renames, or removes a key, write a migration.

### Security

- Parameterized queries only. Never concatenate user input into SQL.

### Language

- Never abbreviate `data_source` as `ds`.
- Use glossary terms (`../UBIQUITOUS_LANGUAGE.md`): Workspace not Organization, Component not Widget, Builder/End User not Editor/Viewer.

## Testing (Jest)

> Tests are documentation first. Describe blocks = table of contents; `it()` = plain English; assertions = response shape. Write failing tests before implementation.

Judgment layer: `docs/testing-philosophy.md` — what to test (behavior matrix: edition × plan × role × feature gate × tenant scope × resource state, with pruning rules), unit vs e2e placement, what to skip, when to delete a test. This section is mechanics only. The checklist below is that doc's summary (canonical here); read the full doc when placement or matrix coverage is unclear.

1. What could actually break here?
2. Needs real DB/HTTP round trip to be meaningful? → e2e. Else → unit.
3. Already pinned by a lower-level unit test? → don't re-assert at e2e.
4. Trivial / framework-guaranteed? → skip.
5. Which matrix cells does this cover — and which are deliberately skipped because they short-circuit or don't interact?

- Location: `test/modules/` mirrors `src/modules/`; each module gets `e2e/` and optional `unit/`.
- Isolation: one-time TRUNCATE in global setup, then **suite-level transaction per spec file with per-test SAVEPOINTs** (no per-test TRUNCATE). A no-op QueryRunner proxy routes service "transactions" through the suite TX; `withRealTransactions(fn)` opts out for tests verifying real rollback.
- Seed data in `beforeAll` (persists across tests in the suite); per-test mocks/config in `beforeEach`; `jest.resetAllMocks()` in `afterEach`; `closeTestApp(app)` in `afterAll` (60s timeout).
- Describe naming: `Controller` → edition (`EE (plan: enterprise)` / `CE` / `Cloud`) → `POST /api/x | Intent` → `it('should ... with ...')`. Reads top-to-bottom as a sentence.
- Edition/plan blocks only when behavior differs: EE-only features add a `CE` block asserting the 403/gating error; plan-variant features get one describe per plan.
- Assert shape with `toMatchObject()` + `expect.any()`, not per-field assertions. Test failure paths (401/403/404) too.
- Helpers are stratified (import from `'test-helper'` barrel, never direct files): setup (bootstrap) / seed (factories) / api (HTTP) / utils (TypeORM) / domain files. New domain helpers → new file, added to barrel. Use seed helpers, not inline entity construction.
- Tag suites with `/** @group platform|workflows|database|marketplace */` before the outermost describe.
- Run: `npm test`, `npm run test:e2e` (`--testPathPatterns`, `-t`, `--group=` filters). `DEBUG_TESTS=true` restores console output.

## Module context files

Per-module context lives in `src/modules/<module>/AGENTS.md`. Existing: app, apps, auth, data-queries, data-sources, git-sync, group-permissions, licensing, versions, workflows.

**Maintenance rule:** meaningfully changing a module (new service, changed invariant, renamed concept, discovered gotcha) means updating its `AGENTS.md` in the same PR. No file yet? Create one from `docs/agents-module-template.md`. Keep them ≤80 lines — pointers and invariants, not prose dumps.
