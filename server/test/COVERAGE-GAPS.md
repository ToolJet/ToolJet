# Coverage Gap Analysis — Deleted Tests vs Current Codebase

**Date**: 2026-03-30
**Branch**: `fix/test-suite`

## Summary

| Verdict | Count | Items |
|---------|-------|-------|
| **GAP** (feature exists, no test) | 7 | #1, #2, #5, #6, #7, #8, #18 |
| **PARTIAL** (some coverage, not for deleted behavior) | 5 | #3, #12, #15, #16, #17 |
| **COVERED** (feature gone OR already tested) | 6 | #4, #9, #10, #11, #13, #14 |

---

## Deleted E2E Files

### 1. audit_logs.e2e-spec.ts — **GAP**
- **Feature exists**: YES
  - `ee/audit-logs/controller.ts` — `@Controller('audit-logs')` with `GET /` and `GET /resources`
  - `src/modules/licensing/controllers/audit-logs.controller.ts`
  - `ee/audit-logs/service.ts`, `ee/audit-logs/util.service.ts`
- **Current test coverage**: NONE
- **Action**: Write `test/modules/audit-logs/e2e/audit-logs.spec.ts` targeting `/api/audit-logs` and `/api/license/audit-logs`

### 2. import_export_resources.e2e-spec.ts — **GAP**
- **Feature exists**: YES
  - `src/modules/import-export-resources/controller.ts` — `POST /export`, `POST /import`, `POST /clone`
  - `ee/import-export-resources/controller.ts`
- **Current test coverage**: Only unit tests for `app-import-export.service` and `tooljet-db-import-export.service` — no e2e test for the controller endpoints
- **Action**: Write `test/modules/import-export-resources/e2e/import-export-resources.spec.ts`

### 3. tooljet_db.e2e-spec.ts — **PARTIAL**
- **Feature exists**: YES — 5 services (table-ops, data-ops, bulk-upload, postgrest-proxy, import-export)
  - `src/modules/tooljet-db/controller.ts`, `ee/tooljet-db/controller.ts`
- **Current test coverage**: `tooljetdb-roles.spec.ts` (roles only), `tooljet_db_operations.service.spec.ts` (placeholder with TODO), `tooljet_db_import_export_service.spec.ts` (unit)
- **Gap**: CRUD operations (create table, insert rows, update, delete, join) have no e2e test
- **Action**: Write `test/modules/tooljet-db/e2e/tooljetdb-operations.spec.ts` for table + data CRUD

### 4. org_environment_variables.e2e-spec.ts — **COVERED**
- **Feature renamed**: `org-environment-variables` → `organization-constants`
- **Current test coverage**: `test/modules/org-constants/e2e/org-constants.spec.ts` — already covers this module
- **Action**: None

### 5. oauth-ldap.e2e-spec.ts — **GAP**
- **Feature exists**: YES
  - `src/modules/auth/oauth/util-services/ldap.service.ts`
  - `ee/auth/oauth/util-services/ldap.service.ts`
- **Current test coverage**: OAuth tests exist for git, google, saml — but NO LDAP test
- **Action**: Write `test/modules/auth/e2e/oauth-ldap.spec.ts`

### 6. git-sso-auth.e2e-spec.ts — **GAP**
- **Feature exists**: YES — onboarding module has SSO flows
  - `src/modules/onboarding/controller.ts`, `ee/onboarding/controller.ts`
  - `ee/onboarding/service.ts`
- **Current test coverage**: Only `form-auth.spec.ts` (password-based onboarding) — no SSO onboarding test
- **Action**: Write `test/modules/onboarding/e2e/git-sso-auth.spec.ts`

### 7. google-sso-auth.e2e-spec.ts — **GAP**
- Same as #6 but for Google SSO
- **Action**: Write `test/modules/onboarding/e2e/google-sso-auth.spec.ts`

### 8. custom_domains.e2e-spec.ts — **GAP**
- **Feature exists**: YES
  - `src/modules/custom-domains/controller.ts`, `ee/custom-domains/controller.ts`
  - `src/modules/custom-domains/service.ts`, `cache.service.ts`
- **Current test coverage**: NONE
- **Action**: Write `test/modules/custom-domains/e2e/custom-domains.spec.ts`

### 9. comment.e2e-spec.ts — **COVERED**
- **Feature removed**: No `CommentController`, no comment module in `src/modules/` or `ee/`
- **Action**: None — correctly deleted

### 10. thread.e2e-spec.ts — **COVERED**
- **Feature removed**: No `ThreadController`, no thread module anywhere
- **Action**: None — correctly deleted

### 11. app_users.e2e-spec.ts — **COVERED**
- **Feature removed**: No `AppUsersController` in `src/modules/` or `ee/`
- **Action**: None — correctly deleted

---

## Deleted Unit Tests

### 12. session.service.spec.ts — **PARTIAL**
- **Service exists**: YES — `src/modules/session/service.ts` with methods:
  - `terminateSession()`, `getSessionDetails()`, `validateInvitedUserSession()`
  - Also: `oidc-refresh.service.ts`, `util.service.ts`
- **Current test coverage**: `session.spec.ts` e2e tests HTTP endpoints — no unit test for service logic
- **Gap**: Service methods like `terminateSession`, `getSessionDetails` not unit-tested
- **Action**: Write `test/modules/session/unit/session.service.spec.ts`

### 13. data_queries.service.spec.ts — **COVERED**
- **Service exists**: YES — `src/modules/data-queries/service.ts` with `create()`, `update()`, `delete()`, `getAll()`
- **Current test coverage**: `data-queries.spec.ts` (e2e) + `util.service.spec.ts` (unit) — CRUD is covered via HTTP endpoints
- **Action**: None — e2e coverage is sufficient for the CRUD methods

### 14. folder_apps.service.spec.ts — **COVERED**
- **Service exists**: YES — `src/modules/folder-apps/service.ts` with `create()`, `remove()`, `getFolders()`
- **Current test coverage**: `folder-apps.spec.ts` (e2e) + `folders.spec.ts` (e2e) — HTTP endpoints cover service behavior
- **Action**: None — e2e coverage is sufficient

### 15. group_permissions.service.spec.ts — **PARTIAL**
- **Service exists**: YES — large module with 8 EE services:
  - `service.ts`: `create()`, `updateGroup()`, `deleteGroup()`, `duplicateGroup()`, `addGroupUsers()`, `deleteGroupUser()`
  - `granular-permissions.service.ts`, `duplicate.service.ts`, `license.util.service.ts`
- **Current test coverage**: `group-permissions.spec.ts` e2e tests v2 API — but only basic CRUD
- **Gap**: `duplicateGroup`, granular permissions, license checks not tested
- **Action**: Expand e2e coverage OR write `test/modules/group-permissions/unit/group-permissions.service.spec.ts`

---

## Deleted Blocks in Existing Files

### 16. workflow-webhook.spec.ts — License Expiry Scenarios — **PARTIAL**
- **Feature exists**: UNCLEAR — no `licenseExpiry` or `isExpired` references found in workflow code
- The license check may happen at guard level (`LicenseTermsService`), not in workflow code specifically
- **Current coverage**: 13 tests exist in webhook spec — license expiry is NOT among them
- **Action**: Investigate if license expiry blocks webhook execution; if so, add test

### 17. workflow-webhook.spec.ts — RunJS Node Accessing Webhook Params — **PARTIAL**
- **Feature exists**: YES — `ee/workflows/services/workflow-executions.service.ts:2220` handles `case 'runjs'`
- RunJS queries with NPM package support are active production code
- **Current coverage**: Workflow execution tests exist but this specific input-passing behavior is not tested
- **Action**: Add test case for RunJS node receiving webhook params as input

### 18. workflow-webhook.spec.ts — Rate Limit Exceeding Scenarios (6 tests) — **GAP**
- **Feature exists**: YES
  - `src/modules/workflows/module.ts` imports `ThrottlerModule`
  - `ee/workflows/controllers/workflow-webhooks.controller.ts` uses `ThrottlerGuard`
- **Current coverage**: NONE — no rate limiting test exists
- **Action**: Add rate limiting test cases to `workflow-webhook.spec.ts`

---

## Priority Action Items

### HIGH (feature exists, zero test coverage)
1. **audit-logs** e2e — controller + 2 services, EE feature
2. **import-export-resources** e2e — 3 endpoints (export/import/clone)
3. **workflow webhook rate limiting** — 6 deleted tests, ThrottlerGuard is active

### MEDIUM (feature exists, partial coverage)
4. **tooljet-db operations** e2e — CRUD for tables + data
5. **oauth-ldap** e2e — LDAP auth service exists
6. **onboarding SSO** e2e — git + google SSO flows
7. **group-permissions** — granular permissions, duplicate, license checks
8. **session service** unit — terminateSession, getSessionDetails
9. **workflow RunJS params** — input passing to RunJS nodes

### LOW (EE-only, niche)
10. **custom-domains** e2e — EE feature, controller exists
11. **workflow license expiry** — may be guard-level, needs investigation
