# Test Suite Triage Report

Generated: 2026-03-28 | Branch: fix/test-suite

## Summary

| Type | Suites | Suite Pass | Individual Pass | Individual Fail | Skip |
|------|--------|-----------|----------------|----------------|------|
| Unit `.spec.ts` | 12 | 9 | 196 | 4 | 2 |
| E2E `.e2e-spec.ts` | 42 | 2 | ~73 | ~276 | ~55 |
| **Total** | **54** | **11** | **~269** | **~280** | **~57** |

Progress: Started at 7/58 suites, 174 tests → now 11 suites, ~269 tests passing.

**Phase A (infrastructure): DONE**
**Phase B (assertion fixes): ~60% done** — endpoint paths fixed, permission properties updated, removed features skipped
**Phase C (conventions): DONE** — `ToolBelt/skills/tj-context/references/testing.md`

## Unit Tests (.spec.ts)

### Passing (7)

| File | Tests | Group |
|------|-------|-------|
| `services/python-executor.service.spec.ts` | 29 | @workflows |
| `services/python-bundle-generation.service.spec.ts` | 32 | @workflows |
| `services/python-sandbox-security.spec.ts` | 52 | @security |
| `services/javascript-bundle-generation.service.spec.ts` | 28 | @workflows |
| `services/npm-registry.service.spec.ts` | 14 | @workflows |
| `services/pypi-registry.service.spec.ts` | 20 | @workflows |
| `modules/data-queries/util.service.spec.ts` | 19 | @unit |

### Failing — Stale API (tests describe methods that no longer exist)

| File | Issue | Action |
|------|-------|--------|
| `services/session.service.spec.ts` | `createSession()`, `validateUserSession()` don't exist | Delete or rewrite |
| `services/encryption.service.spec.ts` | `encrypt()`, `decrypt()`, `computeAttributeKey()` don't exist | Delete or rewrite |
| `services/folder_apps.service.spec.ts` | `FoldersService.create()` doesn't exist | Delete or rewrite |
| `services/data_queries.service.spec.ts` | Stale module paths + missing methods | Delete or rewrite |

### Failing — Old Permission System + Stale Imports

| File | Issue | Action |
|------|-------|--------|
| `services/users.service.spec.ts` | Old GroupPermission entities + stale service path | Rewrite for new permissions |
| `services/group_permissions.service.spec.ts` | Entire old permission service | Delete (replaced by new system) |
| `services/app_import_export.service.spec.ts` | Stale import + old permission entities | Fix imports + migrate permissions |
| `services/tooljet_db_import_export_service.spec.ts` | Old permissions + deprecated TypeORM | Rewrite |
| `services/tooljet_db_operations.service.spec.ts` | Stale imports + deprecated TypeORM | Rewrite |

## E2E Tests (.e2e-spec.ts)

### Passing (2)

| File | Tests | Group |
|------|-------|-------|
| `controllers/audit_logs.e2e-spec.ts` | 1 | @e2e |
| `controllers/tooljetdb_roles.e2e-spec.ts` | 1 | @database |

### Skipped (3) — onboarding tests

| File | Tests | Reason |
|------|-------|--------|
| `controllers/onboarding/form-auth.e2e-spec.ts` | 26 | Skipped by Jest |
| `controllers/onboarding/git-sso-auth.e2e-spec.ts` | 21 | Skipped by Jest |
| `controllers/onboarding/google-sso-auth.e2e-spec.ts` | 21 | Skipped by Jest |

### Failing (37) — dominant blocker: old permission system

Most e2e tests fail because they reference old permission entities (`GroupPermission`, `AppGroupPermission`, `UserGroupPermission`) that map to tables that no longer exist. The new system uses `GroupPermissions` → `permission_groups` table + `GroupUsers` → `group_users` table.

Secondary issues:
- `authenticateUser()` returns 401/404 in some tests
- `version_status_enum: "RELEASED"` missing for workflow tests
- Some tests use `getManager()`/`getConnection()` directly

## Root Causes (all fixed in Phase A)

- [x] MariaDB ESM mock (`test/__mocks__/mariadb.ts`)
- [x] AppModule.register() dynamic module bootstrap
- [x] Repository token migration to DataSource.getRepository()
- [x] clearDB() modernization
- [x] Permission group seeding in createUser()
- [x] Stale @services/* imports
- [x] testRegex overlap (unit picking up e2e files)
- [x] .env.test creation in tj.sh
- [x] CI config (Node 22, lts-3.16 trigger)
