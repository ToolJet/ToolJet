# Design: Stratified Test Helpers (Grokking Simplicity)

## Problem

`test.helper.ts` is 1,362 lines mixing 5 abstraction layers. 124+ raw TypeORM calls leak ORM internals into test files. 17 of 27 exported functions are dead code or internal-only. Test setup code doesn't speak the domain language (editions, plans, roles) — it speaks NestJS/TypeORM implementation details.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | Flat functions, no wrapper object | Simpler imports, familiar pattern |
| Naming | Domain language (ubiquitous language) | Tests read as specs, not implementation |
| Plan/edition | Always explicit: `initTestApp({ edition: 'ee', plan: 'team' })` | Forces test authors to think about what they're testing |
| User factories | Role-based: `createAdmin()`, `createBuilder()`, `createEndUser()` | Domain terms, not group arrays |
| Auth | Auto-login in role factories + separate `loginAs()` | Common case is fast, auth tests stay explicit |
| ORM hiding | Entity factory functions + generic `findEntity`/`updateEntity` | No TypeORM imports in test files |
| Migration | Helpers first (this PR), test files gradual (follow-up) | Safe incremental approach |
| Dead code | Delete 17 unused functions | Smaller surface, less confusion |
| File structure | 4 files (bootstrap, seed, api, cleanup) + barrel | Cohesion over granularity |

## Public API

### Layer 4: Bootstrap (`helpers/bootstrap.ts`)

```typescript
// Initialize the test app with explicit edition and plan context
initTestApp(options?: {
  edition?: 'ce' | 'ee' | 'cloud';  // default: 'ee' (from TOOLJET_EDITION)
  plan?: 'basic' | 'starter' | 'pro' | 'team' | 'enterprise';  // default: 'enterprise'
  mockConfig?: boolean;  // true = use createNestAppInstanceWithEnvMock pattern
}): Promise<INestApplication>

// Access the shared DataSource (internal — prefer entity helpers)
getDefaultDataSource(): TypeOrmDataSource
```

`initTestApp` replaces: `createNestAppInstance()` + `createNestAppInstanceWithEnvMock()` + `createNestAppInstanceWithServiceMocks()` + `setDataSources()`. Plan parameter configures the LicenseTermsService mock to return plan-appropriate values (basic = restricted, team = SSO + custom groups, enterprise = everything).

### Layer 0: Cleanup (`helpers/cleanup.ts`)

```typescript
// Reset DB between tests — terminates stale connections, truncates all tables
resetDB(): Promise<void>
```

Replaces `clearDB()`. Same implementation, clearer name.

### Layer 2: Seed — Users (`helpers/seed.ts`)

```typescript
// Role-based user factories — auto-login, return { user, workspace, cookie }
createAdmin(email: string, options?: { workspace?: Organization }): Promise<TestUser>
createBuilder(email: string, options?: { workspace?: Organization }): Promise<TestUser>
createEndUser(email: string, options?: { workspace?: Organization }): Promise<TestUser>
createSuperAdmin(email: string): Promise<TestUser>

// Low-level — no auto-login, for auth-specific tests
createUser(options: {
  email: string;
  role?: 'admin' | 'builder' | 'end-user';
  workspace?: Organization;
  superAdmin?: boolean;
}): Promise<{ user: User; workspace: Organization }>

// Type returned by role factories
interface TestUser {
  user: User;
  workspace: Organization;
  cookie: string;  // ready-to-use auth cookie
}
```

### Layer 2: Seed — Entities (`helpers/seed.ts`)

```typescript
// App lifecycle
createApp(options: { user: User; name?: string; isPublic?: boolean; slug?: string }): Promise<App>
createAppVersion(app: App, options?: { name?: string }): Promise<AppVersion>
createAppWithDependencies(options: {
  user: User;
  name?: string;
  isPublic?: boolean;
  dsKind?: string;
  dsOptions?: any[];
}): Promise<{ app: App; version: AppVersion; dataSource: DataSource; dataQuery: DataQuery; environments: AppEnvironment[] }>

// Data layer
createDataSource(options: { appVersion: AppVersion; name: string; kind: string }): Promise<DataSource>
createDataQuery(options: { dataSource: DataSource; appVersion?: AppVersion }): Promise<DataQuery>

// Permissions
grantAppPermission(app: App, groupId: string, perms: { read?: boolean; edit?: boolean }): Promise<void>

// Infrastructure
ensureAppEnvironments(workspaceId: string): Promise<AppEnvironment[]>
ensureInstanceSSOConfigs(options?: { enabled?: boolean }): Promise<void>
ensureBuiltInDataSources(app: INestApplication): Promise<void>

// Folders, files
createFolder(options: { name: string; workspace: Organization }): Promise<Folder>
createFile(): Promise<File>

// Version management
markVersionAsReleased(app: App, version: AppVersion): Promise<void>
```

### Layer 3: API (`helpers/api.ts`)

```typescript
// Authentication — for tests that specifically test login/logout
loginAs(user: User, options?: { workspace?: Organization }): Promise<{ cookie: string }>
logout(cookie: string, workspaceId: string): Promise<void>

// Onboarding
verifyInviteToken(token: string): Promise<any>
setupAccountFromToken(token: string, body: any): Promise<any>
```

### Layer 1: Generic Entity Helpers (`helpers/cleanup.ts` or `helpers/seed.ts`)

```typescript
// Escape hatch — for assertions and edge cases where no domain factory exists
findEntity<T>(Entity: Type<T>, where: any): Promise<T | null>
updateEntity<T>(Entity: Type<T>, id: string, updates: Partial<T>): Promise<void>
countEntities<T>(Entity: Type<T>, where?: any): Promise<number>
```

These replace direct `defaultDataSource.manager.findOne()`, `.update()`, `.count()` calls in test files.

### Barrel Re-export (`test.helper.ts`)

```typescript
// All existing imports continue to work via barrel re-export.
// New code should import from helpers/ directly.
export * from './helpers/bootstrap';
export * from './helpers/cleanup';
export * from './helpers/seed';
export * from './helpers/api';

// DEPRECATED — backward compatibility aliases
// These will be removed once all test files are migrated.
export { createAdmin as createUser } from './helpers/seed';  // signature adapter needed
export { initTestApp as createNestAppInstance } from './helpers/bootstrap';
export { resetDB as clearDB } from './helpers/cleanup';
export { loginAs as authenticateUser } from './helpers/api';
```

## Dead Code Removal (17 functions)

| Function | Disposition |
|----------|-------------|
| `createUserGroupPermissions` | Make private in seed.ts (internal to createUser) |
| `createGroupPermission` | Make private in seed.ts |
| `maybeCreateDefaultGroupPermissions` | Rename to `ensureDefaultGroups`, make private |
| `addEndUserGroupToUser` / `addAllUsersGroupToUser` | Make private, called only by createUser |
| `createThread` | Delete (deprecated stub, threads removed) |
| `importAppFromTemplates` | Delete (deprecated stub) |
| `installPlugin` | Delete (never called) |
| `createFirstUser` | Delete (never imported) |
| `generateRedirectUrl` | Delete (never imported) |
| `createSSOMockConfig` | Delete (never imported, OAuth tests mock differently now) |
| `getPathFromUrl` | Delete (never imported) |
| `enableWebhookForWorkflows` | Move to workflows.helper.ts (its only consumer) |
| `getWorkflowWebhookApiToken` | Move to workflows.helper.ts |
| `enableWorkflowStatus` | Move to workflows.helper.ts |
| `triggerWorkflowViaWebhook` | Move to workflows.helper.ts |
| `setupOrganization` | Inline into its 1 caller, then delete |

## Function Renames

| Old Name | New Name | Reason |
|----------|----------|--------|
| `generateAppDefaults` | `createAppWithDependencies` | Describes what it actually creates |
| `getAppWithAllDetails` | `findAppWithRelations` | "find" = query, "with relations" = eager load |
| `authHeaderForUser` | `buildAuthHeader` | "build" = pure calculation |
| `createTestSession` | `buildTestSession` | Same reasoning |
| `releaseAppVersion` | `markVersionAsReleased` | Action verb + past participle |
| `seedInstanceSSOConfigs` | `ensureInstanceSSOConfigs` | "ensure" = idempotent |
| `createDefaultDataSources` | `ensureBuiltInDataSources` | "ensure" = idempotent, "built-in" = domain term |
| `createAppGroupPermission` | `grantAppPermission` | Domain verb, hides GroupPermission entity |
| `createAppEnvironments` | `ensureAppEnvironments` | "ensure" = idempotent |
| `clearDB` | `resetDB` | Clearer intent |
| `createNestAppInstance*` | `initTestApp` | Hides NestJS |

## File Structure

```
server/test/
  test.helper.ts              ← barrel re-export + backward compat aliases (~50 lines)
  workflows.helper.ts         ← unchanged (parallel ecosystem, documented why)
  helpers/
    bootstrap.ts              ← initTestApp, getDefaultDataSource, plan mock (~200 lines)
    seed.ts                   ← all entity creation + permissions (~450 lines)
    api.ts                    ← loginAs, logout, onboarding helpers (~120 lines)
    cleanup.ts                ← resetDB + generic entity helpers (~100 lines)
```

## Dependency Graph

```
bootstrap.ts (standalone — env loading, app lifecycle)
    ↑           ↑           ↑
cleanup.ts    seed.ts      api.ts
```

No circular dependencies. Each file only imports from bootstrap.

## Migration Strategy

### Phase 1: Build the new API (this PR)

1. Create `helpers/` directory with 4 files
2. Implement new functions, calling old implementations internally
3. Barrel re-export with backward compat aliases
4. Delete dead code
5. Verify: all 527+ tests pass unchanged

### Phase 2: Migrate test files (follow-up PRs, one file per iteration)

Use autoresearch:
- **Goal:** Migrate test files to new API, eliminate TypeORM imports
- **Metric:** TypeORM import count in test files (target: 0)
- **Verify:** `grep -rn "getDataSourceToken\|from 'typeorm'" test/controllers/ | wc -l`
- **Iteration:** One test file per cycle, verify after each

Priority order (by ORM leakage count):
1. `folders.e2e-spec.ts` (20+ raw manager calls)
2. `apps.e2e-spec.ts` (15+ raw calls)
3. `oauth-git.e2e-spec.ts` (10+ repository calls)
4. Remaining files

### Phase 3: Remove backward compat aliases

Once all test files are migrated, remove the aliases from the barrel and delete old function signatures.

## Plan-Aware Mock Configuration

The `plan` parameter in `initTestApp` configures the LicenseTermsService mock:

| Plan | APP_COUNT | CUSTOM_GROUPS | SSO | MULTI_ENV | AUDIT_LOGS |
|------|-----------|---------------|-----|-----------|------------|
| basic | 2 | false | false | false | false |
| starter | 2 | false | false | false | false |
| pro | 5 | false | true | false | false |
| team | UNLIMITED | true | true | true | true |
| enterprise | UNLIMITED | true | true | true | true |

The default (`enterprise`) behaves like today's `'UNLIMITED'` mock. Tests that need to verify plan restrictions use `initTestApp({ plan: 'basic' })`.

## Verification

After Phase 1:
1. `cd server && npx jest --config jest.config.ts --forceExit --no-coverage` — all unit tests pass
2. Run each e2e file individually — all 29 pass
3. `grep -rn "describe.skip\|it.skip\|xit(" test/ | grep -v python-sandbox` — zero skips
4. Each helpers/ file under 500 lines
5. No circular dependencies between helper files

## What This Does NOT Change

- Test file imports (barrel preserves backward compat)
- Test behavior (zero assertion changes)
- workflows.helper.ts (documented as parallel ecosystem)
- Production code (pure test infrastructure)
