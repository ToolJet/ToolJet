# Testing Conventions (Backend)

> Tests are documentation first. Describe blocks = table of contents. `it()` blocks = plain English. Assertions = response shape.
> TDD is mandatory: write failing tests BEFORE implementation. Every feature/fix PR starts with a test.

> **Judgment layer** (what to test, unit vs e2e placement, what to skip, when to delete): `testing-philosophy.md`, alongside this file. This one stays mechanics-only.

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

## TDD workflow

Acceptance criteria define WHAT to test; this guide defines HOW to structure those tests.

1. Read acceptance criteria from the issue or plan phase
2. For each criterion, write a failing test first, using the patterns above
3. Write the minimal implementation that passes
4. Refactor
5. Repeat for the next criterion
