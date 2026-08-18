# Testing (Backend)

> Tests are documentation first. Describe blocks = table of contents. `it()` blocks = plain English. Assertions = response shape.
> TDD is mandatory: write the failing test BEFORE implementation. Every feature/fix PR starts with a test.

`server/AGENTS.md` carries a summary of this file. This is the full reference: the first half is judgment — what to test and where it belongs — and the second half is mechanics — how to write and run it. Process discipline (red-green-refactor, watch-it-fail) is enforced by the `superpowers:test-driven-development` skill where available; this doc governs what and where, not the cycle.

---

# Part 1 — What to test

## Principle: tests verify behavior, not implementation

A test should survive a rewrite of the function it covers and fail only when the *observable behavior* changes. If it breaks on refactor with no behavior change, it's coupled to implementation, not testing it.

## The behavior matrix — what "a path" means here

Line/branch coverage measures code executed, not decisions that matter. In ToolJet a "path" is a point in this space:

| Axis | Values | Example |
|---|---|---|
| Edition | CE / EE / Cloud | audit logs: EE+ only |
| Plan | enterprise / team / starter | personal workspace: disabled on `team` |
| Role + granular permission | admin / builder / end-user / custom group | `CREATE_GRANULAR_FOLDER_PERMISSIONS` |
| Module/feature gate | `@InitModule`, `@InitFeature` | licensed but module-disabled ≠ unlicensed — distinct rejection paths |
| Tenant scope | own workspace vs. another workspace | cross-tenant read must be denied, not just filtered client-side |
| Resource state | draft/released, archived, soft-deleted | an archived app's endpoints may 404 where a live app's would 403 |

### Pruning rule — don't cross-product everything

Most axes **short-circuit**: a license/plan gate rejects before role is ever evaluated. Test short-circuiting axes **independently, once each**:

- the gate itself, at one representative role (denied + allowed)
- the full role matrix, once, at the plan that passes the gate

Only cross-product axes that **interact** — where the combination produces a *different* outcome than either axis alone predicts. Example: the `team` plan disabling personal workspaces changes what `admin` vs `end-user` can even reach, so plan × role interacts there and earns a small combined table. Everywhere else, testing plan-gate and role-matrix separately covers the space without the combinatorial blowup.

Worked mini-matrix for a hypothetical gated, workspace-scoped endpoint:

- CE → 403 (gate, tested once)
- EE/enterprise, wrong workspace → 404/403 (tenant scope, tested once)
- EE/enterprise, admin → 200 (role, allowed)
- EE/enterprise, end-user without permission → 403 (role, denied)
- EE/enterprise, resource archived → whatever the spec says (resource state, only if it differs from the live-resource case)

Five cases, not the 3×2×4×2 = 48 a naive cross-product would suggest.

## Unit vs e2e — the decision rule

- **Behavior-location rule**: internal branching/filtering/transform logic a service, guard, or util owns → unit, isolated, no DB/HTTP.
- **Pipeline-only meaning** → e2e only, not duplicated at unit level: anything that only means something through HTTP → guard → DB → response.
- **Guard/ability unit** — the third bucket, easy to miss if you think in a strict binary: a real CASL ability factory exercised directly, no HTTP, no DB. See `test/modules/group-permissions/unit/feature-ability.spec.ts` and `test/modules/app/unit/app-auth.guard.spec.ts`.

## What MUST be covered

- Every service-owned branch whose outcome a caller can observe and cares about (the "what could actually break?" heuristic applies here too — a label-formatting branch doesn't qualify)
- Every error path (4xx/5xx) at the e2e layer
- CASL/permission boundary conditions (allowed / denied / edge role)
- Edition and plan variance where behavior actually differs
- Module/feature-gate denial distinct from license denial — a module disabled by config and a feature unlicensed by plan are different rejection paths; don't let one test stand in for both
- **Cross-tenant isolation** — every list/read endpoint gets a "resource belonging to another workspace is not visible or reachable" case. Currently the least-covered MUST-item in this codebase, and the one line coverage will never surface: the missing check and the present one execute the same lines either way
- Data mutation correctness (the row ends up in the expected state)

## What NOT to test

- Framework/library guarantees (TypeORM decorators, NestJS DI wiring)
- Getters/setters, DTOs with no custom validation logic
- Trivial pass-throughs (no branching, no transformation)
- Cross-layer duplicates — see "When to delete a test"
- Log output or console messages as assertions
- Migrations re-run as tests (that's what `db:migrate` in CI is for)
- Empty CE/plan gating blocks for features with no actual divergence
- Heuristic: "what could actually break here?" — if nothing, skip it

## Test doubles — the boundary rule

Mock only boundaries you don't own: external HTTP (Polly.js HAR, see `test/__fixtures__/`), SMTP, S3, git remotes, the license server.

Never mock your own repositories in e2e — that tests the mock, not the pipeline. In unit tests, prefer null-injecting real collaborators over `jest.mock`-ing the module graph. See the constructor pattern in `test/modules/folder-apps/unit/service.spec.ts`: `super(null as unknown as X, ...)` against a subclass that exposes the protected method under test. Cast through `unknown`, never `any`.

## When to delete a test

Addition criteria alone produce accretion, not quality. Two removal signals:

- **Mutation heuristic**: break the implementation on purpose. If the test still passes, it isn't testing anything — delete or fix it.
- **Cross-layer duplicate**: if a unit test already pins a condition, the e2e test for the same condition should assert the pipeline reaches that code, not re-assert the condition's outcome. One of the two is redundant; keep the cheaper one.

## Determinism

- No wall-clock dependence — no sleep-and-hope, no real timers where fake timers work
- No inter-test ordering dependence — each `it()` must pass run alone or shuffled
- No shared mutable state across spec files. Suite-TX + SAVEPOINTs already isolate DB state; don't reintroduce coupling through module-level variables

## Coverage: qualitative, not numeric

No % target. Coverage tooling (`test/jest-coverage.config.ts`) is a regression tripwire, not a scoreboard. Read it as a diff signal on **changed files**: did this PR add a branch with no test touching it? Don't chase a number — use it to spot a specific untested `if`. Exclusions in the config are intentional; uncovered lines in excluded files are not gaps.

## TDD note

Acceptance criteria — or, for a bugfix, the bug report — define WHAT to test. Write the failing test first. For e2e-only behavior, "red" means the request against the real pipeline returns the wrong status or shape, not a compile error. A bugfix's first commit is a test that reproduces the report and fails against pre-fix code.

## Anti-patterns

- Snapshotting large objects instead of asserting the shape that matters
- One `it()` covering five behaviors — you can't tell what broke

(Over-mocking and guard re-testing are covered by the boundary rule and the guard-unit bucket above — one layer per rule.)

## Worked examples

- **Pure branching logic → unit, no DB**: `test/modules/folder-apps/unit/service.spec.ts` — `FolderAppsService.filterFoldersByPermissions` exercised via a subclass that exposes the protected method, collaborators null-injected.
- **Authorization decision → guard unit, real factory, no HTTP**: `test/modules/group-permissions/unit/feature-ability.spec.ts`.
- **Gated + workspace-scoped endpoint → e2e only**: `test/modules/folder-apps/e2e/folder-apps.spec.ts` — meaning only exists through HTTP → guard → DB → response; not duplicated at unit level.

## Decision checklist (before writing a test)

1. What could actually break here?
2. Needs a real DB/HTTP round trip to be meaningful? → e2e. Else → unit.
3. Already pinned by a lower-level unit test? → don't re-assert at e2e.
4. Trivial or framework-guaranteed? → skip.
5. Which matrix cells does this cover — and which are deliberately skipped because they short-circuit or don't interact?

---

# Part 2 — How to write it

## Running tests

| Type | Command |
|------|---------|
| All unit | `npm test` |
| All e2e (sequential shards) | `npm run test:e2e` |
| All e2e (parallel, CI only) | `npm run test:e2e -- --ci` |
| E2e + coverage | `npm run test:e2e:cov` |
| Unit + coverage | `npm run test:cov` |
| Merge unit + e2e coverage | `npm run test:cov:merge` |

```bash
# Specific file
npm test -- test/modules/encryption/unit/encryption.service.spec.ts
npm run test:e2e -- --testPathPatterns "session"

# Specific describe/it block (-t matches describe or it name)
npm test -- test/modules/encryption/unit/encryption.service.spec.ts -t "should encrypt"
npm run test:e2e -- --testPathPatterns "session" -t "POST /api/session"

# By @group
npm run test:e2e -- --group=platform
npm run test:e2e -- --group=workflows

# Record HTTP fixtures (Polly.js)
npm run test:e2e:record -- --testPathPatterns "workflow-bundles"
```

`DEBUG_TESTS=true` restores suppressed console output. The e2e runner (`scripts/run-e2e.sh`) uses 3 sequential shards by default; `--ci` creates per-shard databases and runs them in parallel, which needs CI-grade hardware.

## Directory structure

Tests mirror `src/modules/`. Each module gets `e2e/` and optionally `unit/`:

```
test/
├── helpers/          # Stratified (see below)
│   ├── setup.ts      # Bootstrap: initTestApp, closeTestApp, suite TX, no-op proxy
│   ├── seed.ts       # Factories: createAdmin, createApplication, grantAppPermission
│   ├── api.ts        # HTTP: login, logout, buildTestSession
│   ├── utils.ts      # TypeORM: findEntity, saveEntity, getEntityRepository
│   └── workflows.ts  # Domain: createCompleteWorkflow, buildWorkflowDefinition
├── jest-transaction-setup.ts  # SAVEPOINTs: beforeEach/afterEach/afterAll hooks
├── jest-global-setup.ts       # One-time TRUNCATE before all tests
├── modules/
│   └── <module>/
│       ├── e2e/<module>.spec.ts
│       └── unit/<service>.spec.ts
├── __fixtures__/     # HAR recordings (Polly.js)
└── __mocks__/        # Module mocks (mariadb)
```

## Test isolation

Suite-level transactions with per-test SAVEPOINTs replace per-test TRUNCATE:

```
globalSetup: TRUNCATE once (raw pg)

Per spec file:
  initTestApp() → BEGIN suite TX + install no-op QR proxy
  beforeAll: seed data (persists across all tests in this describe)
  Per test:
    beforeEach (framework): SAVEPOINT test_N
    beforeEach (spec):      per-test mocks/spies (builds on beforeAll)
    test body               (all queries route through suite TX via proxy)
    afterEach (spec):       jest.resetAllMocks()
    afterEach (framework):  ROLLBACK TO SAVEPOINT test_N
  afterAll: ROLLBACK suite TX (undoes all beforeAll + test data)
```

**Key rules:**

- `beforeAll` data persists across all tests — seed once, reuse
- `beforeEach` data is rolled back after each test — use it for per-test mocks, config overrides, or seed that varies per test
- `beforeEach` builds on top of `beforeAll` — never duplicate seed that already exists there
- The no-op QueryRunner proxy intercepts `startTransaction`/`commitTransaction`/`rollbackTransaction`/`release`: service code believes it has its own transaction while every query routes through the suite TX
- `withRealTransactions(fn)` opts out of the proxy for tests that verify real rollback behavior (e.g. bulk import error handling)

## Describe blocks

### E2E template

```typescript
/** @group platform */
describe('SessionController', () => {

  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });
    afterEach(() => { jest.resetAllMocks(); });
    afterAll(async () => { await closeTestApp(app); }, 60000);

    describe('POST /api/session | Create session', () => {
      it('should return 200 with valid credentials', async () => {
        const admin = await createAdmin(app);
        const res = await request(app.getHttpServer())
          .post('/api/session')
          .send({ email: admin.user.email, password: 'password' });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          id: expect.any(String),
          email: admin.user.email,
          organization_id: expect.any(String),
        });
      });

      it('should return 401 with invalid password', async () => { ... });
    });
  });

  describe('CE', () => {
    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce' }));
    });
    // CE tests verify feature gating: 403s, enterprise-only errors
  });
});
```

### Unit template

```typescript
describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();
    service = module.get(EncryptionService);
  });

  describe('encrypt()', () => {
    it('should encrypt and decrypt to same plaintext', () => { ... });
    it('should handle special characters', () => { ... });
  });
});
```

### Naming rules

| Level | Convention | Example |
|-------|-----------|---------|
| Outermost | PascalCase class | `describe('SessionController')` |
| Edition | Edition + plan | `describe('EE (plan: enterprise)')` |
| Endpoint | HTTP method + route \| intent | `describe('POST /api/session \| Create session')` |
| Test case | `should` + action + condition | `it('should return 401 with invalid password')` |

Read top to bottom as a sentence: *SessionController → EE (plan: enterprise) → POST /api/session | Create session → should return 401 with invalid password*

## Edition and plan

Same file, separate describe blocks per edition. Each gets its own `beforeAll(initTestApp({ edition, plan }))`.

| Scenario | Sections to write |
|----------|------------------|
| Feature exists in all editions | `EE (plan: enterprise)` only — CE/Cloud inherit unless behavior differs |
| Feature is EE-only | `EE (plan: enterprise)` + `CE` (verify 403 / enterprise-only error) |
| Feature varies by plan | Separate sections: `EE (plan: enterprise)`, `EE (plan: team)` |
| Feature is Cloud-only | `Cloud` + `EE` / `CE` (verify feature gating) |

Only add CE/Cloud/plan sections when behavior **actually differs**. Don't write empty gating tests for features available everywhere.

### CE tests verify feature gating

```typescript
describe('CE', () => {
  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
  });

  it('should return enterprise feature error', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/audit-logs')
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(403);
  });
});
```

### Plan variance — separate describe per plan

```typescript
describe('EE (plan: enterprise)', () => {
  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  // full feature tests
});

describe('EE (plan: team)', () => {
  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'team' }));
  });
  // plan-specific restrictions (e.g. personal workspace disabled)
});
```

### Cloud tests

```typescript
describe('Cloud', () => {
  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'cloud' }));
  });
  // cloud-specific behavior
});
```

## Assertions

Assert **structure**, not individual attributes:

```typescript
// ✅ Shape — shows what the response looks like
expect(res.body).toMatchObject({
  id: expect.any(String),
  name: 'My App',
  status: 'active',
});

// ❌ Per-field — noisy, hides the shape
expect(res.body.id).toBeDefined();
expect(res.body.name).toBe('My App');
```

| Matcher | Use for |
|---------|---------|
| `toMatchObject()` | Response shape |
| `expect.any(String)` | Dynamic values (IDs, dates) |
| `expect.stringMatching()` | Patterns (UUID, semver) |
| `expect.arrayContaining()` | Subset of a collection |

Test both success and failure paths (401, 403, 404).

## Helpers — stratified design

Each layer is one abstraction level. Import from `'test-helper'` (mapped via `moduleNameMapper`), never directly from helper files.

| Layer | File | Functions | Abstraction |
|-------|------|-----------|-------------|
| Bootstrap | `setup.ts` | `initTestApp` `closeTestApp` `getDefaultDataSource` `withRealTransactions` | App lifecycle + TX isolation |
| Seed | `seed.ts` | `createAdmin` `createEndUser` `createApplication` `grantAppPermission` `ensureAppEnvironments` | DB factories |
| API | `api.ts` | `login` `logout` `buildTestSession` `buildAuthHeader` | HTTP actions |
| Utilities | `utils.ts` | `findEntity` `saveEntity` `updateEntity` `deleteEntities` `getEntityRepository` | TypeORM shortcuts |
| Domain | `workflows.ts` | `createCompleteWorkflow` `buildWorkflowDefinition` `setupOrganizationAndUser` | Workflow-specific |

New domain helpers get a new file (e.g. `tooljet-db.ts`) added to the barrel.

## @group

| Value | Scope |
|-------|-------|
| `platform` | Core features (session, auth, org, users, app) |
| `workflows` | Workflow engine |
| `database` | ToolJet DB |
| `marketplace` | Marketplace/plugins |

JSDoc immediately before the outermost `describe`. Both e2e and unit tests use `@group` for team ownership. Filter with `--group=<name>`.

## Rules

- Seed data in `beforeAll`, per-test mocks and spies in `beforeEach` — the suite TX and SAVEPOINTs handle isolation
- `beforeEach` builds on `beforeAll`; never duplicate seed that already exists there
- Use `withRealTransactions()` only for tests that verify real rollback behavior
- `closeTestApp(app)` in `afterAll` with a 60s timeout
- Never abbreviate `data_source` as `ds`
- Use seed helpers, not inline entity construction
- Tests should read like documentation — if a describe or it is opaque, rewrite it
