# Autoresearch Plan: ToolJet Test Suite — Zero Skips

## Config

```yaml
goal: "Zero skipped/failing tests. Every test either passes or is deleted."
scope: "server/test/**/*spec.ts"
metric: "skipped_count + failed_count → 0"
verify: "npx jest <file> --forceExit --no-coverage 2>&1 | tail -30"
guard: "npx jest --forceExit --no-coverage 2>&1 | tail -10"
direction: "One file per iteration. Check if feature code exists → fix test or delete test. Add @group working."
iterations: unbounded
workdir: "/Users/akshaysasidharan/code/ToolJet/.worktrees/fix_test_suite"
```

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Files for removed features | **Delete entirely** | Clean slate; EE can recreate if needed |
| group_permissions.e2e-spec.ts | **Delete and create fresh** | v2 API is too different for inline rewrite |
| Iteration strategy | **One file per iteration** | Most surgical; verify each fix before moving on |
| Iteration bound | **Unbounded** | Run until 0 skips + 0 failures |

## Current State

- **40 test files** in `server/test/`
- **43+ explicit skips** across 18 files
- **0 files** have `@group working` → **all excluded from CI**
- **3 files** to delete (feature removed from codebase)
- **1 file** to delete-and-recreate (group_permissions — full API rewrite)

## Per-Iteration Algorithm

```
FOR each test file (ordered by skip count DESC):
  1. READ the test file — list every skip with its TODO reason
  2. FOR each skipped test:
     a. GREP codebase for the endpoint/service/feature being tested
     b. IF feature exists in current code → FIX the test:
        - Update endpoint URL
        - Update request/response shape
        - Update permission assertions
        - Update entity names
     c. IF feature removed from codebase → DELETE the test
  3. REMOVE all xit/describe.skip/it.skip — replace with working it/describe
  4. ADD @group working tag to the file (jsdoc comment before describe)
  5. RUN the file individually — verify ALL tests pass
  6. IF any test still fails → investigate root cause, fix or delete with justification
  7. COMMIT: "fix(tests): rehabilitate <filename> — N fixed, M deleted"
  8. RECORD iteration result in AUTORESEARCH_LOG.md
```

## Iteration Order

### Phase 1: Delete Dead Files (iterations 1-3)

These test files correspond to features that no longer exist in the codebase.

| # | File | Reason | Action |
|---|------|--------|--------|
| 1 | `controllers/org_environment_variables.e2e-spec.ts` | OrgEnvironmentVariable entity removed | DELETE file |
| 2 | `controllers/oauth/oauth-saml.e2e-spec.ts` | CE SamlService throws 'not implemented' | DELETE file |
| 3 | `controllers/oauth/oauth-ldap.e2e-spec.ts` | ldapjs not in dependency tree | DELETE file |

### Phase 2: Fix High-Skip Files (iterations 4-10)

Files with the most skips — fixing these has the highest impact on the metric.

| # | File | Skips | Key Changes Needed |
|---|------|-------|--------------------|
| 4 | `controllers/apps.e2e-spec.ts` | 24+ | Clone→v2/resources/clone, export/import→v2/resources, permission rework, delete thread/comment tests |
| 5 | `controllers/data_sources.e2e-spec.ts` | 12 | Global DS API, ValidateDataSourceGuard, remove app_version_id scoping |
| 6 | `controllers/data_queries.e2e-spec.ts` | 6 | Version-in-URL pattern, new query endpoints |
| 7 | `controllers/group_permissions.e2e-spec.ts` | ~33 | DELETE file, CREATE fresh test for v2 GroupPermissions API |
| 8 | `controllers/session.e2e-spec.ts` | 1 | Fix org creation (POST /api/organizations removed) |
| 9 | `controllers/users.e2e-spec.ts` | 1 | Fix GET /api/users/all → GET /api/users |
| 10 | `controllers/instance_settings.e2e-spec.ts` | ALL | DELETE (CE InstanceSettingsController throws for all CRUD) |

### Phase 3: Fix Onboarding & OAuth (iterations 11-18)

| # | File | Skips | Key Changes Needed |
|---|------|-------|--------------------|
| 11 | `controllers/onboarding/form-auth.e2e-spec.ts` | 1 | Fix signup/invite endpoints |
| 12 | `controllers/onboarding/git-sso-auth.e2e-spec.ts` | 1 | Fix SSO flow |
| 13 | `controllers/onboarding/google-sso-auth.e2e-spec.ts` | 1 | Fix SSO flow |
| 14 | `controllers/oauth/oauth-git.e2e-spec.ts` | 0 | Verify + add @group working |
| 15 | `controllers/oauth/oauth-git-instance.e2e-spec.ts` | 0 | Verify + add @group working |
| 16 | `controllers/oauth/oauth-google.e2e-spec.ts` | 0 | Verify + add @group working |
| 17 | `controllers/oauth/oauth-google-instance.e2e-spec.ts` | 0 | Verify + add @group working |
| 18 | `controllers/tooljet_db.e2e-spec.ts` | 2 | Assess postgrest dep — fix or delete |

### Phase 4: Fix Remaining E2E (iterations 19-30)

Files with 0 explicit skips but no @group working — need verification.

| # | File | Notes |
|---|------|-------|
| 19 | `controllers/app.e2e-spec.ts` | Verify passes, add @group working |
| 20 | `controllers/audit_logs.e2e-spec.ts` | Fix TODO at line 137, add @group working |
| 21 | `controllers/files.e2e-spec.ts` | Verify + tag |
| 22 | `controllers/folder_apps.e2e-spec.ts` | Verify + tag |
| 23 | `controllers/folders.e2e-spec.ts` | Verify + tag |
| 24 | `controllers/import_export_resources.e2e-spec.ts` | Has @group but not `working` — add it |
| 25 | `controllers/library_apps.e2e-spec.ts` | Verify + tag |
| 26 | `controllers/org_constants.e2e-spec.ts` | Verify + tag |
| 27 | `controllers/organization_users.e2e-spec.ts` | Verify + tag |
| 28 | `controllers/organizations.e2e-spec.ts` | Verify + tag |
| 29 | `controllers/personal-ws-disabled/app.e2e-spec.ts` | Verify + tag |
| 30 | `controllers/super-admin/app.e2e-spec.ts` | Verify + tag |

### Phase 5: Fix Unit Tests (iterations 31-38)

| # | File | Notes |
|---|------|-------|
| 31 | `services/users.service.spec.ts` | Rewrite for new permission system |
| 32 | `services/app_import_export.service.spec.ts` | Fix TypeORM + permission migration |
| 33 | `services/tooljet_db_import_export_service.spec.ts` | Fix TypeORM patterns |
| 34 | `services/tooljet_db_operations.service.spec.ts` | Verify + tag |
| 35 | `modules/data-queries/util.service.spec.ts` | Fix template resolution TODO |
| 36 | `services/encryption.service.spec.ts` | Has @group unit — add working, verify |
| 37 | `services/session.service.spec.ts` | Verify + tag |
| 38 | `services/folder_apps.service.spec.ts` | Verify + tag |

### Phase 6: Workflow Tests (iterations 39-43)

| # | File | Notes |
|---|------|-------|
| 39 | `controllers/workflow-bundles.e2e-spec.ts` | Has @group workflows — add working, verify |
| 40 | `controllers/workflow-executions.e2e-spec.ts` | Has @group workflows — add working, verify |
| 41 | `controllers/workflow-webhook.e2e-spec.ts` | Verify + tag |
| 42 | `controllers/tooljetdb_roles.e2e-spec.ts` | Has @group database — add working, verify |
| 43 | Remaining workflow unit tests | python-*, npm-*, pypi-*, javascript-* — add working, verify |

### Phase 7: Final Verification

| # | Task |
|---|------|
| 44 | Run FULL test suite (no group filter) — verify 0 skips, 0 failures |
| 45 | Run with `--group=working` — verify same result (all files tagged) |
| 46 | Update CI config if needed |
| 47 | Final commit + TRIAGE.md update |

## Endpoint Reference (for fixing tests)

| Old Endpoint | New Endpoint |
|-------------|-------------|
| `POST /api/apps/:id/clone` | `POST /api/v2/resources/clone` |
| `GET /api/apps/:id/export` | `POST /api/v2/resources/export` |
| `POST /api/apps/import` | `POST /api/v2/resources/import` |
| `GET /api/users/all` | `GET /api/users` (EE only) |
| `POST /api/organizations` | Removed |
| `POST /api/data-sources` | Now creates global DS (no app_version_id) |
| `PUT /api/data-sources/:id` | Now requires ValidateDataSourceGuard |
| `DELETE /api/data-sources/:id` | Now requires ValidateDataSourceGuard |
| `GET /api/data-sources?app_version_id=` | Removed |
| `PATCH /api/data-queries/:id` | Now requires version in URL |
| `DELETE /api/data-queries/:id` | Now requires version in URL |
| `GET /api/data-queries?app_version_id=` | Removed |

## Permission System Reference

| Old | New |
|-----|-----|
| `GroupPermission` | `GroupPermissions` |
| `AppGroupPermission` | `AppsGroupPermissions` |
| `UserGroupPermission` | `GroupUsers` |
| `all_users` | `end-user` |
| `.group` | `.name` |
| `folderCreate` | `folderCRUD` |
| `orgEnvironmentVariableCreate` | `orgConstantCRUD` |

## Success Criteria

- [ ] 0 `xit(`, `describe.skip(`, `it.skip(`, `test.skip(` in any test file
- [ ] Every surviving test file has `@group working`
- [ ] `npx jest --forceExit` passes with 0 failures
- [ ] `npx jest --group=working --forceExit` produces identical results
- [ ] Dead feature test files deleted (org_env_vars, oauth-saml, oauth-ldap, instance_settings)
- [ ] group_permissions.e2e-spec.ts rewritten for v2 API
- [ ] All commits follow pattern: `fix(tests): rehabilitate <filename>`
