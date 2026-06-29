# Testing Patterns

**Analysis Date:** 2026-06-29

Testing spans three layers: server unit + e2e (Jest + Supertest), frontend component tests
(Jest + React Testing Library) and Storybook, plugin connector tests (Jest + ts-jest), and
full-stack E2E (Cypress under `cypress-tests/`).

## Test Framework

**Server:** Jest 30 + ts-jest 29 + Supertest 7 + `@nestjs/testing`.
- Unit config: `server/jest.config.ts`
- E2E config: `server/test/jest-e2e.config.ts`
- Coverage config: `server/test/jest-coverage.config.ts`
- Uses `jest-runner-groups` (`runner: 'groups'`) — tests tagged with a `@group` JSDoc tag.
- Polly.js (`setup-polly-jest`) for HTTP record/replay in e2e.

**Frontend:** Jest 29 (config inline in `frontend/package.json` `"jest"` block) + `babel-jest`
transform + `@testing-library/react` + `@testing-library/jest-dom`. `jest-environment-jsdom`.
Storybook 9 (`@storybook/react-webpack5`) for component dev/docs.

**Plugins:** Jest with `ts-jest` preset, `testEnvironment: 'node'` (`plugins/jest.config.js`).

**E2E (full app):** Cypress 15 (`cypress-tests/`), Chrome, with `@cypress/code-coverage` and `cypress-mailhog`.

**Run Commands:**
```bash
# Server unit (test/modules/**/unit/*.spec.ts)
npm --prefix server run test            # jest --config jest.config.ts --maxWorkers=50%
npm --prefix server run test:cov        # + coverage (coverage-unit/)
npm --prefix server run test:watch

# Server e2e (test/modules/**/e2e/*.spec.ts)
npm --prefix server run test:e2e        # bash scripts/run-e2e.sh
npm --prefix server run test:e2e:record # POLLY_MODE=record

# Frontend
npm --prefix frontend run test          # jest
npm --prefix frontend run storybook     # storybook dev -p 6006

# Cypress (from cypress-tests/)
npm --prefix cypress-tests run cy:run   # headless chrome
npm --prefix cypress-tests run cy:open
```

## Test File Organization

**Server (separate tree, NOT co-located):** All tests live under `server/test/modules/<module>/`,
split into `unit/` and `e2e/` subdirs:
- Unit testRegex: `test/modules/.*/unit/.*spec\.ts$`
- E2E testRegex: `test/modules/.*/e2e/.*spec\.ts$`
- Naming: `<name>.service.spec.ts`, `<controller>.spec.ts`.
- Shared helpers: `server/test/test.helper.ts` (barrel), `server/test/helpers/`,
  `server/test/__mocks__/`, `server/test/__fixtures__/`.

**Frontend (co-located):** Tests in `__tests__/` dirs next to source —
`frontend/src/_components/__tests__/Pagination.test.js`. Stories co-located as
`<Component>.stories.jsx`. Some components ship a `<Component>.spec.md` design spec (not a test).

**Plugins:** `plugins/packages/<name>/__tests__/<name>.test.js`.

**Cypress:** `cypress-tests/cypress/e2e/happyPath/**/*.cy.js` (specPattern), support in
`cypress-tests/cypress/support/`, fixtures in `cypress/fixtures/`, commands in `cypress/commands/`.

## Test Structure

**Server group tagging (required for the groups runner):**
```typescript
/** @group platform */   // or: database | security | workflows
describe('DataSourcesController', () => { ... });
```

**Server e2e (Supertest against a real Nest app):**
```typescript
import * as request from 'supertest';
import { initTestApp, closeTestApp, createUser, login, resetDB } from 'test-helper';

describe('DataSourcesController', () => {
  let nestApp: INestApplication;
  beforeAll(async () => { ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' })); });
  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { await closeTestApp(nestApp); }, 60_000);

  it('should allow admin to create a data source', async () => {
    const adminUserData = await createUser(nestApp, { email: 'admin@tooljet.io', groups: ['all_users', 'admin'] });
    const loggedUser = await login(nestApp, adminUserData.user.email);
    const response = await request(nestApp.getHttpServer())
      .post('/api/data-sources')
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie);
  });
});
```

**Server unit (mocked DI, no DB/app):**
```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    SessionService,
    { provide: UserRepository, useValue: { updateOne: jest.fn().mockResolvedValue(undefined) } },
  ],
}).compile();
```

**Frontend component:**
```typescript
import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

describe('Pagination', () => {
  const props = { currentPage: 1, count: 100, itemsPerPage: 10, pageChanged: jest.fn() };
  it('should allow the user to click on next nav', () => {
    const { getByTestId } = render(<Pagination {...props} />);
    fireEvent.click(getByTestId('next'));
    expect(props.pageChanged).toHaveBeenCalled();
  });
});
```

## Mocking

**Framework:** Jest mocks throughout.

**Server patterns:**
- Module-level `jest.mock('...')` for side-effecting imports (DB helpers, OpenTelemetry,
  CLS RequestContext) — placed before `describe` (see `session.service.spec.ts`).
- `dbTransactionWrap` mocked to invoke its callback with a fake manager.
- Provider replacement via `{ provide: X, useValue: { ...jest.fn() } }` in `Test.createTestingModule`.
- Typed mocks: `jest.Mocked<SessionUtilService>`.
- `jest.resetAllMocks()` in `afterEach`.
- ESM-only deps mocked at config level: `^mariadb$` → `test/__mocks__/mariadb.ts` (jest can't `require()` it).
- E2E HTTP recorded/replayed via Polly (`POLLY_MODE=record`).

**Frontend patterns:** `jest.mock('react', () => ({ ...jest.requireActual('react'), useState: jest.fn() }))`;
SVG imports mocked via `__mocks__/svg.js`. Query by `data-testid` using `getByTestId`.

**What to mock:** External side effects (DB, telemetry, HTTP, request context, ESM-only native modules).
**What NOT to mock:** The system under test; in e2e the real Nest app and DB are used (via `initTestApp`/`resetDB`).

## Fixtures and Factories

- Server: factory helpers in the `test-helper` barrel — `createUser`, `createApplication`,
  `createDataSource`, `createAppWithDependencies`, `login`, `resetDB`, `ensureAppEnvironments`,
  `initTestApp`, `closeTestApp`. Static fixtures in `server/test/__fixtures__/`.
- Frontend: inline prop objects per `describe`.
- Cypress: JSON fixtures in `cypress-tests/cypress/fixtures/`, mailhog for email assertions.

## Coverage

- Server: `npm --prefix server run test:cov` → `server/coverage-unit/`; merge unit+e2e via
  `npm --prefix server run test:cov:merge`. No hard threshold enforced in CI configs reviewed.
- Cypress: `@cypress/code-coverage` instrumented.
- Frontend: no enforced coverage threshold.

## Test Types

- **Unit:** Fully mocked providers, `testEnvironment: 'node'`, 30s timeout (`server/jest.config.ts`).
- **Integration/E2E (server):** Real Nest app + DB via Supertest, 60s timeout, retries via
  `jest-retry-setup.ts`, transactional setup via `jest-transaction-setup.ts`.
- **Component (frontend):** RTL render + fireEvent in jsdom.
- **E2E (app):** Cypress happy-path specs, baseUrl `http://localhost:8082`, `runMode` retries: 2.

> Project memory note: do NOT add new frontend jest/test files for ToolJet frontend work —
> verify frontend changes manually. This section documents existing patterns for reference.

## Common Patterns

**Async testing:** `async`/`await` with awaited Supertest requests and `mockResolvedValue`.

**Error testing (server):** Assert thrown NestJS exceptions, e.g.
`await expect(service.fn()).rejects.toThrow(NotFoundException)`.

---

*Testing analysis: 2026-06-29*
