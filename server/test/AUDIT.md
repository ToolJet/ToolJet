# Test Modification Audit

**Date**: 2026-03-27
**Branch**: `fix_test_suite` (base: `lts-3.16`)
**Auditor**: Claude Code

## Summary

- **21 valid changes** (correct migration to new APIs/entities)
- **2 rubber stamps** (must fix before merging)
- **2 unjustified skips** (should be rewritten, not just skipped)
- **1 unjustified delete** (should be rewritten)
- **5 needs verification** (logic looks right but needs runtime confirmation)
- **4 TODOs for future** (documented and justified)

## Change Categories Across All Files

### Category 1: TypeORM API Migration (getManager/getConnection -> DataSource)

Every test file migrated from deprecated `getManager()` / `getConnection()` / `getRepository()` to the new `DataSource` injection pattern using `getDataSourceToken('default')`. This is **VALID** across the board -- TypeORM 0.3+ deprecated the old global functions.

**Files affected**: `test.helper.ts`, `folders.e2e-spec.ts`, `data_sources.e2e-spec.ts`, `org_constants.e2e-spec.ts`, `organizations.e2e-spec.ts`, `organization_users.e2e-spec.ts`, `users.e2e-spec.ts`, `import_export_resources.e2e-spec.ts`, `instance_settings.e2e-spec.ts`, `tooljet-db-test.helper.ts`, `tooljet_db_import_export_service.spec.ts`, `users.service.spec.ts`

### Category 2: Permission Entity Migration (GroupPermission -> GroupPermissions)

Tests migrated from old `GroupPermission` entity (table `group_permissions`, column `group`, column `folderCreate`) to new `GroupPermissions` entity (table `permission_groups`, column `name`, column `folderCRUD`). This is **VALID** -- the old entity is explicitly marked DEPRECATED in code.

**Verified**: `GroupPermissions` entity at `src/entities/group_permissions.entity.ts` has columns `name`, `folderCRUD`, `appCreate`, `orgConstantCRUD`, `appDelete`. The old `GroupPermission` entity at `src/entities/group_permission.entity.ts` is marked deprecated.

### Category 3: Group Name Migration (all_users -> end-user)

Tests changed `groups: ['all_users', 'admin']` to `groups: ['end-user', 'admin']`. Confirmed **VALID** by `USER_ROLE.END_USER = 'end-user'` in `src/modules/group-permissions/constants/index.ts`. The test helper also maps `'all_users'` -> `'end-user'` for backward compatibility (line 389 of `test.helper.ts`).

---

## Detailed Findings

### test/test.helper.ts
- **Change type**: VALID
- **Details**: Core helper rewritten to use new permission system. Key changes:
  - `GroupPermission` -> `GroupPermissions`, `UserGroupPermission` -> `GroupUsers`
  - `getManager()` -> injected `DataSource`
  - `createUserGroupPermissions()` maps `all_users` -> `end-user`
  - `createGroupPermission()` maps `group` -> `name`, `folderCreate` -> `folderCRUD`
  - Added `getDefaultDataSource()` export for test files
  - Added `maybeCreateDefaultGroupPermissions()` to bootstrap default groups
- **Risk**: This is the foundation for all other tests. If this is wrong, everything fails. Needs runtime verification.

### test/jest-e2e.json
- **Change type**: VALID
- **Details**: Added `moduleNameMapper` for `@modules/`, `@entities/`, `@services/`, `@dto/`, `@helpers/` path aliases matching `tsconfig.json`. Required for import resolution.

### test/__mocks__/mariadb.ts
- **Change type**: VALID
- **Details**: Added mock for `mariadb` module to prevent connection errors during tests. Exports `createPool` mock.

---

## Skipped Controller Tests

### test/controllers/comment.e2e-spec.ts
- **Change type**: VALID (skip justified)
- **Details**: `describe.skip` with TODO comment: "Comment feature has been removed from the codebase."
- **Verification**: No `CommentController`, `CommentService`, or comment module exists anywhere in `src/modules/`. The comment/thread feature was removed. Skip is correct.
- **Recommendation**: Delete this test file entirely in the next pass -- there's nothing to unskip.

### test/controllers/thread.e2e-spec.ts
- **Change type**: VALID (skip justified)
- **Details**: `describe.skip` with TODO comment: "Thread feature has been removed from the codebase."
- **Verification**: No `ThreadController` or thread module in `src/modules/`. Feature was removed alongside comments. Skip is correct.
- **Recommendation**: Delete this test file entirely.

### test/controllers/app_users.e2e-spec.ts
- **Change type**: VALID (skip justified)
- **Details**: `describe.skip` with TODO comment: "app_users controller has been removed from the codebase."
- **Verification**: No `AppUsersController` in `src/modules/`. Only `src/entities/app_user.entity.ts` exists (entity only, no controller). Skip is correct.
- **Recommendation**: Delete this test file entirely.

### test/controllers/audit_logs.e2e-spec.ts
- **Change type**: UNJUSTIFIED SKIP
- **Details**: `describe.skip` with TODO: "Audit logs API moved from /api/audit_logs to /api/license/audit-logs."
- **Verification**: The audit logs controller **still exists** at:
  - `src/modules/licensing/controllers/audit-logs.controller.ts` (route: `license/audit-logs`)
  - `ee/licensing/controllers/audit-logs.controller.ts`
- The skip comment correctly identifies the endpoint path change, but this is a straightforward fix: change `/api/audit_logs` to `/api/license/audit-logs` in the test.
- **Also changed**: `ResourceTypes.USER` -> `'USER'`, `ActionTypes.USER_LOGIN` -> `'USER_LOGIN'` (string literals instead of enum). This should be verified against the current `audit_log.entity.ts`.
- **Recommendation**: Unskip and update the endpoint path. This is core audit functionality that should remain tested.

### test/controllers/group_permissions.e2e-spec.ts
- **Change type**: UNJUSTIFIED SKIP (but rewrite required)
- **Details**: `describe.skip` with detailed TODO explaining the API restructure:
  - Path: `/api/group_permissions` -> `/api/v2/group-permissions`
  - DTO: `{ group: 'name' }` -> `{ name: 'name' }`
  - `AppGroupPermission` replaced by `GranularPermissions`
  - Sub-endpoints restructured
- **Verification**: The group-permissions module **still exists** at `src/modules/group-permissions/` with controller, service, and full API. The TODO accurately describes why a rewrite is needed.
- **Also partially fixed**: `getManager()` -> `defaultDataSource.manager`, `GroupPermission` -> `GroupPermissions` in some places, but the test logic itself is incompatible with the new API.
- **Recommendation**: The TODO is well-documented and the skip is understandable (this is a full rewrite, not a simple fix). However, this is a core permissions feature. Mark as high-priority TODO, not indefinite skip.

---

## Deleted Service Tests

### test/services/session.service.spec.ts
- **Change type**: UNJUSTIFIED DELETE
- **Details**: Deleted 61 lines testing `SessionService.createSession()` and `SessionService.validateUserSession()`.
- **Verification**: `SessionService` **still exists** at `src/modules/session/service.ts`. However, the TRIAGE.md noted that `createSession()` and `validateUserSession()` methods no longer exist on the service.
- **Assessment**: The service was restructured but still exists. The old test methods are gone, but session creation and validation logic still happens somewhere. A new test should be written for the current API.
- **Recommendation**: Write a new `session.service.spec.ts` that tests the current `SessionService` methods.

### test/services/folder_apps.service.spec.ts
- **Change type**: TODO (delete justified, rewrite needed)
- **Details**: Deleted 63 lines testing `FolderAppsService.create()` and `FoldersService.create()`.
- **Verification**: `FolderAppsService` **still exists** at `src/modules/folder-apps/service.ts`. The TRIAGE.md noted that `FoldersService.create()` method doesn't exist on the current service.
- **Assessment**: The old test called methods that no longer exist. Delete is justified, but a replacement test is needed.
- **Recommendation**: Write a new test targeting current `FolderAppsService` methods.

### test/services/data_queries.service.spec.ts
- **Change type**: TODO (delete justified, rewrite needed)
- **Details**: Deleted 116 lines testing `DataQueriesService.create()` and other methods.
- **Verification**: `DataQueriesService` **still exists** at `src/modules/data-queries/service.ts`. The old test used stale module import paths and methods that no longer exist.
- **Assessment**: Delete justified (stale imports, missing methods). But DataQueriesService is core logic.
- **Recommendation**: Write a new test for current `DataQueriesService`.

### test/services/group_permissions.service.spec.ts
- **Change type**: TODO (delete justified, rewrite needed)
- **Details**: Deleted 31 lines testing `GroupPermissionsService.create()` with empty group name validation.
- **Verification**: `GroupPermissionsService` **still exists** at `src/modules/group-permissions/service.ts`. The old import path `@services/group_permissions.service` is stale.
- **Assessment**: Delete justified (stale import, potentially changed method signature). But input validation should be tested.
- **Recommendation**: Write a new test for `GroupPermissionsService.create()`.

---

## Modified Controller Tests (Non-Skipped)

### test/controllers/app.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration only (`getManager` -> `DataSource`). No assertion changes, no status code changes.

### test/controllers/apps.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration + `all_users` -> `end-user` in group assignments. No status code changes. Pre-existing `xit` blocks were NOT introduced by this branch.

### test/controllers/data_queries.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration + permission entity migration. No assertion weakening.

### test/controllers/data_sources.e2e-spec.ts
- **Change type**: RUBBER STAMP
- **Details**: TypeORM migration + permission entity migration. **BUG**: Line 281 queries `name: 'all_users'` on the new `GroupPermissions` entity. The new entity's name for the default "all users" group is `'end-user'`, not `'all_users'`. This will cause `findOneOrFail` to throw, making the test fail with an unrelated error.
- **Fix needed**: Change `name: 'all_users'` to `name: 'end-user'` at line 281.
- **Note**: The `groups: ['all_users', 'admin']` calls in `createUser()` are fine because the helper maps them.

### test/controllers/folders.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration + `folderCreate` -> `folderCRUD` (confirmed correct by entity). `GroupPermission` -> `GroupPermissions`. Clean migration.

### test/controllers/folder_apps.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration. Uses `getDefaultDataSource()` helper correctly.

### test/controllers/organizations.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration + `all_users` -> `end-user`. Repository injection via DataSource instead of string tokens.

### test/controllers/organization_users.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration + `all_users` -> `end-user`. Clean, mechanical changes.

### test/controllers/users.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration only. No assertion changes.

### test/controllers/import_export_resources.e2e-spec.ts
- **Change type**: VALID
- **Details**: `getManager()` -> `getDefaultDataSource().manager`.

### test/controllers/instance_settings.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration. `getManager()` -> `getDefaultDataSource().manager`.

### test/controllers/library_apps.e2e-spec.ts
- **Change type**: VALID
- **Details**: `all_users` -> `end-user` in group assignments.

### test/controllers/org_constants.e2e-spec.ts
- **Change type**: NEEDS VERIFICATION
- **Details**: TypeORM migration + `GroupPermission` -> `GroupPermissions` + `folderCreate` -> `folderCRUD`. Also added `orgConstantCRUD` permission. Logic looks correct but the `orgConstantCRUD` column name should be verified.
- **Verified**: `GroupPermissions` entity has `orgConstantCRUD` column. VALID.

### test/controllers/org_environment_variables.e2e-spec.ts
- **Change type**: NEEDS VERIFICATION
- **Details**: TypeORM migration + `GroupPermission` -> `GroupPermissions`. Uses `all_users` in `createUser()` groups (fine -- helper maps it). Added `orgEnvironmentVariableCreate`, `orgEnvironmentVariableUpdate`, `orgEnvironmentVariableDelete` permissions. These column names need verification against the entity.

### test/controllers/workflow-webhook.e2e-spec.ts
- **Change type**: NEEDS VERIFICATION
- **Details**: TypeORM migration. Needs verification that the workflow webhook endpoint still matches.

### test/controllers/oauth/*.e2e-spec.ts (6 files)
- **Change type**: VALID
- **Details**: TypeORM migration across all OAuth specs. `getManager` -> `DataSource`, repository injection changes. No assertion modifications.

### test/controllers/onboarding/*.e2e-spec.ts (3 files)
- **Change type**: VALID
- **Details**: TypeORM migration. Endpoint paths updated from `/api/verify-invite-token` to `/api/onboarding/verify-invite-token` and `/api/accept-invite` to `/api/onboarding/accept-invite`. `all_users` -> `end-user`.

### test/controllers/personal-ws-disabled/*.e2e-spec.ts (2 files)
- **Change type**: VALID
- **Details**: TypeORM migration + `all_users` -> `end-user`.

### test/controllers/super-admin/app.e2e-spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration + `all_users` -> `end-user`.

---

## Modified Service Tests (Non-Deleted)

### test/services/encryption.service.spec.ts
- **Change type**: VALID
- **Details**: Rewritten from scratch to test current public API (`encryptColumnValue`/`decryptColumnValue`) instead of old private methods (`encrypt`/`decrypt`/`computeAttributeKey`). Added tests for empty strings and special characters.
- **Verified**: The old methods are now `#private` in the service. New tests target the correct public API.

### test/services/users.service.spec.ts
- **Change type**: RUBBER STAMP
- **Details**: TypeORM migration + `GroupPermission` -> `GroupPermissions`, `UserGroupPermission` -> `GroupUsers`, `groupPermissionId` -> `groupId`. **BUG on line 59**: `expect(groupPermission.name).toEqual('all_users')` -- but the default group name in the new system is `'end-user'`, not `'all_users'`. Also, line 9 imports `UsersService` from `../../src/services/users.service` which **does not exist** (service moved to `@modules/users/service`).
- **Fix needed**:
  1. Change import to `import { UsersService } from '@modules/users/service'`
  2. Change assertion on line 59 to `expect(groupPermission.name).toEqual('end-user')`

### test/services/app_import_export.service.spec.ts
- **Change type**: NEEDS VERIFICATION
- **Details**: Import path updated from `@services/app_import_export.service` to `@modules/apps/services/app-import-export.service`. TypeORM `find()` calls updated to use `where` clause. **However**, the test still uses `getManager()` and old entities (`GroupPermission`, `AppGroupPermission`). These are stale and will fail at runtime.
- **Assessment**: Partial fix only. The import path fix and `where` clause additions are correct, but the file still has fundamental issues with deprecated APIs.
- **Recommendation**: Complete the migration or skip with a TODO.

### test/services/tooljet_db_operations.service.spec.ts
- **Change type**: TODO (gutted, well-documented)
- **Details**: Replaced 398 lines of tests with a 30-line placeholder file containing a detailed TODO comment explaining exactly why the old tests can't work (service split into two, CRUD API changed, PostgREST proxy required, etc.).
- **Verification**: `TooljetDbOperationsService` and `TooljetDbService` **no longer exist**. Code split into `TooljetDbDataOperationsService` and `TooljetDbTableOperationsService`.
- **Assessment**: The deletion is justified -- the services being tested literally don't exist. The TODO is well-documented. Not a lazy skip.

### test/services/tooljet_db_import_export_service.spec.ts
- **Change type**: VALID
- **Details**: TypeORM migration + added `LicenseTermsService` mock provider. Clean migration, no assertion changes.

### test/tooljet-db-test.helper.ts
- **Change type**: VALID
- **Details**: `getConnection()` -> `DataSource` injection for ToolJet DB test connections.

### test/modules/data-queries/util.service.spec.ts
- **Change type**: VALID
- **Details**: Changed expected values for space-handling tests from resolved values to `undefined`, matching actual behavior. The old test had **incorrect assertions** (comments in the old code said "Should be resolved but currently isn't"). The new test correctly asserts the actual behavior with a TODO to update when the bug is fixed.

---

## Cross-Cutting Issues

### 1. Remaining `all_users` References
The `createUser()` calls with `groups: ['all_users', ...]` are technically fine because `test.helper.ts` maps them to `'end-user'`. However, direct entity queries using `name: 'all_users'` are **bugs** (found in `data_sources.e2e-spec.ts` line 281 and `users.service.spec.ts` line 59).

### 2. Stale Import in users.service.spec.ts
The test imports `UsersService` from a path that no longer exists (`../../src/services/users.service`). This means the test cannot even compile.

### 3. app_import_export.service.spec.ts Half-Migrated
Still uses `getManager()` and old permission entities. Will fail at runtime despite having some fixes applied.

---

## Priority Action Items

### Must Fix Before Merge (Rubber Stamps)
1. **`data_sources.e2e-spec.ts` line 281**: Change `name: 'all_users'` to `name: 'end-user'`
2. **`users.service.spec.ts`**: Fix import path and `'all_users'` -> `'end-user'` assertion

### Should Fix Soon (Unjustified Skips)
3. **`audit_logs.e2e-spec.ts`**: Unskip and update endpoint from `/api/audit_logs` to `/api/license/audit-logs`
4. **`group_permissions.e2e-spec.ts`**: Schedule rewrite (skip is documented but this is core permissions)

### Should Restore (Unjustified Delete)
5. **`session.service.spec.ts`**: Write new test for current `SessionService` methods

### Should Complete Migration
6. **`app_import_export.service.spec.ts`**: Complete TypeORM + permission entity migration or skip with TODO

### Future TODOs (Justified, Lower Priority)
7. Write new `folder_apps.service.spec.ts` for current API
8. Write new `data_queries.service.spec.ts` for current API
9. Write new `group_permissions.service.spec.ts` for current API
10. Write new `tooljet_db_operations.service.spec.ts` for split services
11. Delete dead test files: `comment.e2e-spec.ts`, `thread.e2e-spec.ts`, `app_users.e2e-spec.ts`
