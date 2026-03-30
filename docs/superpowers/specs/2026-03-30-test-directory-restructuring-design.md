# Design: Test Directory Restructuring + Edition Conventions

## Problem

Test files live in a flat `test/controllers/` directory with no correspondence to `src/modules/`. Edition testing is implicit (always EE). Configuration variants (personal-ws-disabled, super-admin) live in ad-hoc subdirectories. There's no convention for testing CE vs EE vs Cloud behavior.

## Decisions

| Decision | Choice |
|----------|--------|
| Directory layout | Mirror `src/modules/<name>/` with `e2e/` and `unit/` subdirs |
| Test kind separation | Subdirectories: `modules/<name>/e2e/` and `modules/<name>/unit/` |
| Filename convention | Drop `.e2e-spec.ts` suffix — just `.spec.ts`. Path determines test kind. |
| Edition in tests | Always explicit: `initTestApp({ edition: 'ee', plan: 'team' })` |
| File per module | One file, describe blocks per edition/configuration |
| Config variants | Describe blocks with `initTestApp({ config: {...} })`, not subdirectories |
| Migration | Move all 29 files at once |
| Unit tests | Move into `test/modules/<name>/unit/` if they belong to a module |

## Directory Structure

Each module has `e2e/` for integration tests (HTTP via supertest) and `unit/` for service/logic tests. The path tells you the kind — no filename suffix needed.

```
server/test/
  helpers/
    setup.ts
    utils.ts
    seed.ts
    api.ts
  test.helper.ts                            — barrel re-export
  workflows.helper.ts                       — parallel workflow ecosystem

  modules/
    apps/
      e2e/
        apps.spec.ts                        ← controllers/apps.e2e-spec.ts
    app/
      e2e/
        app.spec.ts                         ← + personal-ws-disabled/app + super-admin/app (merged)
    session/
      e2e/
        session.spec.ts
    data-sources/
      e2e/
        data-sources.spec.ts
    data-queries/
      e2e/
        data-queries.spec.ts
      unit/
        util.service.spec.ts               ← modules/data-queries/util.service.spec.ts
    organizations/
      e2e/
        organizations.spec.ts              ← + personal-ws-disabled/organizations (merged)
    organization-users/
      e2e/
        organization-users.spec.ts
    folders/
      e2e/
        folders.spec.ts
    folder-apps/
      e2e/
        folder-apps.spec.ts
    group-permissions/
      e2e/
        group-permissions.spec.ts
    org-constants/
      e2e/
        org-constants.spec.ts
    instance-settings/
      e2e/
        instance-settings.spec.ts
    files/
      e2e/
        files.spec.ts
    library-apps/
      e2e/
        library-apps.spec.ts
    users/
      e2e/
        users.spec.ts
      unit/
        users.service.spec.ts              ← services/users.service.spec.ts
    auth/
      e2e/
        oauth-git.spec.ts
        oauth-google.spec.ts
        oauth-saml.spec.ts
        oauth-git-instance.spec.ts         ← super-admin + personal-ws-disabled (merged)
        oauth-google-instance.spec.ts
    onboarding/
      e2e/
        form-auth.spec.ts
    tooljet-db/
      e2e/
        tooljetdb-roles.spec.ts
    workflows/
      e2e/
        workflow-bundles.spec.ts
        workflow-executions.spec.ts
        workflow-webhook.spec.ts

  services/                                 — standalone unit tests (not tied to a module)
    encryption.service.spec.ts
    python-executor.service.spec.ts
    javascript-bundle-generation.service.spec.ts
    npm-registry.service.spec.ts
    pypi-registry.service.spec.ts
    python-bundle-generation.service.spec.ts
    python-sandbox-security.spec.ts
    app-import-export.service.spec.ts
    tooljet-db-import-export.service.spec.ts
    tooljet-db-operations.service.spec.ts
```

## Jest Config Changes

### E2E tests (`test/jest-e2e.json`)

```json
{
  "testRegex": "test/modules/.*/e2e/.*spec\\.ts$"
}
```

### Unit tests (`jest.config.ts`)

```typescript
{
  testRegex: "test/(modules/.*/unit|services)/.*spec\\.ts$"
}
```

Both configs target by path, not filename suffix. `e2e/` = integration, `unit/` = service, `services/` = standalone unit.

## Edition Convention

Every describe block declares its edition and plan explicitly:

```typescript
describe('apps controller (EE, team plan)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'team' }));
  });

  beforeEach(async () => {
    await resetDB();
  });

  afterAll(async () => {
    await app.close();
  });

  // ... tests
});

describe('apps controller (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce', plan: 'basic' }));
  });

  it('EE-only endpoints return 404', async () => {
    // ...
  });
});
```

### Edition + plan matrix

| Describe block name | edition | plan | What it tests |
|---------------------|---------|------|---------------|
| `(EE, enterprise)` | `'ee'` | `'enterprise'` | Full feature set |
| `(EE, team)` | `'ee'` | `'team'` | SSO + custom groups + multi-env |
| `(EE, basic)` | `'ee'` | `'basic'` | Restricted plan (hardcoded permissions) |
| `(CE)` | `'ce'` | `'basic'` | CE stubs throw, EE endpoints 404 |
| `(EE, personal workspace disabled)` | `'ee'` | `'team'` | + `config: { DISABLE_MULTI_WORKSPACE: 'true' }` |

### `initTestApp` changes needed

The `edition` parameter sets `process.env.TOOLJET_EDITION` BEFORE `AppModule.register()` so `getImportPath()` routes correctly:

```typescript
export async function initTestApp(options?: {
  edition?: 'ce' | 'ee' | 'cloud';
  plan?: 'basic' | 'starter' | 'pro' | 'team' | 'enterprise';
  mockConfig?: boolean;
  mockLicenseService?: boolean;
  config?: Record<string, string>;  // arbitrary ConfigService overrides
}): Promise<InitTestAppResult>
```

The `config` parameter merges into ConfigService mock, enabling `DISABLE_MULTI_WORKSPACE` and similar toggles.

## File Mapping (old → new)

| Old path | New path |
|----------|----------|
| `controllers/apps.e2e-spec.ts` | `modules/apps/e2e/apps.spec.ts` |
| `controllers/app.e2e-spec.ts` | `modules/app/e2e/app.spec.ts` (merges personal-ws + super-admin) |
| `controllers/personal-ws-disabled/app.e2e-spec.ts` | merged into `modules/app/e2e/app.spec.ts` |
| `controllers/super-admin/app.e2e-spec.ts` | merged into `modules/app/e2e/app.spec.ts` |
| `controllers/organizations.e2e-spec.ts` | `modules/organizations/e2e/organizations.spec.ts` (merges personal-ws) |
| `controllers/personal-ws-disabled/organizations.e2e-spec.ts` | merged |
| `controllers/organization_users.e2e-spec.ts` | `modules/organization-users/e2e/organization-users.spec.ts` |
| `controllers/data_sources.e2e-spec.ts` | `modules/data-sources/e2e/data-sources.spec.ts` |
| `controllers/data_queries.e2e-spec.ts` | `modules/data-queries/e2e/data-queries.spec.ts` |
| `controllers/folders.e2e-spec.ts` | `modules/folders/e2e/folders.spec.ts` |
| `controllers/folder_apps.e2e-spec.ts` | `modules/folder-apps/e2e/folder-apps.spec.ts` |
| `controllers/group_permissions.e2e-spec.ts` | `modules/group-permissions/e2e/group-permissions.spec.ts` |
| `controllers/org_constants.e2e-spec.ts` | `modules/org-constants/e2e/org-constants.spec.ts` |
| `controllers/instance_settings.e2e-spec.ts` | `modules/instance-settings/e2e/instance-settings.spec.ts` |
| `controllers/files.e2e-spec.ts` | `modules/files/e2e/files.spec.ts` |
| `controllers/library_apps.e2e-spec.ts` | `modules/library-apps/e2e/library-apps.spec.ts` |
| `controllers/users.e2e-spec.ts` | `modules/users/e2e/users.spec.ts` |
| `controllers/session.e2e-spec.ts` | `modules/session/e2e/session.spec.ts` |
| `controllers/oauth/oauth-git.e2e-spec.ts` | `modules/auth/e2e/oauth-git.spec.ts` |
| `controllers/oauth/oauth-google.e2e-spec.ts` | `modules/auth/e2e/oauth-google.spec.ts` |
| `controllers/oauth/oauth-saml.e2e-spec.ts` | `modules/auth/e2e/oauth-saml.spec.ts` |
| `controllers/oauth/personal-ws-disabled/*` | merged into `modules/auth/e2e/oauth-*-instance.spec.ts` |
| `controllers/oauth/super-admin/*` | merged into `modules/auth/e2e/oauth-*-instance.spec.ts` |
| `controllers/onboarding/form-auth.e2e-spec.ts` | `modules/onboarding/e2e/form-auth.spec.ts` |
| `controllers/tooljetdb_roles.e2e-spec.ts` | `modules/tooljet-db/e2e/tooljetdb-roles.spec.ts` |
| `controllers/workflow-*.e2e-spec.ts` | `modules/workflows/e2e/workflow-*.spec.ts` |
| `services/users.service.spec.ts` | `modules/users/unit/users.service.spec.ts` |
| `modules/data-queries/util.service.spec.ts` | `modules/data-queries/unit/util.service.spec.ts` |

## Import Path Updates

Moving from `test/controllers/<name>.e2e-spec.ts` to `test/modules/<name>/e2e/<name>.spec.ts` adds one level of nesting. Helper imports change from `../test.helper` to `../../../test.helper`.

For merged files (personal-ws-disabled, super-admin), the merged describe blocks share the file's imports.

## Migration Strategy

1. Create `test/modules/` directory tree (all `e2e/` and `unit/` subdirs)
2. Move files with `git mv` (preserves history)
3. Rename `.e2e-spec.ts` → `.spec.ts` (path determines kind now)
4. Merge personal-ws-disabled and super-admin files as describe blocks
5. Update import paths (`../test.helper` → `../../../test.helper`)
6. Update jest configs (testRegex for new paths)
7. Add explicit `{ edition, plan }` to every `initTestApp` call
8. Verify all tests pass
9. Delete empty `test/controllers/` and `test/services/` directories (for moved files)

## Verification

1. All 527+ tests pass
2. `find test/controllers -name "*.ts"` returns nothing
3. Every `initTestApp` call specifies `edition` and `plan`
4. `test/modules/` structure mirrors `src/modules/`
5. No `.e2e-spec.ts` files remain — all renamed to `.spec.ts`
6. `e2e/` and `unit/` subdirs separate test kinds cleanly
