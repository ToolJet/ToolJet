# Removed Backward-Compat Aliases: Old -> New Name Mapping

The following old names were removed from test helpers. Test files that import these names must be updated to use the new canonical names.

## bootstrap.ts

| Old Name | New Name | Notes |
|---|---|---|
| `createNestAppInstance()` | `initTestApp()` | Returns `{ app }` — destructure to get `app` |
| `createNestAppInstanceWithEnvMock()` | `initTestApp({ mockConfig: true })` | Returns `{ app, mockConfig }` — destructure |
| `createNestAppInstanceWithServiceMocks({ shouldMockLicenseService })` | `initTestApp({ mockLicenseService })` | Returns `{ app, licenseServiceMock }` |

## cleanup.ts

| Old Name | New Name |
|---|---|
| `clearDB()` | `resetDB()` |

## seed.ts

| Old Name | New Name |
|---|---|
| `createAppEnvironments(nestApp, orgId)` | `ensureAppEnvironments(nestApp, orgId)` |
| `seedInstanceSSOConfigs(options?)` | `ensureInstanceSSOConfigs(options?)` |
| `createAppGroupPermission(nestApp, app, groupId, perms)` | `grantAppPermission(nestApp, app, groupId, perms)` |
| `generateAppDefaults(app, user, opts)` | `createAppWithDependencies(app, user, opts)` |
| `getAppWithAllDetails(id)` | `findAppWithRelations(id)` |
| `releaseAppVersion(appId, versionId)` | `markVersionAsReleased(appId, versionId)` |
| `addAllUsersGroupToUser` | (removed, was private alias for `addEndUserGroupToUser`) |

## api.ts

| Old Name | New Name |
|---|---|
| `authHeaderForUser(user, orgId?, isPasswordLogin?)` | `buildAuthHeader(user, orgId?, isPasswordLogin?)` |
| `loginAs(app, email, password, orgId)` | `authenticateUser(app, email, password, orgId)` |
| `logout(app, tokenCookie, orgId)` | `logoutUser(app, tokenCookie, orgId)` |
| `createTestSession(user, orgId?)` | `buildTestSession(user, orgId?)` |

## Usage in test files (files that need updating)

### `clearDB` -> `resetDB`
- test/services/users.service.spec.ts
- test/services/tooljet_db_import_export_service.spec.ts
- test/services/app_import_export.service.spec.ts
- test/controllers/library_apps.e2e-spec.ts
- test/controllers/files.e2e-spec.ts
- test/controllers/users.e2e-spec.ts
- test/controllers/apps.e2e-spec.ts
- test/controllers/folders.e2e-spec.ts
- test/controllers/session.e2e-spec.ts
- test/controllers/organizations.e2e-spec.ts
- test/controllers/app.e2e-spec.ts
- test/controllers/data_sources.e2e-spec.ts
- test/controllers/data_queries.e2e-spec.ts
- test/controllers/folder_apps.e2e-spec.ts
- test/controllers/org_constants.e2e-spec.ts
- test/controllers/instance_settings.e2e-spec.ts
- test/controllers/organization_users.e2e-spec.ts
- test/controllers/group_permissions.e2e-spec.ts
- test/controllers/workflow-webhook.e2e-spec.ts
- test/controllers/onboarding/form-auth.e2e-spec.ts
- test/controllers/oauth/oauth-git.e2e-spec.ts
- test/controllers/oauth/oauth-google.e2e-spec.ts
- test/controllers/oauth/oauth-saml.e2e-spec.ts
- test/controllers/oauth/super-admin/oauth-git-instance.e2e-spec.ts
- test/controllers/oauth/super-admin/oauth-google-instance.e2e-spec.ts
- test/controllers/oauth/personal-ws-disabled/oauth-git-instance.e2e-spec.ts
- test/controllers/oauth/personal-ws-disabled/oauth-google-instance.e2e-spec.ts
- test/controllers/personal-ws-disabled/organizations.e2e-spec.ts
- test/controllers/personal-ws-disabled/app.e2e-spec.ts
- test/controllers/super-admin/app.e2e-spec.ts

### `createNestAppInstance` -> `initTestApp` (destructure `{ app }`)
- test/services/users.service.spec.ts
- test/controllers/library_apps.e2e-spec.ts
- test/controllers/files.e2e-spec.ts
- test/controllers/users.e2e-spec.ts
- test/controllers/apps.e2e-spec.ts
- test/controllers/folders.e2e-spec.ts
- test/controllers/session.e2e-spec.ts
- test/controllers/folder_apps.e2e-spec.ts
- test/controllers/data_sources.e2e-spec.ts
- test/controllers/org_constants.e2e-spec.ts
- test/controllers/instance_settings.e2e-spec.ts
- test/controllers/workflow-webhook.e2e-spec.ts

### `createNestAppInstanceWithEnvMock` -> `initTestApp({ mockConfig: true })` (destructure)
- test/controllers/app.e2e-spec.ts
- test/controllers/organizations.e2e-spec.ts
- test/controllers/onboarding/form-auth.e2e-spec.ts
- test/controllers/oauth/oauth-git.e2e-spec.ts
- test/controllers/oauth/oauth-google.e2e-spec.ts
- test/controllers/oauth/oauth-saml.e2e-spec.ts
- test/controllers/oauth/super-admin/oauth-git-instance.e2e-spec.ts
- test/controllers/oauth/super-admin/oauth-google-instance.e2e-spec.ts
- test/controllers/oauth/personal-ws-disabled/oauth-git-instance.e2e-spec.ts
- test/controllers/oauth/personal-ws-disabled/oauth-google-instance.e2e-spec.ts
- test/controllers/personal-ws-disabled/app.e2e-spec.ts
- test/controllers/super-admin/app.e2e-spec.ts

### `createNestAppInstanceWithServiceMocks` -> `initTestApp({ mockLicenseService: true })`
- test/controllers/workflow-webhook.e2e-spec.ts

### `generateAppDefaults` -> `createAppWithDependencies`
- test/services/app_import_export.service.spec.ts
- test/controllers/apps.e2e-spec.ts
- test/controllers/data_sources.e2e-spec.ts

### `createAppEnvironments` -> `ensureAppEnvironments`
- test/services/app_import_export.service.spec.ts
- test/controllers/apps.e2e-spec.ts
- test/controllers/data_sources.e2e-spec.ts
- test/controllers/org_constants.e2e-spec.ts

### `getAppWithAllDetails` -> `findAppWithRelations`
- test/services/app_import_export.service.spec.ts

### `createAppGroupPermission` -> `grantAppPermission`
- test/controllers/apps.e2e-spec.ts
- test/controllers/folders.e2e-spec.ts

### `seedInstanceSSOConfigs` -> `ensureInstanceSSOConfigs`
- test/controllers/oauth/super-admin/oauth-git-instance.e2e-spec.ts
- test/controllers/oauth/super-admin/oauth-google-instance.e2e-spec.ts
- test/controllers/oauth/personal-ws-disabled/oauth-git-instance.e2e-spec.ts
- test/controllers/oauth/personal-ws-disabled/oauth-google-instance.e2e-spec.ts

### `authHeaderForUser` -> `buildAuthHeader`
- test/controllers/super-admin/app.e2e-spec.ts

### `createTestSession` -> `buildTestSession`
- test/controllers/organization_users.e2e-spec.ts

### `releaseAppVersion` -> `markVersionAsReleased`
- test/controllers/workflow-webhook.e2e-spec.ts

### `loginAs` (from barrel)
- NOT imported from barrel by any test file (group_permissions.e2e-spec.ts defines its own local `loginAs`)

### `logout` (from barrel)
- NOT imported from barrel by any test file
