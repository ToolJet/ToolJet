# Git Sync — E2E Test Cases

Test file: `test/modules/git-sync/e2e/git-sync.spec.ts`
Suite: `GitSyncController › EE (plan: enterprise)`

> This is the single source of truth for the git-sync e2e suite — **keep it updated** whenever
> `git-sync.spec.ts` changes (new/renamed steps, new cases).

Runs against a **real Gitea / GitHub-Enterprise** server (no stubs). Requires env vars:
`TEST_GIT_BASE_URL`, `TEST_GIT_REPO_PATH`, `TEST_GIT_HTTPS_BRANCH` (optional, default `main`),
`TOOLJET_GITHUB_APP_ID`, `TOOLJET_GITHUB_INSTALLATION_ID`, `TOOLJET_GITHUB_APP_PRIVATE_KEY`,
`TOOLJET_GIT_ADMIN_USER`, `TOOLJET_GIT_ADMIN_PASSWORD` — plus the standard `.env.test` DB config.
The Gitea admin endpoints drive the git side directly (not ToolJet APIs):
`/admin/repos/<owner>/<repo>.git/reset` (reset repo), `/admin/merge` (land a branch into `main`),
`/admin/repos/<owner>/<repo>.git/files` (write a file for conflict-injection steps).

### Running

```bash
npm run test:e2e -- --testPathPatterns "git-sync"          # whole suite
npm run test:e2e:cov -- --testPathPatterns "git-sync"      # with coverage
```

Tagged `@group platform`. The two big tests are single ordered `it` blocks (each step depends on the
previous) with long timeouts (~9 min) since they hit a real git host.

---

## 1. Config CRUD & auth (`describe` blocks)

### `GET /api/git-sync/:id` — Get organization git config
- returns 401 if the auth token is missing
- returns 401 if the user is not in the specified organization
- returns the organization git config for a valid session

### `GET /api/git-sync/:id/status` — Get organization git status
- returns 401 if the auth token is missing
- returns the organization git status for a valid session

### `POST /api/git-sync` — Create organization git
- returns 401 if the auth token is missing
- returns 400 when `gitType` is missing in the body
- creates an organization git record for `github_https`

### `PUT /api/git-sync/:id` — Update organization git
- returns 401 if the auth token is missing

### `PUT /api/git-sync/status/:id` — Change organization git status
- returns 401 if the auth token is missing
- returns 400 when `gitType` is missing in the body

### `DELETE /api/git-sync/:id` — Delete organization git config
- returns 401 if the auth token is missing

### `PATCH /api/git-sync/env-configs` — Toggle env provider config
- returns 401 if the auth token is missing
- returns 400 when the provider is not a valid `GITConnectionType`

### Github HTTPS save + retrieve flow
- `POST /api/git-sync/test-connection` → 401 when unauthenticated
- `POST /api/git-sync/test-connection` → passes for a valid payload
- `POST /api/git-sync/configs` → 401 when unauthenticated
- `POST /api/git-sync/configs` then `GET /api/git-sync/:id` → persists the config and does **not** expose the private key

---

## 2. App git life cycle (`it: should complete the full app git life cycle`)

End-to-end single test; each step depends on the previous. Steps:

| # | Step |
|---|------|
| 0 | Reset Gitea repo to a clean state |
| 1 | Save provider configs & load the `main` branch (auto-seeds the default branch) |
| 2 | List remote branches → only `main` exists after reset |
| 3 | `check-updates` on `main` → `hasUpdates` true with latest-commit info |
| 4 | Pull `main` → 201 |
| 5 | Create `feat-e2e` branch off `main` |
| 6 | List workspace branches → `main` + `feat-e2e`; active branch is now `feat-e2e` (create auto-switches) |
| 7 | GET apps on `feat-e2e` → empty |
| 8 | List remote branches → shape check (`main` + `feat-e2e`) |
| 9 | Create app on `feat-e2e` (happy path); **reject** create on `main` (branching enabled) → 400 |
| 10 | App-git branches → `feat-e2e` (git) + `main` (workspace); `active_branch_id` = default |
| 11 | Fetch app detail → `versionId`/`envId`/`pageId`; env-versions → single branch DRAFT |
| 12 | Add a Button component to the draft version |
| 13 | `gitpush` commit to `feat-e2e` |
| 14 | Merge `feat-e2e` → `main` on Gitea |
| 15 | Pull `main` (picks up merged commit) |
| 16 | GET apps on `main` → app visible as a **stub** version |
| 17 | Hydrate stub via `GET /apps/:id` → `hydration_status: success`; re-open → `already-up-to-date` |
| 18 | Re-list apps on `main` → hydrated (`is_stub: false`) |
| 19 | env-versions on `main` → 1 version after hydrate |
| 20 | Save v1: `check-tag` → `PUT` version `PUBLISHED` → `POST` tag |
| 21 | env-versions after publish → 3 versions (fresh UUID draft seeded on `main`) |
| 22 | Create `feat-e2e-2` branch off `main` |
| 23 | Rename app to `testing-app-2` on `feat-e2e-2` |
| 24 | Change slug to `testing-app-2-slug` on `feat-e2e-2` |
| 25 | Change icon to `sentfast` on `feat-e2e-2` |
| 26 | Flip `is_public=true` on `feat-e2e-2` |
| 27 | `gitpush` commit `feat-e2e-2` (name + slug + icon + is_public) |
| 28 | Merge `feat-e2e-2` → `main` |
| 29 | Switch to `main` & list apps → still pre-pull name `testing-app-1` |
| 30 | `check-updates` on `main` → `hasUpdates` true (merge commit ahead) |
| 31 | Pull `main` |
| 32 | List apps on `main` → name `testing-app-2` (slug still stub uuid) |
| 33 | Pull-from-builder + `ensure-draft` → new draft version id |
| 34 | GET draft version → name + slug + icon + is_public propagated |
| 35 | GET published v1 → editing_version PUBLISHED + inherits main draft name/slug |
| 36 | Promote v1 through envs (dev → staging → production) + release |
| 37 | Released-app access + slug lookup + default env (production) |
| 38 | `feat-e2e-3`: duplicate app name (`testing-app-2`) → 400 |
| 39 | `feat-e2e-3`: unique name OK; duplicate slug 4xx; unique slug OK |
| 40 | Commit + merge `feat-e2e-3` → `main`, verify name + slug |
| 41 | Create `feat-e2e-4`; create `testing-app-4` & `testing-app-5` |
| 42 | Create folder `test-folder-1` |
| 43 | List folders on `feat-e2e-4` → `test-folder-1` present with 0 apps |
| 44 | Add `testing-app-4` to `test-folder-1` |
| 45 | List folders → count = 1 (branch-scoped `folder_app`) |
| 46 | Bulk add `testing-app-4` & `testing-app-5` to folder (single request) |
| 47 | List folders → count = 2 |
| 48 | Commit app4 & app5, merge `feat-e2e-4` → `main`, pull, validate folder mapping on `main` |
| 49 | Hydration failure: invalid repo URL surfaces `hydration_error` on `GET /apps/:id` |
| 50 | Per-app pull via `ensure-draft` preserves folder mapping (sibling of step 48) |
| 51 | Feature-branch pull preserves local-only app |
| 52 | Data-source workspace push → merge → pull `main`: DS appears with per-env options |
| 53 | Module + ModuleViewer linking: app GET surfaces module via `co_relation_id` |
| 54 | Merge `feat-e2e-11` → `main`, pull, hydrate host app → module cascades hydrated |
| 55 | Pull `main` with conflicting `appMeta` (intra-incoming same name) → 409 with details |
| 56 | Pull `main` with `appMeta` same name in different folders → 409 with details |
| 57 | Pull `main` with conflicting `moduleMeta` (intra-incoming same name) → 409 with details |
| 58 | Pull `main` with `moduleMeta` same name in different folders → 409 with details |
| 59 | Pull `main` with conflicting `dataSourceMeta` (intra-incoming same name) → 409 with details |
| 60 | Delete data source A on a branch, then rename B → A → succeeds (branch-aware name check) |
| 61 | Orphan **APP** on default branch: pull marks `is_synced=false` (not deleted); GET reflects it |
| 62 | Orphan **MODULE** on default branch: pull marks `is_synced=false` (not deleted); GET reflects it |
| 63 | Orphan **DATA SOURCE** on default branch: pull marks `is_synced=false` (not deleted); GET reflects it |
| 64 | meta-prop: create app on `feat-meta-prop-1` & push |
| 65 | meta-prop: merge `feat-meta-prop-1` → `main`, then SINGLE-APP pull onto `main` |
| 66 | meta-prop: save the version (publish v1) → `main` holds 1 PUBLISHED + 1 DRAFT sharing meta |
| 67 | meta-prop: edit name/slug/icon on `feat-meta-prop-2` → default-branch meta MUST NOT change |
| 68 | meta-prop: push + merge `feat-meta-prop-2`, single-app pull → new meta on ALL default-branch rows |
| 69 | unsynced-app: create `feat-unsynced` + app, relocate its version onto the default branch |
| 70 | unsynced-app: absent on its feature branch, present on the default branch |
| 71 | unsynced-app: `validate-push` → valid (single non-stub draft) |
| 72 | unsynced-app: a second non-stub draft (copy) → `validate-push` fails `MULTIPLE_DRAFTS` |
| 73 | unsynced-app: remove the duplicate draft → back to a single pushable draft |
| 74 | unsynced-app: `gitpush` the default-branch version onto `feat-unsynced` |
| 75 | unsynced-app: pull `feat-unsynced` → app now listed on the feature branch |
| 76 | unsynced-app: merge `feat-unsynced` → `main` |
| 77 | unsynced-app: pull `main` → the default-branch version is now synced (`is_synced = true`) |
| **78** | **active-branch: switching persists** — `PUT :id/activate` to `main` then a feature branch; each list reflects the last switch |
| **79** | **active-branch: no valid active branch** (removed/cleared → `last_branch_id` NULL via FK `ON DELETE SET NULL`) → list falls back to the **default** branch |
| **80** | **active-branch: branching OFF** → list exposes only the default branch (`isMultiBranchingEnabled=false`, all `isDefault`, active = default); then branching restored |
| **81** | **single-branch: create on default** — disable branching; create app + module + data source directly on the **default** branch (rejected under multi-branch, allowed here); link the DS to the app via a query |
| **82** | **single-branch: unsynced app is push-eligible on default** — `GET /app-git/validate-push/:id` → `{ valid: true }` |
| **83** | **single-branch: default-branch resource state** — app + module versions are on the default branch, `DRAFT`, `is_synced=false`; the DS has an unsynced DSV on the default branch and is linked to the app via a query; then branching restored |

Steps 78–80 are the active-branch resolution cases (last created/switched loads next time;
invalid/removed or branching-off falls back to the default). Steps 81–83 are the single-branch
(branching-disabled) flow: create app/module/data-source directly on the default branch and assert
push-eligibility + resource state.

> **Test-env note:** the shared test Gitea blocks **direct pushes to the default branch** (pre-receive
> hook — everything lands there via feature-branch + admin `/merge`). Single-branch pushes go straight
> to the default branch, so the actual git transport / committed-file validation for single-branch
> can't be exercised against this repo; steps 81–83 validate the behaviour at the app/authorization
> layer instead.

---

## 3. Git / non-git edit restrictions (`it: enforces edit rules across git-off, git-on (unsynced/synced) and branching-off states`)

Dedicated isolated org. Exercises the git-sync edit guards
(`assertVersionEditable` + `assertGitSyncEditAllowed` + `assertNotGitLicenseLocked`) across every state.

| # | Step | Expected |
|---|------|----------|
| 1 | git-off: create app + module + data source | 201 |
| 2 | git-off: add component + query to the app **and** the module | all allowed (201) |
| 3 | git-off: add another data source, **edit** it, rename app + module, add more component/query | all allowed (200/201) |
| 4 | git-off: save (publish) the app + module version | 200; no DRAFT remains (no continuity draft when unsynced) |
| 5 | git-off: edit the **SAVED (published)** version — add component + add query (app & module) | **400** (saved version is immutable) |
| 6 | Configure git sync (reset repo + save provider configs), enable branching, pull `main` | 201/200 |
| 7 | git-on (multi-branch): **unsynced** app on default branch — create a fresh DRAFT (is_synced=false), edit it | allowed (201) — unsynced exemption |
| 8 | Sync app: create feature branch, `gitpush` the default-branch draft onto it | 201 |
| 9 | Pull feature (capture branch version), merge feature → `main`, pull `main` | default-branch draft becomes `is_synced=true` |
| 10 | git-on (multi-branch): edit the **SYNCED** default-branch draft — component + query | **403** (synced default branch) |
| 11 | git-on (multi-branch): edit on the **feature branch** | allowed (201) |
| 12 | **Branching OFF** (single-branch): edit on the feature branch | **403** (branching disabled) |
| 12 | **Branching OFF** (single-branch): edit on the **default** branch — component + query | allowed (201) |
| 13 | git configured + **license expired** (runtime override): edit the default-branch draft — component + query | **403** (git license lock); enterprise plan restored afterwards |

### Edit-restriction matrix (what the guards enforce)

| Version state | git off | git on, multi-branch, default | git on, multi-branch, feature | git on, single-branch, default | git on, single-branch, feature | git configured + license expired |
|---|---|---|---|---|---|---|
| **DRAFT, unsynced** | ✅ allow | ✅ allow | ✅ allow | ✅ allow | ⛔ 403 | ⛔ 403 |
| **DRAFT, synced** | ✅ allow | ⛔ 403 | ✅ allow | ✅ allow | ⛔ 403 | ⛔ 403 |
| **PUBLISHED / RELEASED (saved)** | ⛔ 400 | ⛔ 400 | ⛔ 400 | ⛔ 400 | ⛔ 400 | ⛔ 400 |

Guards apply uniformly to **components**, **queries**, **pages**, **version content edits**, and **data source create/edit** on the affected routes.

---

## 4. Create draft & patch flow (`it: replaces the draft when creating from a saved version, discarding uncommitted edits`)

Dedicated isolated org, **git enabled + branching OFF (single-branch)**. Verifies that creating a
draft from a saved version replaces the single draft (the atomic `replaceDraftVersion` /
`POST /apps/:id/versions { replace: true }` path). No git transport — pure version
create/publish/replace — so it runs against the protected-`main` repo.

| Step | Action | Assert |
|---|---|---|
| Setup | Configure git, toggle branching OFF; create app + module + data source on the default branch; add `comp_A` + `query_A` to the app, `mod_query_A` to the module | creates succeed |
| Save v1 | Publish the app version (`PUT status=PUBLISHED`, name `v1`) | v1 has `[comp_A]` / `[query_A]` |
| New draft | Create draft from `v1` (`replace:false`) → `d2` | `d2` is a clean copy of v1 (`[comp_A]` / `[query_A]`); it's the editing version |
| Edit draft | Add `comp_B` + `query_B` to `d2` | `d2` = `[comp_A, comp_B]` / `[query_A, query_B]` |
| **Patch (replace)** | Create draft from `v1` (`replace:true`) → `d3` | `d2` is **deleted**; `d3` is a clean copy of v1 (`[comp_A]` / `[query_A]`) — the uncommitted `comp_B`/`query_B` are **discarded**; `d3` is the editing version |
| Save v2 | Add `comp_C` + `query_C` to `d3`, publish as `v2` | `v2` = `[comp_A, comp_C]` |
| **Patch from first version** | Create draft from `v1` again (`replace:true`) → `d4` | `d4` mirrors **v1** (`[comp_A]` / `[query_A]`), **not** v2 (no `comp_C`/`query_C`); `d4` is the editing version |

Component/query assertions read the DB keyed by the version id resolved from `GET /apps/:id`
(`editing_version`), so they're deterministic. Backend: `replaceDraftVersion` deletes the existing
default-branch draft and clones the chosen published version in one transaction, preserving the
replaced draft's sync state.

---

## 5. Unsynced app — multiple drafts across git/branching states (`it: allows unlimited draft versions for an unsynced app (git off/on, branching on/off)`)

Dedicated isolated org. The single-draft rule only applies to **synced** versions (`createVersion`
exempts `is_synced === false`), so an app that was never pushed to git behaves like a non-git
workspace and can hold any number of drafts — in **every** git/branching combination. The app is
created git-off and stays unsynced throughout; only the workspace git/branching state is toggled.

| State | Action | Assert |
|---|---|---|
| **git OFF** | Create the (unsynced) app, then create 2 extra drafts from its version | both `201`; **3** DRAFT versions; app fully unsynced |
| **git ON, branching ON** (multi-branch) | Configure git, `is-branching-enabled: true`; create 2 more drafts | both `201`; **5** drafts; still fully unsynced (configuring git must not flip existing versions) |
| **git ON, branching OFF** (single-branch) | `is-branching-enabled: false`; create 2 more drafts | both `201`; **7** drafts; still fully unsynced |

Draft count + sync state are read from the DB (`status='DRAFT' AND version_type='version'`, and
`bool_and(is_synced=false)`), so the assertions are deterministic.

---

## Test-only license control

`ee/licensing/configs/License.ts` reads `TEST_LICENSE_TERMS` (JSON) under `NODE_ENV=test` instead of decrypting a key.
In e2e tests (which mock `LicenseTermsService`), use the helpers from `test-helper`:

- `setTestLicenseTerms(app, terms, { expired })` — override the license at runtime (no restart)
- `restoreLicensePlan(app, plan = 'enterprise')` — revert
