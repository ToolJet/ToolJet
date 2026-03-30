# Test Directory Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `test/controllers/` into `test/modules/<name>/e2e/` mirroring `src/modules/`, with explicit edition/plan in every test.

**Architecture:** Move 30 e2e files into module-based `e2e/` subdirectories. Move 2 unit test files into `unit/` subdirectories. Merge 5 config-variant files (personal-ws-disabled, super-admin) as describe blocks. Update jest configs to match by path. Rename `.e2e-spec.ts` → `.spec.ts`.

**Tech Stack:** Jest, ts-jest, NestJS testing, TypeORM

**Spec:** `docs/superpowers/specs/2026-03-30-test-directory-restructuring-design.md`

---

### Task 1: Create directory tree + update jest configs

**Files:**
- Create: `server/test/modules/apps/e2e/`, `server/test/modules/app/e2e/`, `server/test/modules/session/e2e/`, `server/test/modules/data-sources/e2e/`, `server/test/modules/data-queries/e2e/`, `server/test/modules/data-queries/unit/`, `server/test/modules/organizations/e2e/`, `server/test/modules/organization-users/e2e/`, `server/test/modules/folders/e2e/`, `server/test/modules/folder-apps/e2e/`, `server/test/modules/group-permissions/e2e/`, `server/test/modules/org-constants/e2e/`, `server/test/modules/instance-settings/e2e/`, `server/test/modules/files/e2e/`, `server/test/modules/library-apps/e2e/`, `server/test/modules/users/e2e/`, `server/test/modules/users/unit/`, `server/test/modules/auth/e2e/`, `server/test/modules/onboarding/e2e/`, `server/test/modules/tooljet-db/e2e/`, `server/test/modules/workflows/e2e/`
- Modify: `server/test/jest-e2e.json`
- Modify: `server/jest.config.ts`

- [ ] **Step 1: Create all module directories**

```bash
cd server/test && mkdir -p \
  modules/apps/e2e \
  modules/app/e2e \
  modules/session/e2e \
  modules/data-sources/e2e \
  modules/data-queries/e2e \
  modules/data-queries/unit \
  modules/organizations/e2e \
  modules/organization-users/e2e \
  modules/folders/e2e \
  modules/folder-apps/e2e \
  modules/group-permissions/e2e \
  modules/org-constants/e2e \
  modules/instance-settings/e2e \
  modules/files/e2e \
  modules/library-apps/e2e \
  modules/users/e2e \
  modules/users/unit \
  modules/auth/e2e \
  modules/onboarding/e2e \
  modules/tooljet-db/e2e \
  modules/workflows/e2e
```

- [ ] **Step 2: Update jest-e2e.json testRegex**

In `server/test/jest-e2e.json`, change:
```json
"testRegex": ".e2e-spec.ts$"
```
To:
```json
"testRegex": "test/modules/.*/e2e/.*spec\\.ts$"
```

- [ ] **Step 3: Update jest.config.ts testRegex**

In `server/jest.config.ts`, change:
```typescript
testRegex: '(?<!e2e-)spec\\.ts$',
```
To:
```typescript
testRegex: 'test/(modules/.*/unit|services)/.*spec\\.ts$',
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(tests): create modules/ directory tree, update jest configs"
```

---

### Task 2: Move simple e2e files (no merges needed)

These 18 files move directly — no merging, just `git mv` + rename.

**Files:**
- Move: 18 e2e test files from `test/controllers/` to `test/modules/<name>/e2e/`

- [ ] **Step 1: Move and rename all simple files**

```bash
cd server/test
git mv controllers/apps.e2e-spec.ts modules/apps/e2e/apps.spec.ts
git mv controllers/session.e2e-spec.ts modules/session/e2e/session.spec.ts
git mv controllers/data_sources.e2e-spec.ts modules/data-sources/e2e/data-sources.spec.ts
git mv controllers/data_queries.e2e-spec.ts modules/data-queries/e2e/data-queries.spec.ts
git mv controllers/folders.e2e-spec.ts modules/folders/e2e/folders.spec.ts
git mv controllers/folder_apps.e2e-spec.ts modules/folder-apps/e2e/folder-apps.spec.ts
git mv controllers/group_permissions.e2e-spec.ts modules/group-permissions/e2e/group-permissions.spec.ts
git mv controllers/org_constants.e2e-spec.ts modules/org-constants/e2e/org-constants.spec.ts
git mv controllers/instance_settings.e2e-spec.ts modules/instance-settings/e2e/instance-settings.spec.ts
git mv controllers/files.e2e-spec.ts modules/files/e2e/files.spec.ts
git mv controllers/library_apps.e2e-spec.ts modules/library-apps/e2e/library-apps.spec.ts
git mv controllers/users.e2e-spec.ts modules/users/e2e/users.spec.ts
git mv controllers/organization_users.e2e-spec.ts modules/organization-users/e2e/organization-users.spec.ts
git mv controllers/tooljetdb_roles.e2e-spec.ts modules/tooljet-db/e2e/tooljetdb-roles.spec.ts
git mv controllers/oauth/oauth-git.e2e-spec.ts modules/auth/e2e/oauth-git.spec.ts
git mv controllers/oauth/oauth-google.e2e-spec.ts modules/auth/e2e/oauth-google.spec.ts
git mv controllers/oauth/oauth-saml.e2e-spec.ts modules/auth/e2e/oauth-saml.spec.ts
git mv controllers/onboarding/form-auth.e2e-spec.ts modules/onboarding/e2e/form-auth.spec.ts
```

- [ ] **Step 2: Update import paths in all 18 files**

Each file's `import { ... } from '../test.helper'` must change to `'../../../test.helper'` (two levels deeper now: `modules/<name>/e2e/` vs `controllers/`).

For OAuth files that were in `controllers/oauth/`, the depth stays the same: `'../../test.helper'` → `'../../../test.helper'`.

Use sed or manual edit for each file. The pattern:
```bash
# For files that were in controllers/ (one level)
sed -i '' "s|from '../test.helper'|from '../../../test.helper'|g" modules/*/e2e/*.spec.ts

# For files that were in controllers/oauth/ (two levels)
sed -i '' "s|from '../../test.helper'|from '../../../test.helper'|g" modules/auth/e2e/*.spec.ts

# For onboarding (was two levels)
sed -i '' "s|from '../../test.helper'|from '../../../test.helper'|g" modules/onboarding/e2e/*.spec.ts
```

Also update any `workflows.helper` imports in workflow files similarly.

- [ ] **Step 3: Verify moved files compile and run**

```bash
source ~/.nvm/nvm.sh && nvm use 22.15.1
npx jest --config test/jest-e2e.json test/modules/session/e2e/session.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
npx jest --config test/jest-e2e.json test/modules/apps/e2e/apps.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
npx jest --config test/jest-e2e.json test/modules/folders/e2e/folders.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
```

Expected: All pass with same counts as before.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(tests): move 18 e2e files to modules/<name>/e2e/"
```

---

### Task 3: Move workflow files + update workflows.helper imports

**Files:**
- Move: `controllers/workflow-bundles.e2e-spec.ts`, `controllers/workflow-executions.e2e-spec.ts`, `controllers/workflow-webhook.e2e-spec.ts`

- [ ] **Step 1: Move workflow files**

```bash
cd server/test
git mv controllers/workflow-bundles.e2e-spec.ts modules/workflows/e2e/workflow-bundles.spec.ts
git mv controllers/workflow-executions.e2e-spec.ts modules/workflows/e2e/workflow-executions.spec.ts
git mv controllers/workflow-webhook.e2e-spec.ts modules/workflows/e2e/workflow-webhook.spec.ts
```

- [ ] **Step 2: Update imports**

Workflow files import from both `../test.helper` and `../workflows.helper`. Both need path updates to `../../../test.helper` and `../../../workflows.helper`.

- [ ] **Step 3: Verify**

```bash
npx jest --config test/jest-e2e.json test/modules/workflows/e2e/workflow-webhook.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(tests): move workflow e2e files to modules/workflows/e2e/"
```

---

### Task 4: Merge personal-ws-disabled + super-admin into parent modules

**Files:**
- Merge: `controllers/app.e2e-spec.ts` + `controllers/personal-ws-disabled/app.e2e-spec.ts` + `controllers/super-admin/app.e2e-spec.ts` → `modules/app/e2e/app.spec.ts`
- Merge: `controllers/organizations.e2e-spec.ts` + `controllers/personal-ws-disabled/organizations.e2e-spec.ts` → `modules/organizations/e2e/organizations.spec.ts`
- Merge: `controllers/oauth/personal-ws-disabled/*` + `controllers/oauth/super-admin/*` → `modules/auth/e2e/oauth-*-instance.spec.ts`

- [ ] **Step 1: Move base app.e2e-spec.ts**

```bash
git mv controllers/app.e2e-spec.ts modules/app/e2e/app.spec.ts
```

- [ ] **Step 2: Append personal-ws-disabled/app tests as describe block**

Read `controllers/personal-ws-disabled/app.e2e-spec.ts`. Copy its describe block contents into `modules/app/e2e/app.spec.ts` as a new top-level describe block named `'app controller (EE, personal workspace disabled)'`. The beforeAll should use `initTestApp({ edition: 'ee', plan: 'team', mockConfig: true, config: { DISABLE_MULTI_WORKSPACE: 'true' } })`.

Then delete the old file: `git rm controllers/personal-ws-disabled/app.e2e-spec.ts`

- [ ] **Step 3: Append super-admin/app tests as describe block**

Same pattern: read `controllers/super-admin/app.e2e-spec.ts`, merge as describe block `'app controller (EE, super admin)'`, delete old file.

`git rm controllers/super-admin/app.e2e-spec.ts`

- [ ] **Step 4: Move and merge organizations**

```bash
git mv controllers/organizations.e2e-spec.ts modules/organizations/e2e/organizations.spec.ts
```

Read `controllers/personal-ws-disabled/organizations.e2e-spec.ts`, merge as describe block, delete old file.

- [ ] **Step 5: Move and merge OAuth instance files**

```bash
git mv controllers/oauth/personal-ws-disabled/oauth-git-instance.e2e-spec.ts modules/auth/e2e/oauth-git-instance.spec.ts
git mv controllers/oauth/personal-ws-disabled/oauth-google-instance.e2e-spec.ts modules/auth/e2e/oauth-google-instance.spec.ts
```

Append super-admin variants as describe blocks into the respective instance files:
- Read `controllers/oauth/super-admin/oauth-git-instance.e2e-spec.ts`, merge into `modules/auth/e2e/oauth-git-instance.spec.ts`
- Read `controllers/oauth/super-admin/oauth-google-instance.e2e-spec.ts`, merge into `modules/auth/e2e/oauth-google-instance.spec.ts`
- Delete old super-admin files

- [ ] **Step 6: Update all import paths in merged files**

- [ ] **Step 7: Delete empty directories**

```bash
rmdir controllers/personal-ws-disabled controllers/super-admin controllers/oauth/personal-ws-disabled controllers/oauth/super-admin controllers/oauth controllers/onboarding controllers
```

- [ ] **Step 8: Verify merged files**

```bash
npx jest --config test/jest-e2e.json test/modules/app/e2e/app.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
npx jest --config test/jest-e2e.json test/modules/organizations/e2e/organizations.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
npx jest --config test/jest-e2e.json test/modules/auth/e2e/oauth-git-instance.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "refactor(tests): merge personal-ws-disabled + super-admin into parent module files"
```

---

### Task 5: Move unit tests into module directories

**Files:**
- Move: `services/users.service.spec.ts` → `modules/users/unit/users.service.spec.ts`
- Move: `modules/data-queries/util.service.spec.ts` → `modules/data-queries/unit/util.service.spec.ts`

- [ ] **Step 1: Move unit test files**

```bash
cd server/test
git mv services/users.service.spec.ts modules/users/unit/users.service.spec.ts
git mv modules/data-queries/util.service.spec.ts modules/data-queries/unit/util.service.spec.ts
```

- [ ] **Step 2: Update import paths**

Both files need updated relative paths to `test.helper.ts`.

- [ ] **Step 3: Verify**

```bash
npx jest --config jest.config.ts test/modules/users/unit/users.service.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
npx jest --config jest.config.ts test/modules/data-queries/unit/util.service.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(tests): move unit tests into modules/<name>/unit/"
```

---

### Task 6: Add explicit edition/plan to every initTestApp call

**Files:**
- Modify: Every `.spec.ts` file in `test/modules/`

- [ ] **Step 1: Find all initTestApp calls without explicit edition**

```bash
grep -rn "initTestApp()" test/modules/ | grep -v "edition"
```

- [ ] **Step 2: Add explicit edition and plan to each call**

For each `initTestApp()` (no args) or `initTestApp({ mockConfig: true })`, add the explicit edition and plan:

```typescript
// Before:
({ app } = await initTestApp());

// After:
({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
```

For personal-ws-disabled describe blocks:
```typescript
({ app } = await initTestApp({ edition: 'ee', plan: 'team', mockConfig: true, config: { DISABLE_MULTI_WORKSPACE: 'true' } }));
```

- [ ] **Step 3: Verify no implicit calls remain**

```bash
grep -rn "initTestApp()" test/modules/ | grep -v "edition"
# Should return nothing
```

- [ ] **Step 4: Run full smoke test**

```bash
npx jest --config test/jest-e2e.json test/modules/apps/e2e/apps.spec.ts test/modules/folders/e2e/folders.spec.ts test/modules/session/e2e/session.spec.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(tests): add explicit edition/plan to every initTestApp call"
```

---

### Task 7: Final verification + cleanup

- [ ] **Step 1: Verify no files remain in old directories**

```bash
find test/controllers -name "*.ts" 2>/dev/null | wc -l
# Should be 0
```

- [ ] **Step 2: Run ALL e2e tests**

```bash
for f in test/modules/*/e2e/*.spec.ts test/modules/*/e2e/**/*.spec.ts; do
  npx jest --config test/jest-e2e.json "$f" --forceExit --no-coverage 2>&1 | grep "Tests:" | while read line; do echo "$(basename $f): $line"; done
done
```

- [ ] **Step 3: Run ALL unit tests**

```bash
npx jest --config jest.config.ts --forceExit --no-coverage 2>&1 | grep "Tests:"
```

- [ ] **Step 4: Verify structure mirrors src/modules/**

```bash
echo "=== src modules ===" && ls src/modules/ | head -20
echo "=== test modules ===" && ls test/modules/
```

- [ ] **Step 5: Verify no .e2e-spec.ts files remain**

```bash
find test/ -name "*.e2e-spec.ts" | wc -l
# Should be 0
```

- [ ] **Step 6: Delete empty old directories**

```bash
rm -rf test/controllers
rmdir test/modules/data-queries 2>/dev/null  # if old empty dir
```

- [ ] **Step 7: Commit + push**

```bash
git add -A && git commit -m "refactor(tests): complete directory restructuring — test/modules/ mirrors src/modules/"
git push origin fix/test-suite
```
