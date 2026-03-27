# Test Suite Triage Report

Generated: 2026-03-27 | Branch: fix/test-suite

## Summary

| Type | Total | Pass | Fail | Skip |
|------|-------|------|------|------|
| Unit `.spec.ts` | 16 | 7 | 9 | 0 |
| E2E `.e2e-spec.ts` | 42 | TBD | TBD | TBD |

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

### Known Blockers

1. **Old permission system** — ~20 files directly query `GroupPermission`, `AppGroupPermission`, `UserGroupPermission` entities (old `group_permissions` table doesn't exist)
2. **Auth flow** — `authenticateUser()` gets 401/404 in some tests (response format may have changed)
3. **Workflow e2e** — `version_status_enum: "RELEASED"` missing (migration gap)

### E2E triage pending full suite run completion.

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
