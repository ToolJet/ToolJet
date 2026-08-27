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
npm run test:gitsync                                       # ALL git-sync tests: unit + e2e (single command)
npm run test:gitsync:unit                                  # git-sync UNIT specs only (no simulator/DB-light)
npm run test:gitsync:e2e                                   # git-sync E2E specs only (needs the git simulator)
npm run test:e2e -- --testPathPatterns "git-sync"          # e2e whole suite (alt)
npm run test:e2e:cov -- --testPathPatterns "git-sync"      # e2e with coverage (alt)
```

**Per-run repo isolation.** `scripts/run-e2e.sh` (used by every `test:e2e`/`test:gitsync:e2e` run)
mints one fresh repo id per invocation and exports `TEST_GIT_REPO_PATH=run-ci/<uuid>` (GitHub) and
`TEST_GITLAB_REPO_PATH=run-ci/<uuid>-gitlab` (GitLab). Generated **once** — not per shard, not per
spec — so a single `npm run test:gitsync` touches exactly one repo, which the simulator's reset
endpoint auto-creates as an empty bare repo on first use. This stops concurrent runs (and stale refs
left by a run that died mid-way) from colliding on the shared simulator. Pin a specific repo by
exporting `TEST_GIT_REPO_PATH` / `TEST_GITLAB_REPO_PATH` yourself — the runner respects a set value
and only falls back to `run-ci/<uuid>` when unset. (The old static defaults `gsmithun4/e2e` /
`gsmithun4/gitlab-e2e` remain the in-spec fallback when a spec is run directly via `jest`, bypassing
`run-e2e.sh`.)

> **Note:** `git-sync-gitlab.spec.ts` is **not quarantined** — it runs under the normal
> `test:e2e` / `test:gitsync:e2e` flow (all GitHub lifecycle cases are mirrored into it). It
> **self-guards**: when the GitLab env (`TEST_GITLAB_TOKEN`, `TEST_GIT_BASE_URL`,
> `TOOLJET_GIT_ADMIN_USER`, `TOOLJET_GIT_ADMIN_PASSWORD`) is present it executes for real against
> the GitLab-shaped simulator; when any is missing it prints a `[git-sync-gitlab] SKIPPED …` line
> and skips the whole suite at runtime (via `describe.skip`) instead of throwing at import — so a
> GitLab-less `npm run test:e2e` stays green. Set the env to run it.

`test:gitsync:unit` covers the pure/near-pure helpers with fast, host-free unit specs under
`test/modules/{git-sync,git-sync-configs,git-sync-webhooks,platform-git-sync,workspace-branches,app-git}/unit/`
(error classifier + sanitizer, connection-error handler, webhook signature + dedup, datasource/resource
FS readers, branching-tag/target helpers, `git-tree-sha` ls-remote/ls-tree parsing,
`AppGitFileOperationsUtil` layout resolvers + `validateAppJsonForImport` normalization,
the whole `GitOperationsUtil` simple-git wrapper — clone/sparseClone/commit/push/branchExists/
resolveTagToSha argv shaping — and `PlatformGitPushService`'s fs-only meta helpers
(`deleteAppFromRepo`, `readAppMeta`/`writeAppMeta`)). `test:gitsync` chains unit then e2e.

### Coverage (git-sync files only)

```bash
# export git + DB env first (the runner only loads PG_*/TOOLJET_DB from .env.test):
set -a; source ../.env.test; set +a
npm run test:e2e:cov:gitsync            # → coverage-gitsync/ (html + lcov + text summary)
```

`test:e2e:cov:gitsync` (config `test/jest-e2e.gitsync-cov.config.ts`) runs only the git-sync e2e specs
and narrows `collectCoverageFrom` to the git-sync source surface, so the report is just those files
instead of all of `src/**`+`ee/**`. Covered dirs: `ee/git-sync`, `ee/platform-git-sync`,
`ee/git-sync-configs`, `ee/workspace-branches`, `ee/app-git`, and their CE counterparts under
`src/modules/{git-sync,git-sync-configs,platform-git-sync,workspace-branches,app-git}`
(minus `*.module.ts` / `*.entity.ts` / `*.dto.ts`).

> **GitLab coverage:** `git-sync-gitlab.spec.ts` self-skips when the GitLab env is missing (see the
> note above), so without it **`**/providers/gitlab/**` reads as uncovered** here. To include GitLab
> coverage, just export the GitLab env (`TEST_GITLAB_TOKEN` et al.) before running
> `npm run test:e2e:cov:gitsync` — no `--testPathIgnorePatterns` override is needed anymore, the spec
> is no longer quarantined.

Requires the same infra as the tests below — a reachable git simulator (`TEST_GIT_BASE_URL`) and the
test DB. Because the whole suite hits a real git host and is `@group platform`, the run is slow
(several minutes) and single-threaded (`--runInBand`).

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
| 32 | Pull `main` → dashboard list reflects **all** user-facing metadata refreshed by the pull: name `testing-app-2`, slug `testing-app-2-slug`, icon `sentfast`, `is_public=true` (previously the pull updated only `app_name`; slug/icon/is_public now land straight from the pull, not just after a later ensure-draft) |
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
| 61 | Orphan **APP** on default branch (synced, removed from git): pull DELETES its branch versions; `apps` row kept |
| 62 | Orphan **MODULE** on default branch: pull DELETES its branch versions; `apps` row kept |
| 63 | Orphan **DATA SOURCE** on default branch: pull DEACTIVATES the DSV (`is_active=false`); row kept |
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
| **83** | **single-branch: default-branch resource state** — app + module versions are on the default branch, `DRAFT`, **`is_synced=false`** (a brand-new resource is unsynced on create in **every** mode — git-off, multi-branch feature, and single-branch default alike; only a push/materializing pull flips it true); the DS has an **unsynced** DSV on the default branch and is linked to the app via a query; then branching restored |

Steps 78–80 are the active-branch resolution cases (last created/switched loads next time;
invalid/removed or branching-off falls back to the default). Steps 81–83 are the single-branch
(branching-disabled) flow: create app/module/data-source directly on the default branch and assert
push-eligibility + resource state.

> **Test-env note:** the shared test Gitea blocks **direct pushes to the default branch** *when it is
> named `main`* (that's the simulator's `PROTECTED_BRANCH`). Steps 81–83 keep the default branch as
> `main`, so single-branch git transport can't be exercised there and they validate at the
> app/authorization layer instead.
>
> **Single-branch push/pull IS testable** by configuring git with a **non-`main` default branch name**
> (the suite uses `single-branch-main`): the simulator only protects `main`, so a differently-named
> default branch accepts direct pushes. Section 18 uses this to exercise a real single-branch
> push/pull lifecycle for apps, modules, and data sources straight onto the (unprotected) default
> branch. Set `branchName: 'single-branch-main'` in the `POST /configs` payload and seed the workspace
> default branch with that name.

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
| 5 | git-off: edit the **SAVED (published)** version — component create/update/delete, query create, page create, version content edit (+ module component) | **400** (saved version is immutable) |
| 6 | git-off: **folder** create + add-to-folder + remove-from-folder | allowed (201/200) — folder-apps branch-lock is a no-op when git is off |
| 7 | Configure git sync (reset repo + save provider configs), enable branching, pull `main` | 201/200 |
| 8 | git-on (multi-branch): **unsynced** app on default branch — create a fresh DRAFT (is_synced=false), edit it | allowed (201) — unsynced exemption |
| 9 | Sync app: create feature branch, `gitpush` the default-branch draft onto it | 201 |
| 10 | Pull feature (capture branch version), merge feature → `main`, pull `main` | default-branch draft becomes `is_synced=true` |
| 11 | git-on (multi-branch): edit the **SYNCED** default-branch draft — component create/update/delete, query create, page create, version content edit, **data source edit** (DSV marked synced), **and folder add/remove** | **403** (synced default branch) |
| 12 | git-on (multi-branch): edit on the **feature branch** — component **and folder add/remove** | allowed (201/200) |
| 13 | **Branching OFF** (single-branch): edit on the feature branch — component **and folder add** | **403** (branching disabled); default branch — component + query **and folder add/remove** allowed (201/200) |
| 14 | git configured + **license expired** (runtime override): edit the default-branch draft — component + query **and folder add/remove** | **403** (git license lock); enterprise plan restored afterwards |

### Edit-restriction matrix (what the guards enforce)

| Version state | git off | git on, multi-branch, default | git on, multi-branch, feature | git on, single-branch, default | git on, single-branch, feature | git configured + license expired |
|---|---|---|---|---|---|---|
| **DRAFT, unsynced** | ✅ allow | ✅ allow | ✅ allow | ✅ allow | ⛔ 403 | ⛔ 403 |
| **DRAFT, synced** | ✅ allow | ⛔ 403 | ✅ allow | ✅ allow | ⛔ 403 | ⛔ 403 |
| **PUBLISHED / RELEASED (saved)** | ⛔ 400 | ⛔ 400 | ⛔ 400 | ⛔ 400 | ⛔ 400 | ⛔ 400 |
| **Folder membership** (folder-apps add/remove, branch-scoped) | ✅ allow | ⛔ 403 | ✅ allow | ✅ allow | ⛔ 403 | ⛔ 403 |

Guards apply uniformly to **components**, **queries**, **pages**, **version content edits**, **data source create/edit**, and **folder membership (add-to-folder / remove-from-folder)** on the affected routes. Folder membership (`folder_apps`) is branch-scoped, so it follows the branch-lock; folders themselves are org-scoped and their rename/delete are gated in the dashboard UI only (enforced via `assertGitSyncCreateAllowedForOrg` on the `folder-apps` routes in `ee/folder-apps/controller.ts`).

---

## 4. Create draft & patch flow (`it: replaces the draft when creating from a saved version, discarding uncommitted edits`)

Dedicated isolated org, **git enabled + branching OFF (single-branch)**. Verifies that creating a
draft from a saved version replaces the single draft (the atomic `replaceDraftVersion` /
`POST /apps/:id/versions { replace: true }` path). No git transport — pure version
create/publish/replace — so it runs against the protected-`main` repo.

| Step | Action | Assert |
|---|---|---|
| Setup | Configure git, toggle branching OFF; create app + module + data source on the default branch; add `comp_A` + `query_A` to the app, `mod_query_A` to the module | creates succeed |
| Save v1 | Publish the app version (`PUT status=PUBLISHED`, name `v1`) | v1 has `[comp_A]` / `[query_A]`; the published version is **unsynced-on-create**, so `handleDefaultBranchPublish` returns early and seeds **no** continuity draft (same as §9) — 0 drafts remain after publish |
| New draft | Create draft from `v1` (`replace:true`) → `d2` | `d2` is a clean copy of v1 (`[comp_A]` / `[query_A]`); it's the editing version. The test uses the atomic `replace:true` path throughout (with no continuity draft, `replace:false` would also succeed here) |
| Edit draft | Add `comp_B` + `query_B` to `d2` | `d2` = `[comp_A, comp_B]` / `[query_A, query_B]` |
| Stamp staleness | Set `git_tree_sha` to a non-null value on both `d2` (draft being replaced) and `v1` (source version) | — |
| **Patch (replace)** | Create draft from `v1` (`replace:true`) → `d3` | `d2` is **deleted**; `d3` is a clean copy of v1 (`[comp_A]` / `[query_A]`) — the uncommitted `comp_B`/`query_B` are **discarded**; `d3` is the editing version; `d3.git_tree_sha` is **NULL** (never-materialized) so a later `pull latest` / app-open refreshes it instead of skipping |
| Save v2 | Add `comp_C` + `query_C` to `d3`, publish as `v2` | `v2` = `[comp_A, comp_C]` |
| **Patch from first version** | Create draft from `v1` again (`replace:true`) → `d4` | `d4` mirrors **v1** (`[comp_A]` / `[query_A]`), **not** v2 (no `comp_C`/`query_C`); `d4` is the editing version |

Component/query assertions read the DB keyed by the version id resolved from `GET /apps/:id`
(`editing_version`), so they're deterministic. Backend: `replaceDraftVersion` deletes the existing
default-branch draft and clones the chosen published version in one transaction, preserving the
replaced draft's sync state. It also forces the new draft's `git_tree_sha` to `NULL` — change
detection compares `git_tree_sha` against git's current tree SHA (both on `pull latest` and on the
next app-open), so a stale non-null value would make them skip the draft; forcing it NULL makes the
patched draft look never-materialized and guarantees the next pull/open refreshes it.

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

## 6. Resolve conflicts during workspace pull (`it: surfaces same-name pull conflicts and resolves them via relink / rename / delete`)

Dedicated isolated org. A workspace pull that brings in a git resource whose **name** matches a local
resource but whose **correlation id differs** raises a **409** with structured conflict details
(`body.message` is a JSON string → parse `conflictGroups`; each group pairs the `incoming` git
correlation id with the `existing` local one). It never silently duplicates. Three resolution
strategies are exercised and the conflict response is asserted to **shrink** after each until the
pull succeeds.

**Setup** mirrors the proven sync-unsynced flow (section 2, steps 69-77): author resources git-off,
enable git + branching, gitpush them onto ONE feature branch, merge → `main`. A data source rides into
git via a query on a **carrier app** (`serializeLinkedDataSourcesForApp`); modules push through the
same `gitpush` route as apps. Local correlation ids are then diverged with raw SQL to manufacture the
conflicts (the carrier's corr-id is left untouched as a control).

| # | Step | Expected |
|---|------|----------|
| 1 | git-off: create 4 apps (`relink`/`rename`/`delete`/`carrier`) + 1 module + 1 data source; add a component to each app; link the DS to the carrier via a query | 201 |
| 2 | Configure git, enable branching, pull `main`; normalize the git-off versions/DSV onto the default branch | 201/200 |
| 3 | Create `feat-conflicts`, gitpush all 4 apps + the module onto it, pull the feature branch | 201 |
| 4 | Diverge LOCAL corr-ids (random uuid) for relink/rename/delete apps + module + data source | — (carrier untouched) |
| 5 | Merge `feat-conflicts` → `main` | `ok: true` |
| 6 | **Pull `main`** | **409**; `conflictGroups` = 3 apps + 1 module + 1 datasource (5); carrier **absent**; group pairs `incoming`=git corr-id / `existing`=local corr-id |
| 7 | **Resolve #1 — rename**: rename local `cf-app-rename` — BOTH name AND slug (`→ cf-app-rename-local`), then pull | 200; pull **409** but the rename conflict **gone** |
| 8 | **Resolve #2 — delete**: `DELETE /api/apps/:id` on `cf-app-delete`, then pull | 200; pull **409** but the `delete` conflict **gone** — only the relink app + module + datasource remain |
| 9 | **Resolve #3 — relink**: `POST /workspace-branches/resolve-conflicts` for app + module + datasource (adopt remote corr-id) | 201; local corr-ids now equal the remote ones; versions marked synced |
| 10 | Pull `main` | **201** — all conflicts resolved |

**Name AND slug** — the conflict detector flags collisions on `name` **and** `slug` independently
(`conflictField`), so one diverged resource can produce two groups. Git-off-authored apps get a UUID
slug that still matches git after a name-only rename, so the rename resolution must change **both** the
name and the slug. Assertions therefore key off the **diverged correlation id** each resource was given
(present on the `existing` side of any group) rather than a `conflictKey`, so name/slug duplication is
handled uniformly.

**Resolution order** — relink is applied **last** on purpose: `resolve-conflicts` marks the relinked
app/module version `is_stub=true` and relies on the **next** pull to hydrate it, so it must run
immediately before the final (successful) pull. rename/delete clear a conflict without leaving a stub,
so they go first while the other conflicts still block the pull — which also lets the test watch the
conflict response shrink toward zero. Each pull's groups are logged (`ⓘ pull#n: …`) for diagnosis.

**Resolution semantics** (`ee/workspace-branches/service.ts` → `applyConflictResolutions`):
- **relink** — updates the local `apps.co_relation_id` (or `data_sources.co_relation_id`) to the
  incoming/remote value and marks the version/DSV `is_synced=true` (apps also `is_stub=true` so the
  next pull hydrates content). The subsequent pull then matches by correlation id and updates in place.
- **rename** — the local name no longer collides, so the remote resource is imported as a separate row.
- **delete** — the local resource is removed, so the remote resource is imported fresh.

Correlation ids are read from the DB (`co_relation_id` on `apps` / `data_sources`) and cross-checked
against the parsed conflict response, so the assertions are deterministic. Backend enforcement:
`POST /api/workspace-branches/resolve-conflicts` (`ResolveConflictsDto`: `resolutions[]` of
`{ type: 'app'|'module'|'datasource', existingCoRelationId, incomingCoRelationId }` + optional `branchId`).

---

## 7. Create a feature branch from a saved version (`it: branches from a saved version, saves a version on it, and surfaces it synced on main`)

Dedicated isolated org. `POST /api/workspace-branches` accepts `{ appId, versionId }` to branch **from a
specific saved version**. Verifies the full "branch from a saved version → fix on the branch → save a
version → it appears synced in the main version list" flow, plus the `is_synced` bookkeeping on saved
versions along the way. Setup reuses the proven sync-unsynced flow (section 2).

| # | Step | Expected |
|---|------|----------|
| 1 | git-off: create app + component, publish **v1** (git-off saved version), create a draft | 201 |
| 2 | Configure git + branching, pull `main`, normalize the git-off versions onto the default branch | 201/200 |
| 3 | Sync the draft to main: branch `feat-sync` → gitpush the draft → pull → merge → pull `main` | 201 |
| 4 | Assert sync state, then save the draft as **v2** (check-tag → publish → tag) | `v1.is_synced=false` (git-off saved, never pushed); the synced draft `is_synced=true`; `v2.is_synced=true` |
| 5 | **Create a feature branch FROM v2**: `POST /workspace-branches { name, sourceBranchId, appId, versionId: v2 }` | 201; returns the new branch `id` |
| 6 | Pull the new branch → the app is present; add a component on the branch | app listed on the feature branch; 201 |
| 7 | **Save version v44 on the feature branch** (check-tag → publish → tag) | 200/201 — the BRANCH-type draft is cloned into a PUBLISHED VERSION-type row on the **default** branch |
| 8 | Merge the feature branch → `main`, pull `main` | 201 |
| 9 | `GET /api/apps/:id/versions` on `main` → find **v44** | present with **`is_synced=true`** (git holds its content) |

**Two code fixes this test drove out:**
- **Branch-from-synced-version 400** (`ee/workspace-branches/service.ts` → `createBranch`): the
  `{ appId, versionId }` path called `gitPushApp` for *every* version, but a **synced** version is
  already in git on the source-branch ref the new branch was cut from, and — being a VERSION-type row —
  pushing it trips `gitPushApp`'s "only branch versions can be pushed" guard under multi-branch. Fixed to
  push **only when the source version is unsynced** (`isSynced === false`), matching the code's own
  documented intent (the push exists purely to seed a never-pushed version's content).
- **Saved-from-branch version left unsynced** (`src/modules/versions/util.service.ts` →
  `createPublishedVersionFromBranchDraft`): cloning a feature-branch draft into the PUBLISHED
  default-branch version **hardcoded `is_synced=false`**, so a version saved from a feature branch showed
  as never-pushed in main's version list. Fixed to `is_synced = (git sync enabled)` — a version saved
  while git sync is on is committed to git, so it is synced (this branch-draft save path only runs in a
  multi-branch git-enabled workspace; gating on `isEnabled` keeps it correct if the license has lapsed).

Sync state is read from the DB (`is_synced` on `app_versions`) and cross-checked against the versions
list API; the final assertion carries a full per-branch version dump on failure for diagnosis.

---

## 8. Push unsynced datasources only (`it: pushes only unsynced datasources, leaving already-synced ones untouched in git`)

Dedicated isolated org. Verifies the bulk "Sync unsynced datasources" push (`POST
/workspace-branches/push` with `scope: 'datasource'`, used by the homepage/data-sources page's "Sync"
button) only serializes and commits datasources that are actually unsynced — a synced datasource must
be left completely untouched in git (same file content, never deleted), not just excluded from the
diff by coincidence.

Everything runs on a single feature branch — the shared test Gitea blocks direct pushes to the
protected default branch (see the test-env note under §2), and `serializeDataSources` doesn't care
which branch it's serializing for, so a feature branch exercises the same code path as a push to main.

| # | Step | Expected |
|---|------|----------|
| 1 | Configure git, enable branching, pull `main` | 201/200 |
| 2 | Create `feat-ds-scope`; create `ds-scope-synced` + `ds-scope-unsynced` on it | 201 |
| 3 | Full push (no `scope`) → both DS committed | both DSVs `is_synced=true` on `feat-ds-scope` |
| 4 | Edit `ds-scope-unsynced`'s option value (real content change) + flip its DSV back to `is_synced=false` (simulates a local, un-pushed edit) | — |
| 5 | Push with `scope: 'datasource'` | 201 |
| 6 | Re-clone `feat-ds-scope`, read `ds-scope-synced`'s file | byte-identical to before step 5 — untouched, **not deleted** |
| 7 | Re-clone, read `ds-scope-unsynced`'s file | reflects the edit; its DSV is now `is_synced=true` |
| 8 | Re-check `ds-scope-synced`'s DSV | still `is_synced=true` — unaffected by the unsynced-only push |

**Why step 4 edits real content, not just the `is_synced` flag:** a raw `is_synced=false` flip alone
produces a serialized JSON byte-identical to what's already committed, so `pushWorkspace`'s
`status.files.length === 0` early-return fires before it ever reaches the isSynced=true marking step —
verified while writing this test, it looked like a regression until the setup was corrected to include
a genuine content change (mirroring how a real "locally edited but not yet pushed" datasource behaves).

**Two bugs this test guards against** (`ee/git-sync/workspace-git-sync-adapter.ts` →
`serializeDataSources`):
- **Pushed everything, not just unsynced** — when a branch DSV already existed, it was always
  re-serialized regardless of `isSynced`, so a "sync unsynced only" push re-committed every
  already-synced datasource too. Fixed: skip when `dsv.isSynced && scope === 'datasource'`.
- **Wiped and re-deleted untouched files** — `serializeDataSources` unconditionally wiped the whole
  `data-sources/` directory before rewriting it; combined with the fix above (which now *skips*
  already-synced DS), their files were wiped and never rewritten, so git staged them as deleted. Fixed:
  for `scope === 'datasource'`, only `mkdir` (no wipe) so untouched files survive.

Both fixes were verified live against the real test Gitea server before being locked in as this test.

**Mirrored in `git-sync-gitlab.spec.ts`** (same assertions, `GITLAB_PAYLOAD` provider config).

---

## 9. Git-off metadata update with no draft version (`it: persists name/slug/icon/is_public and keeps the app resolvable by its new slug`)

Dedicated isolated org, **git never configured (git-off)**. Regression for a silent data-loss bug:
`PUT /api/apps/:id` updating app metadata (`name` / `slug` / `icon` / `is_public`) only ever wrote to
the app's **DRAFT** default-branch version row. But a git-off app can have **no DRAFT** — create →
publish flips the draft to `PUBLISHED` and, because the app is unsynced, no continuity draft is seeded
(`handleDefaultBranchPublish` returns early for `is_synced=false`). The draft-scoped `UPDATE` then
matched zero rows and the edit was dropped — leaving the app reachable only under its old slug, so
`GET /api/apps/validate-released-app-access/<new-slug>` 404'd (`findAppBySlug` can't resolve a slug
that was never written). No git transport — pure create/publish/update — so it runs against the
protected-`main` repo. **Mirrored in `git-sync-gitlab.spec.ts`** (provider-agnostic — the write path
is git-off).

| # | Step | Expected |
|---|------|----------|
| 1 | git-off: create app → one DRAFT version on the default branch | 201 |
| 2 | Publish the version (`PUT status=PUBLISHED`) | 200; **0 DRAFT rows remain** (no continuity draft when unsynced) |
| 3 | `PUT /api/apps/:id` with `{ name, slug, icon, is_public }` | 200 — previously a silent no-op |
| 4a | DB: every non-stub default-branch `version_type='version'` row | carries the new `app_name` / `slug` / `icon` / `is_public` (edit not dropped) |
| 4b | `GET /api/v2/apps/:id/versions/:versionId` | API reads the new `name` / `slug` / `icon` / `isPublic` back off the saved version |
| 5 | Promote dev → staging → production, release, then `GET /api/apps/validate-released-app-access/:newSlug` | 200 → `{ id, slug: newSlug }` (the app's exact failing call now resolves by its new slug) |

**Backend fix** (`src/modules/apps/util.service.ts` → `AppsUtilService.update`, git-off branch): the
draft-scoped `manager.update` now checks its `affected` count; when it's `0` (no draft), it falls back
to updating every non-stub default-branch `version_type='version'` row directly. With no draft present
the reverse `sync_published_app_version_metadata_from_draft` trigger has nothing to pull from, so the
write sticks; and updating all saved rows keeps them consistent — the same invariant the
`propagate_app_version_metadata` trigger maintains when a draft *does* exist. When a draft exists the
original path (write the draft, let the trigger fan out) is unchanged.

Draft count and the persisted metadata are read from the DB (`app_versions`), so the core assertions
are deterministic; the released-slug lookup exercises `findAppBySlug` end-to-end.

---

## 10. Pull skip — whole-pull skip + token storage (`it: stores tree-SHA tokens on pull and skips the whole pull when the remote HEAD is unchanged`)

Dedicated isolated org. Pull is short-circuited at three granularities using git's own tree SHAs as
content hashes (a tree SHA changes iff something beneath it changed):
- **whole pull** — remote branch HEAD (ls-remote) vs `organization_git_sync_branches.last_synced_commit`
- **category** — tree SHA of `apps/` · `modules/` · `data-sources/` vs `*_git_tree_sha` on the branch row
- **per-resource** — tree SHA of `apps/<app>/` · `data-sources/<ds>/` vs `app_versions`/`data_source_versions.git_tree_sha`

The branch-level tokens (`last_synced_commit`, the category `*_git_tree_sha`) are read from git and
stored on **pull**. A version's per-resource `git_tree_sha` is stamped when the version is
**materialized** — a pull that imports a fresh stub, or an app-open hydration — and by **push** (so
just-pushed content reads as in-sync and isn't re-hydrated); a changed-but-unopened app therefore keeps
a null/stale `git_tree_sha` until it's opened, so this test opens the app before asserting its per-app
token. The observable effect of a skip is that the pull's orphan sweep — which DELETES the branch versions
of a synced default-branch app absent from git (apps row kept; data sources are deactivated instead, see
§30) — does NOT run for the skipped scope, so a manufactured synced orphan survives untouched
(`is_synced=true`, row present). The orphan sweep is gated to the DEFAULT branch, so these tests operate on
`main` (content lands via admin `/merge`). This test asserts the tokens get stored on pull and that a second
pull with an unchanged remote HEAD skips the whole pull (the orphan survives); its **control** step clears
the tokens, forcing a full pull that DELETES the orphan app's branch versions.

## 11. Pull skip — category-level skip (`it: skips the datasource category when data-sources/ tree SHA is unchanged despite a moved HEAD`)

Dedicated isolated org. A commit that leaves a category's tree SHA unchanged skips that whole category
even when the whole-pull skip does NOT fire (branch HEAD moved). HEAD is moved via an admin `/files`
write of a top-level file (touches neither `apps/` nor `data-sources/`), so `data-sources/`'s tree SHA
is byte-identical → `pullDataSources` returns early → the datasource orphan sweep is skipped → a
manufactured DS orphan survives. Clearing only the DS token then forces the sweep, isolating the
category skip as the cause; the forced run then DEACTIVATES the orphan DSV (`is_active=false`, see §30).

## 12. Push serialization — no DB internals in pushed files (`it: omits created_at / updated_at / git_tree_sha from pushed app version files`)

Dedicated isolated org. The pull-side tree-SHA skip only works if a resource's serialized bytes are
stable across no-op pushes. DB-internal fields (`created_at` / `updated_at` change on every save, and
`git_tree_sha` is itself the change token) would flip the app's tree SHA on an otherwise-unchanged push
if they leaked into pushed files, so the skip would never fire. This test pushes an app and asserts none
of its committed version files carry those fields.

## 13. Multi-version import respects git sync (`describe: POST /api/v2/resources/import | multi-version import respects git sync`)

Dedicated isolated org (EE). App import via `POST /api/v2/resources/import` chooses how many versions
to create based on whether git sync is enabled for the target workspace.

| # | `it` | Expected |
|---|------|----------|
| 1 | imports ALL versions when git sync is **disabled** | a 3-version export payload imports all 3 versions |
| 2 | imports ONLY the latest version when git sync is **enabled** | the same payload imports exactly 1 version (one-version-per-branch git contract) |

Fix: `setupImportedAppAssociations` keys the "keep only latest" decision off
`gitSyncConfigsUtilService.getDetails().isEnabled`, not off a (always-truthy) resolved `branchId`.

## 14. Pull re-marks resources synced after `is_synced` reset — git disable→enable (`it: restores is_synced=true on the next pull for data source, app and module still in git`)

Dedicated isolated org. Repro of "git disable → re-enable → pull leaves resources unsynced": disabling
git flips `is_synced=false` on every default-branch app/module version + data source version **and**
clears the branch's `last_synced_commit` (so the next pull isn't whole-pull-skipped), without changing
git content or the cached category tree SHAs. On the next pull the category-level skip fires, and the
new reconcile (`reconcileSyncedDataSourceVersions` / `reconcileSyncedAppVersions`) re-marks
`is_synced=true` for every resource still present in git (matched by `co_relation_id`).

Runs on a feature branch (the reconcile is branch-agnostic) and reproduces the disable's effect with
the same writes the git-sync-configs service now performs (flip `is_synced=false` + clear
`last_synced_commit`). Steps: push a DS (workspace) + app + module (gitpush) → pull (stamps SHAs, marks
synced) → flip unsynced + clear the HEAD token → pull again → assert all three back to `is_synced=true`.

## 15. Changing the repo URL resets the default branch sync state (`it: flips is_synced=false and clears last_synced_commit on the default branch when the git URL changes`)

Dedicated isolated org, **single-branch** (so resources live on the default branch, which the reset
targets). Pointing the workspace at a different remote invalidates the local "synced to commit X"
bookkeeping, so `saveProviderConfig` runs the same reset as disabling git: `is_synced=false` on the
default branch's app/module/data-source versions + `last_synced_commit` cleared. Steps: single-branch
git + app/module/DS on the default branch → force a synced baseline (is_synced=true + a commit hash) →
`POST /configs` with a **different `gitUrl`** (GitLab: also a different `gitLabProjectId`) → assert all
flip to `is_synced=false` and the commit hash clears. Fix lives in `BaseGitUtilService.resetDefaultBranchSyncState`,
invoked from the GitHub/GitLab `createGitHttpsConfig` / `createGitLabConfig` on a URL change.

## 16. Feature-branch datasource push does not sync the default branch (`it: leaves the default-branch data source is_synced=false after a scope=datasource push from a feature branch`)

Dedicated isolated org, multi-branch. A DataSource is one org row (shared `co_relation_id`) with a DSV
per branch. `serializeDataSources`' `scope='datasource'` fallback used to look up an unsynced DSV by
`data_source_id` only (no branch), so pushing a feature branch could grab the DEFAULT branch's DSV and
have `pushWorkspace` flip it `is_synced=true`. Steps: create an unsynced DS on the default branch
(git-off) → enable multi-branch → create a feature branch (the unsynced DS gets no feature DSV) →
`scope='datasource'` push from the feature branch → assert the default-branch DSV stays
`is_synced=false`. Fix: the fallback is now branch-scoped.

## 17. Deleted data sources are not committed / are removed on push (`describe: deleted data sources are not committed / are removed on push (regression)`)

Dedicated isolated org, multi-branch. Two related gaps about a data source **deleted** on a branch
(feature-branch delete soft-deletes the DSV `is_active=false`; the `data_sources` row stays):

| # | `it` | Expected |
|---|------|----------|
| 1 | app push does NOT commit a data source deleted on the branch (`serializeLinkedDataSourcesForApp`) | app links a DS via a query, the DS's DSV is soft-deleted, then `gitpush` the (unsynced, front-end) app → the DS file is **absent** from the commit |
| 2 | a `scope=datasource` push REMOVES the file of a DS deleted after being pushed | create DS → push (file present) → delete (soft) → `scope=datasource` push → file **removed** |
| 3 | a `scope=datasource` push removes a DS whose DSV was **hard-deleted** (single-branch delete shape) | create DS → push → **hard-delete the DSV row** (what a single-branch default-branch delete does) → `scope=datasource` push → file **removed** via the orphan sweep |
| 4 | a `scope=datasource` push with **no `onlyUnsynced` flag** (the app-builder default) commits a newly created data source | create DS on a feature branch (multi-branch ⇒ **unsynced**) → `scope=datasource` push **without** `onlyUnsyncedDatasources` → file **present** in git |

Fixes (`ee/git-sync/workspace-git-sync-adapter.ts`):
- `serializeLinkedDataSourcesForApp` DSV lookup now filters `is_active: true` + the app version's
  `branchId` (was `data_source_id` + `isSynced:false` only).
- `serializeDataSources` (`scope='datasource'`, which skips `ensureCleanDir`) now runs an **orphan
  sweep** after serialization: removes any `data-sources/<name>/` git file whose DS has no ACTIVE DSV on
  the branch — covering both soft-delete (inactive DSV) and single-branch hard-delete (absent DSV).
- `serializeDataSources` `scope='datasource'` now applies the `isSynced=false` narrowing **only** when
  `onlyUnsyncedDatasources` is explicitly set; the no-flag case (the app-builder's "push data sources")
  serializes **every active DSV** on the branch instead of synced-only — so a freshly created, still-unsynced
  data source is committed by the default push (case 4) instead of being silently dropped and lost on merge.

Related invariant (`src/modules/data-sources/util.service.ts`): a branch DSV is **unsynced on create in
every mode** — single-branch default included — matching the unsynced-on-create rule for apps/modules, so a
freshly created data source stays pushable. This is what makes cases 2–4 land the new DS in git and keeps
the sync indicator honest.

## 18. Single-branch lifecycle — push/pull apps, modules, data sources (`it: pushes and pulls apps, modules, and data sources directly on the (unprotected) single-branch default`)

Dedicated isolated org. A **genuine** single-branch push/pull lifecycle straight onto the default
branch — made possible by naming the default branch **`single-branch-main`** (not `main`). The
simulator only protects `main`, and its `GET /repos/.../branches/:branch` auto-creates a missing branch
on the `test-connection` existence check, so configuring git with `branchName: 'single-branch-main'`
yields an unprotected default branch that accepts direct pushes.

| # | Step | Expected |
|---|------|----------|
| 1 | Reset; `POST /configs` with `branchName: 'single-branch-main'`; disable branching (single-branch); pull the default branch | 201/200 |
| 2 | Create an **app** (+ a Button component), a **module**, and a **data source** on the default branch | 201 |
| 3 | `gitpush` the app, `gitpush` the module, workspace-push the data source — all **directly to the default branch** | **201** (push to the unprotected default succeeds — the whole point) |
| 4 | Clone the default branch | `apps/` non-empty, `modules/` non-empty, and the data source's `data-sources/<name>/data-source.json` present |
| 5 | Pull the default branch (round-trip) | 201; the data source's DSV is `is_synced=true` |
| 6 | Delete the data source (single-branch default → **hard-delete** DSV), then push | 201; the DS file is **removed** from git (orphan sweep); `apps/` + `modules/` remain |

This is the only place the single-branch git transport is exercised end-to-end (steps 81–83 in §2 stay
on the protected `main` and assert at the app/authorization layer only). App/module presence is checked
as "directory non-empty" (folder names aren't fixed); the data source is checked at its deterministic
path. **Mirrored in `git-sync-gitlab.spec.ts`** (uses `GITLAB_PAYLOAD` with the same `branchName`).

## 19. Hydration marks an app's connected data source synced (`it: an app pulled from git and hydrated has its connected data source is_synced=true on the default branch`)

Dedicated isolated org, multi-branch. When an app is pulled from git it lands as a **stub**; opening it
runs `hydrateStubApp`, which pulls in the app's connected resources — `deserializeWorkspaceResources`
for connected global **data sources** and `hydrateReferencedModuleStubs` for connected **modules**.
Resources brought in from git this way must be `is_synced=true`.

| # | Step | Expected |
|---|------|----------|
| 1 | Configure git + branching, pull `main`, create a feature branch | 201/200 |
| 2 | Create app + component; create a global data source; **link the DS to the app via a query** (so the app push carries the DS, `serializeLinkedDataSourcesForApp`) | 201 |
| 3 | `gitpush` the (unsynced, front-end) app — its linked data source rides into the commit | 201 |
| 4 | Merge feature → `main`, pull `main` | 201; the app lands as a **stub** on `main` |
| 5 | Hydrate the app: `GET /apps/:id` on `main` | `hydration_status: 'success'` |
| 6 | The connected data source's DSV on the default branch | **`is_synced=true`** |

Covers the connected **data source** on hydrate. The connected **module** cascade is covered by §20.
**Mirrored in `git-sync-gitlab.spec.ts`.**

## 20. Hydration cascade marks a referenced module synced (`it: opening a host app cascade-hydrates its referenced module and marks the module is_synced=true`)

Dedicated isolated org, multi-branch. A host app references a module via a **ModuleViewer**
(`properties.moduleAppId.value` = the module's `co_relation_id`). Both are pushed and merged to `main`;
pulling `main` lands BOTH as **stubs**. Opening the host app cascade-hydrates the referenced module
(`hydrateReferencedModuleStubs` → `hydrateStubApp` on the module), and the module's materialized version
must be `is_synced=true`.

| # | Step | Expected |
|---|------|----------|
| 1 | Configure git + branching, pull `main`, create a feature branch | 201/200 |
| 2 | Create a **module** + a **host app**; wire a **ModuleViewer** on the host referencing the module's `co_relation_id` | 201 |
| 3 | `gitpush` the module and the host app | 201 |
| 4 | Merge feature → `main`, pull `main` | both land as **stubs** (`is_stub: true`) |
| 5 | Hydrate the **host** app (`GET /apps/:id`) | `hydration_status: 'success'`; a direct `GET` on the module then reports `not_hydrated_reason: 'already-up-to-date'` (cascade materialized it) |
| 6 | The referenced module's non-stub version on the default branch | **`is_synced=true`** (host app's too) |

This is the DB-level assertion that §2 step 54 (which checks the cascade via the API) does not make.
**Mirrored in `git-sync-gitlab.spec.ts`.**

---

## 22. Per-app import from git — createGitApp (`it: imports an app pushed to git into a separate workspace via /app-git/gitpull/app`)

Covers the legacy **per-app import** flow (`POST /api/app-git/gitpull/app` → `AppGitOperationsUtil.createGitApp`),
which is distinct from the workspace-wide pull (that uses `PlatformGitPullService`). Uses TWO workspaces
sharing one repo: SRC pushes an app; a separate DST workspace imports it by name. Exercises `createGitApp`
end-to-end (clone the app folder → resolve name → read app JSON → deserialize resources → create the app +
a non-stub version → folder assignment).

| # | Step | Expected |
|---|------|----------|
| 1 | Reset repo; **SRC** workspace configures git (default branch `single-branch-main`, single-branch), creates an app + Button component, `gitpush`es it | 201 |
| 2 | **DST** workspace (separate org, same repo) configures git | 201 |
| 3 | `POST /api/app-git/gitpull/app` `{ gitAppName, gitBranchName: single-branch-main, workspaceBranchId: <dst default> }` | 200/201 (createGitApp runs) |
| 4 | The previously-empty DST org now owns the imported app with a non-stub version | app row `organization_id = DST`; ≥1 `app_versions` with `is_stub = false` |

Two workspaces are required because `createGitApp` rejects importing an app that already exists in the
target workspace (matched by `co_relation_id`/slug). Asserts on ownership/version existence rather than
`apps.name` (the display name lives on the version row, not `apps.name`).
**Mirrored in `git-sync-gitlab.spec.ts`** (exercises the GitLab provider's `createGitApp` path).

---

## 23. Per-app TAG import — createGitApp tag path (`it: imports a published tag version into a separate workspace`)

The tag-import branch of `createGitApp`: when the body carries `commitHash` + `gitVersionName`, it routes to
`importTagVersion` → `importTagOnDefaultBranch` (`bootstrapDefaultBranchVersionFromMain` +
`appendPublishedSnapshotFromTag`). SRC publishes a version and creates its git tag; a separate DST workspace
imports that exact tagged commit.

| # | Step | Expected |
|---|------|----------|
| 1 | Reset repo; SRC configures git, pushes an app to `single-branch-main`, PUBLISHes `v1` (the save auto-creates the git tag server-side) | git tag `<co_relation_id>/v1` created |
| 1b | Resolve the tag's commit SHA in-test (clone + `git fetch refs/tags/*` + `rev-parse <tag>^{commit}`) | 40-hex SHA |
| 2 | **DST** (separate org, same repo) configures git, then `POST /api/app-git/gitpull/app` `{ gitAppId: <src co_rel>, gitAppName, gitVersionName: 'v1', commitHash: <sha>, gitBranchName, workspaceBranchId: <dst default> }` | 200/201 (importTagVersion runs) |
| 3 | DST gained a NEW app carrying a non-stub (published) version | new `apps` row for DST + ≥1 non-stub `app_versions` |

`workspaceBranchId` is required for tag imports (guarded in `importTagVersion`); a default-branch target routes
to `importTagOnDefaultBranch`. **Mirrored in `git-sync-gitlab.spec.ts`.**

---

## 24. Saving a version creates a git tag — backend-owned (`describe: saving a version creates a git tag`)

Covers "on save/publish a version → a git tag is created on the remote", for **both branching modes**
plus the **git-off** negative. Tagging is **owned by the app-git save endpoint**:
`PUT /api/app-git/:id/versions/:versionId` with `status=PUBLISHED` performs the DB save AND creates the
tag in one server-side call (`ee/app-git/services/versions.service.ts → AppGitVersionService.saveVersion`,
which calls `VersionService.update` then `createGitTag` after the DB commit). This lives in the app-git
module (not versions) so it can depend on both without a cycle — replacing the old
versions→app-git `moduleRef.get(AppGitService)` hack. Permissions are identical to the versions endpoint
(`MODULES.VERSION` + `FEATURE_KEY.APP_VERSION_UPDATE` + `JwtAuthGuard`+`ValidAppGuard`+`FeatureAbilityGuard`).
There is **no separate tag call** — the standalone `POST …/tag` endpoint was removed. Non-git workspaces
(incl. CE) keep using the versions endpoint `PUT /api/v2/apps/:id/versions/:versionId` (no tag). Tag name =
`buildTagName(co_relation_id, versionName)` = `<coRelId>/<versionName>`, at the default branch HEAD. Gating:
git **configured + enabled**, version **synced**, not a workflow, not a branch-draft row. Idempotent
("already exists" → success). The sibling **DELETE /api/app-git/:id/versions/:versionId** likewise deletes
the version + its git tag in one call.

| # | Case (`it`) | Flow | Asserts |
|---|---|---|---|
| 1 | **single-branch** (`isBranchingEnabled=false`) | config (default `single-branch-main`), create app on the unprotected default, gitpush, **publish `v1` via `PUT /api/app-git/:id/versions/:versionId`** | after the save alone: `check-tag` → `exists:true`, `tagName === <coRel>/v1` (matches `<uuid>/v1`), and a clone resolves `refs/tags/<coRel>/v1` to a 40-hex SHA |
| 2 | **multi-branch** (`isBranchingEnabled=true`) | default is edit-locked → create app on a **feature branch**, gitpush, admin-`/merge` feature→default, pull default, hydrate, **publish `v1` via app-git** | same tag assertions as #1 (auto-created by the publish) |
| 3 | **git off** (never configured) | create app, publish `v1` locally via the **versions** endpoint | version stays `is_synced=false` — no git, no tag |

Tag creation is now a **side-effect of the publish**, verified by check-tag `exists:true` + a physical clone
resolving the ref (no explicit tag call). Since the standalone endpoint is gone, single-branch tags via the
same save path (the gate is git-enabled, not multi-branch-only).
**Mirrored in `git-sync-gitlab.spec.ts`** (exercises the GitLab provider's `createGitTag` / `checkTagExists`).

## 25. Per-app import — slug collision swaps to a fresh UUID (`it: imports an app whose slug is already taken by another workspace → slug swapped to a fresh UUID (no conflict)`)

Lives in the `per-app import from git (createGitApp)` describe (alongside §22/§23). Unlike the workspace
pull (§6), the per-app import (`POST /api/app-git/gitpull/app` → `createGitApp`) has **no slug pre-flight**.
But slug uniqueness is **instance-wide** (`enforce_app_versions_*_slug_unique`, no org scope), so importing an
app whose slug is already owned by another workspace on the same repo must **swap the slug to a fresh UUID and
still succeed** — never a 409/500. Uses fresh, isolated SRC/DST orgs so the §22/§23 imports don't pollute it.

| # | Step | Expected |
|---|------|----------|
| 1 | Reset repo; **SRC** configures git (`single-branch-main`), creates + `gitpush`es `slug-clash-app`; read the slug it wrote to git (`srcSlug`) | 201 |
| 2 | **DST** (separate org, same repo) configures git, then `POST /api/app-git/gitpull/app` `{ gitAppName, gitBranchName, workspaceBranchId }` (**no `gitAppId`** → skips the "already exists" guard) | **200/201** — a taken slug must NOT fail the import |
| 3 | DST's imported non-stub version slug | **≠ `srcSlug`** and matches the UUID pattern (swapped to a fresh placeholder for later rename) |

The slug collision is caught at the instance-wide resolver (`app-import-export.service.ts` /
`app-git-operations.util.ts`), not a pre-flight — so this asserts the **silent-UUID** behavior that
distinguishes app-level pull from workspace pull. **Mirrored in `git-sync-gitlab.spec.ts`** (`GITLAB_PAYLOAD`).

## 26. Branch create — slug conflict pre-check (`it: surfaces a 409 slug conflict when the source branch has two apps sharing a slug`)

Dedicated isolated org. `createBranch` runs a **synchronous** conflict pre-check
(`preCheckCreateBranchConflicts` → `detectPullConflicts(branchId=null)` → intra-incoming collisions) and
re-throws a **409** so the frontend modal opens. This drives the same slug guard as the workspace pull (§6)
through the **branch-create entry point** — a gap §6 (workspace pull) and §22/§23 (per-app import) didn't cover.

| # | Step | Expected |
|---|------|----------|
| 1 | Reset repo; configure git (multi-branch) so `main` exists on the remote | 201 |
| 2 | Inject **two** apps onto `main` via the admin `/files` endpoint — **different names + co_relation_ids, SAME slug** (different names so a name conflict doesn't mask the slug one) | — |
| 3 | `POST /api/workspace-branches { name }` (branch off `main`) → the sync pre-check clones `main` and detects the shared slug | **409**; `conflictGroups` has a `{ type: 'app', conflictField: 'slug' }` group listing **both** injected co_relation_ids |
| 4 | Neutralize the injected files (`{}`) in `finally` | repo left clean for later specs |

**Mirrored in `git-sync-gitlab.spec.ts`** (`GITLAB_PAYLOAD`).

## 27. Cross-branch app push carries connected data sources + modules (`describe: cross-branch app push carries connected data sources and modules (regression)`)

Dedicated isolated org, multi-branch. Pushing an app to a feature branch must carry its dependencies,
and opening the app fresh on that branch must re-hydrate them from git.

| # | `it` | Expected |
|---|------|----------|
| 1 | carries a connected global data source into the feature branch on app push, and re-hydrates it on open | create app + global DS on a feature branch, link the DS via a query, `gitpush` the app → `data-sources/<name>/data-source.json` is committed (id = DS `co_relation_id`); then delete the branch DSV + force a re-hydrate (`GET /apps/:id` with a bogus `git_tree_sha`) → the branch DSV is **re-created from git** (`deserializeWorkspaceResources`), not left as an "Undefined data source" dummy |
| 2 | carries a referenced module into the feature branch on app push, and re-creates its stub from git on host open | push a module + a host app with a `ModuleViewer` referencing it → the module is present under `modules/`; then hard-delete the module's DB rows + force a host re-hydrate → the module stub is **re-created from git** and appears in the host's `modules` (exercises `hydrateStubApp` sparse-checking out `modules/` for a front-end app) |

Fixes: `hydrateStubApp` (`ee/platform-git-sync/pull.service.ts`) now `sparse-checkout add modules` for a
front-end app so `hydrateReferencedModuleStubs → pullModules(repoPath)` can stub a referenced module that
has no App row yet; `serializeLinkedDataSourcesForApp` (`ee/git-sync/workspace-git-sync-adapter.ts`) now
serializes a linked DS when it's missing on the target branch (resolving the app-branch DSV, else the
default-branch active DSV) regardless of `is_synced`, so an already-synced app's cross-branch push is
self-contained. **Mirrored in `git-sync-gitlab.spec.ts`** (`GITLAB_PAYLOAD`).

## 28. Slug update — git-sync branch rules (`describe: slug update — git-sync branch rules (regression)`)

Dedicated isolated org. Exercises the git-enabled slug-update gates in `AppsService.update` /
`AppsUtilService.update` (uniqueness is instance-wide, per `apps.type`, case-insensitive — enforced by
the `app_versions` slug triggers).

| # | `it` | Expected |
|---|------|----------|
| 1 | single-branch: allows a slug edit on the default (working) branch | git single-branch; create app on the default branch; `PUT /apps/:id { slug }` → **200**; the version's slug is updated |
| 2 | multi-branch: blocks a slug edit targeting the default branch | git multi-branch; create app on a feature branch; `PUT /apps/:id { slug, branch_id: <default> }` → **400** ("… feature branch …") |
| 3 | multi-branch: allows a slug edit on a feature branch and persists it | `PUT /apps/:id { slug, branch_id: <feature> }` → **200**; the feature-branch version's slug is updated |
| 4 | multi-branch: rejects a feature-branch slug already taken by another app of the same type | app1 takes a slug on the feature branch, app2 tries the same on the same branch → **400** ("… already taken") |

Git-**off** slug rules (uniqueness reject, case-insensitivity, app↔module namespace, delete-frees-slug) are a
separate host-free spec: `test/modules/apps/e2e/slug-update.e2e-spec.ts`. **Mirrored in
`git-sync-gitlab.spec.ts`** (`GITLAB_PAYLOAD`).

## 29. `is_synced` lifecycle invariant (`describe: is_synced lifecycle invariant (in git ⇔ is_synced=true)`)

The single invariant the sync indicator is derived from: **a resource is `is_synced=true` iff it currently
exists in git** (i.e. it was pushed). `is_synced` tracks git *presence*, not byte-for-byte content parity, so a
local edit of a synced resource does **not** flip it — there is deliberately no flip-on-edit hook. Each `it`
uses a FRESH isolated org (config mode differs per case) and, for git-on cases, resets the shared repo +
configures git inside the test (mirrors §14/§18). `is_synced` is read straight from the DB
(`app_versions.is_synced` / `data_source_versions.is_synced`). **Mirrored in `git-sync-gitlab.spec.ts`**
(`GITLAB_PAYLOAD`, `-gl` emails).

| # | `it` | Expected | Status |
|---|------|----------|--------|
| 1 | git-off: created app + module + data source | all `is_synced=false` (nothing is in git) | GREEN |
| 2 | multi-branch: feature-branch resource unsynced on create, synced after `gitpush`, still synced after merge→main + pull | `false` → `true` → `true` | GREEN |
| 3 | single-branch: resource unsynced on create, synced after a direct push to the (unprotected `single-branch-main`) default | `false` → `true` | GREEN |
| 4 | single-branch: **editing** a synced resource does NOT flip `is_synced` (stays `true`) — `is_synced` tracks git presence, not local divergence | edit → still `true` | GREEN |
| 5 | a synced app carries its connected data source (linked via a query) + referenced module (via a ModuleViewer) into git on push; a pull then reconciles the linked DSV synced | host version, linked DSV, and module version all `is_synced=true` | GREEN |

Reuses: §18 single-branch config + `gitpush` + component-add; §14 reconcile-on-pull; the ModuleViewer
`moduleAppId = <module co_relation_id>` reference and the query-linking pattern from §19/§27.

## 30. Delete-on-pull + `in_use` conflict guard (`describe: pull deletes synced resources removed from git (with in_use guard)`)

**Implemented behavior.** A synced default-branch resource that is absent from git (removed via a merge to the
default branch) is reconciled on the next pull, gated to `is_synced=true` rows — unsynced local work is kept.
The **delete shape differs by resource type**, matching the code:
- **App / module** — the branch's `AppVersion` rows are **deleted** (children cascade); the parent `apps`
  row is **kept** (`removeOrphanedResources`, `pull.service.ts` — "The App row itself is never deleted").
- **Data source** — the branch DSV is **deactivated** (`is_active=false`, row kept; `is_synced` untouched)
  by the `deserializeDataSources` orphan sweep in `workspace-git-sync-adapter.ts`.
- If the resource is still **referenced/connected** by another app/module, the whole pull **aborts with a
  409 `in_use`** (`GitConflictDetectionService.detectPullConflicts` → `collect*InUseConflicts`) and nothing
  is reconciled.

Orphans are manufactured with the §61 SQL technique (create on a feature branch, move the version/DSV onto the
default branch as `is_synced=true` + a fake `git_tree_sha`, clear the branch pull-skip tokens) so the resource
is a synced default-branch row absent from git's (empty, post-reset) meta. FRESH org per `it`. **Mirrored in
`git-sync-gitlab.spec.ts`** (`GITLAB_PAYLOAD`, `-gl` emails).

| # | `it` | Expected | Status |
|---|------|----------|--------|
| 1 | a synced app removed from git → pull `main` | branch `app_versions` **deleted**; `apps` row **kept** | GREEN |
| 2 | a synced module removed from git → pull | module branch versions **deleted** (apps row kept). (DS orphan **deactivation** is covered by §11 — the deserialize sweep needs a real `data-sources/` tree in git, which an empty-repo manufacture doesn't provide.) | GREEN |
| 3 | an unsynced (never-pushed) local resource absent from git → pull | **kept**; still `is_synced=false` (reconcile applies only to `is_synced=true`) | GREEN |
| 4 | a synced module removed from git but still referenced by another app's ModuleViewer → pull | **409**; `conflictGroups` contains `{ type: 'module', label: 'Module in use', conflictField: 'in_use' }`; nothing reconciled | GREEN |
| 5 | a synced data source removed from git but still connected to an app via a query → pull | **409**; `conflictGroups` contains `{ type: 'datasource', label: 'Data source in use', conflictField: 'in_use' }` | GREEN |
| 6 | after deleting the referencing app, clear tokens, re-pull | first pull **409** (module version survives); re-pull **201** and the module's branch versions are **deleted** | GREEN |

The `in_use` reference is wired the way the guard reads it: a ModuleViewer whose
`properties.moduleAppId.value` is the orphan module's `co_relation_id` (matching
`src/modules/data-queries/repository.ts:75` and `git-conflict-detection.service.ts` `findModulesInUse`), and a
data query whose `data_source_id` points at the orphan data source (`findDataSourcesInUse`). The consumer app
is kept as an unsynced local row on `main` so it survives the pull and its reference stays live.

> **Updated §61–63 + §10/§11 to this behavior.** Those steps previously asserted the *old* "orphan marked
> `is_synced=false`, not deleted" behavior and were stale against the committed delete/deactivate code. They
> now assert the shape above: §61/§62 (app/module orphan) → branch versions deleted, apps row kept; §63 (data
> source orphan) → DSV deactivated (`is_active=false`, row kept). The pull-skip specs keep their skip coverage
> and only their *control* step (the forced full/category pull) was updated — §10 → orphan app deleted, §11 →
> orphan DSV deactivated.

## 21. Inbound webhooks → auto-sync (`test/modules/git-sync-webhooks/`)

The inbound webhook feature (`POST /api/v2/git-sync/webhooks/:provider/:organizationId` → verify
signature → dedupe → route event → BullMQ enqueue → worker → auto-sync pull) is covered by fast unit
specs for the services plus a worker-level integration test — no git simulator needed.

**Unit** (`git-sync-webhooks/unit/`, run under the unit config, host-free):
- `webhook-signature.spec.ts` — GitHub HMAC-SHA256 verify (valid/invalid/length-mismatch), GitLab token compare, old-secret rotation via Redis.
- `webhook-deduplication.spec.ts` — SETNX first-vs-duplicate, org-scoped keys.
- `webhook-skip-flag.spec.ts` — `setSkipFlag` (TTL + operation value) and `checkAndClear` (atomic GETDEL via Lua).
- `git-sync-webhook.service.spec.ts` — the pure payload-summary / branch-extraction helpers (github push/PR/delete + gitlab).

**Worker integration** (`git-sync-webhooks/e2e/webhook-worker.spec.ts`): the worker is NOT in the e2e
DI (gated by `isMainImport && !IS_GET_CONTEXT`), so it's constructed manually with fakes (Redis,
skip-flag, `WorkspaceBranchService`, notifications) and `process(job)` is driven directly against the
test DB (`OrganizationGitSync` + `WorkspaceBranch` fixtures). `pullWorkspace` is a spy — **no git host
required**. Cases (decision tree of the 585-line `process`):

| # | Job | Expected |
|---|-----|----------|
| 1 | `pull_request` merged into the **default** branch | `pullWorkspace(org, null, 'main', <id>, { source: 'auto-sync' })`; `action: pulled`, `trigger: pr_merged` |
| 2 | `pull_request` opened (not merged) | `ignored`, no pull |
| 3 | `pull_request` merged into a **non-default** branch | `skipped`, no pull |
| 4 | `push` to a branch | `branch_push_skipped`, no pull (only PR merges + tags sync) |
| 5 | `pull_request` with a **self-trigger** skip-flag set | `self_triggered`, no pull |
| 6 | `pull_request` when the event is **disabled** at processing time | `event_disabled_at_processing`, no pull |
| 7 | `delete` on a feature branch | `deleteWorkspaceBranch(org, <id>)`; `action: deleted` |
| 8 | tag push (`refs/tags/<coRelId>/v1`) for an **unknown** app | `skipped`, no `pullTagVersion` |

**Controller endpoint** (`git-sync-webhooks/e2e/webhook-endpoint.spec.ts`): drives the HTTP endpoint
through the full Nest app (supertest) using the **GitLab** provider on purpose — GitLab verification is a
plain `X-Gitlab-Token` compare, so it does not need the `rawBodyBuffer` json hook that the e2e harness
(`configureApp`) leaves out (GitHub HMAC would throw on an undefined rawBody). Seeds an
`OrganizationGitSync` (`webhookEnabled`, known `webhookSecret`, `webhookEvents`); needs the DB **and Redis**
(dedupe SETNX + BullMQ enqueue) but no git host. The worker isn't in the e2e DI, so the enqueued job never
drains — it asserts the controller's own decisions + the recorded `git_sync_webhook_events` row:

| # | Request | Expected |
|---|---------|----------|
| 1 | unknown org (no `OrganizationGitSync`) | `403` (webhooks not enabled) |
| 2 | wrong `X-Gitlab-Token` | `401` (invalid signature) |
| 3 | valid token, `Push Hook`, enabled event | `202 { status: accepted, deliveryId, jobId: <deliveryId>_<org> }`; a `git_sync_webhook_events` row with `status=queued`, `event_type=push`, `branch_name=main` |
| 4 | same `x-gitlab-event-uuid` re-sent | `202 { status: duplicate, deliveryId }` |
| 5 | `Merge Request Hook` (→ `pull_request`) while `webhookEvents=['push']` | `202 { status: ignored, reason: event_not_enabled, event: pull_request }` |

Run: part of `npm run test:gitsync` (unit + e2e). The e2e webhook specs need the DB (and, for the
endpoint spec, Redis) but not the simulator, so
`npm run test:e2e -- --testPathPatterns 'git-sync-webhooks/e2e'` runs them standalone.

---

## 31. External API save/release against a real git host (`test/modules/external-apis/e2e/save-release-gitsync.e2e-spec.ts`)

The External API analog of §24, plus the "auto-release" path §24 doesn't cover. Every other External
API spec (`save-version.e2e-spec.ts`, `promote-to-next-version.e2e-spec.ts`, `auto-deploy.e2e-spec.ts`)
stubs `SourceControlProviderService` at the boundary — correct for pinning the DB-side publish/promote
logic deterministically, but it means the actual GitHub App auth → Octokit tag-creation → tag-lookup
wiring behind `saveAppVersion` and `autoDeployApp`'s "latest tag" auto mode had never run against a
real host. This file closes that gap.

Self-guards like `git-sync-gitlab.spec.ts` (`describe.skip` at runtime when the simulator env is
absent — see the note at the top of this doc) rather than throwing at import like `git-sync.spec.ts`,
so a plain `npm run test:e2e` stays green without the simulator configured. Own repo path — the
GitHub suite's `TEST_GIT_REPO_PATH` (or its `gsmithun4/e2e` fallback) with a `-ext-api` suffix — so it
can't collide with `git-sync.spec.ts`'s shared, stateful fixture.

| # | Step | Expected |
|---|------|----------|
| 1 | Reset the `-ext-api` repo; configure git + enable branching; load `main` | 201/200 |
| 2 | Create a feature branch, create an app on it, `gitpush` it | 201 |
| 3 | Admin-`/merge` feature → `main`; pull `main` (lands as a stub); hydrate via `GET /apps/:id` | 200 |
| 4 | **External API**: `POST /ext/apps/:id/versions/save` `{ name: 'v1' }` | 201; `status: PUBLISHED` — and a REAL tag now exists on the simulator (no mock) |
| 5 | **External API**: `POST /ext/apps/:id/git-sync/release` with an EMPTY body (auto mode) | 201; `currentVersionId` matches the version saved in step 4 |

Step 5 is the actual assertion for step 4's tag: `autoDeployApp`'s auto mode calls
`getLatestTagNameForApp` → a real Octokit `listTags` call against the simulator. A broken
tag-creation or tag-lookup wiring surfaces as a `BadRequestException` (`No git tags found` / `Latest
tag not found after pull`) — asserting `201` here **is** the assertion that Octokit found the tag
`saveAppVersion` created. `currentVersionId` on top of that rules out the release resolving to some
other row.

Not mirrored in `git-sync-gitlab.spec.ts` — the External API's `SourceControlProviderService` wiring
is provider-agnostic at the DB layer (already covered by the mocked specs); this file exists
specifically to exercise the GitHub-App-auth → Octokit path once for real, not to re-prove
provider-parity.

---

## 32. App commit cascades all connected resources — single-branch (`describe: app commit cascades all connected resources (single-branch)`)

Dedicated isolated org, **single-branch** (default branch `single-branch-main`, unprotected on the
simulator, `isBranchingEnabled=false`). Verifies that committing an app carries its **entire connected
resource graph** into git in ONE push — including a data source used **only inside a connected module**
(the EE #794 cascade). Graph under test:

```
app A ──(query)──▶ data source dsA
app A ──(ModuleViewer)──▶ module M ──(query)──▶ data source dsB   (dsB linked ONLY inside M)
```

| # | Step | Expected |
|---|------|----------|
| 1 | Reset repo; configure git (default `single-branch-main`), disable branching, pull the default branch | 201/200 |
| 2 | Create app A + module M + dsA (query on A) + dsB (query on M); wire A's `ModuleViewer` to M's `co_relation_id` | 201 |
| 3 | `gitpush` app A **once** to the (unprotected) default branch | 201 |
| 4 | Clone the default branch | `apps/**/app/app.json` has A's `co_relation_id`; `modules/**/app/app.json` has M's; `data-sources/<dsA>/data-source.json` id = dsA `co_relation_id`; **`data-sources/<dsB>/data-source.json` id = dsB `co_relation_id`** (the module-only DS rode into A's push) |
| 5 | Pull the default branch (round-trip) | app A version, module M version, dsA DSV **and** dsB DSV all `is_synced=true` |

Step 4's dsB assertion is the crux: dsB is linked only via a query on module M's version, so it reaches
git purely through the cascade `writeReferencedModules → serializeLinkedDataSourcesForApp(M.version)`
(`ee/app-git/shared/app-git-file-operations.util.ts`, EE #794). Before that fix M's committed JSON kept
only a dangling `dataSourceId` reference to dsB. Step 5 confirms the pull reconcile marks the whole graph
synced (mirrors §14/§18). No separate workspace/data-source push — the single app `gitpush` carries
everything. **Mirrored in `git-sync-gitlab.spec.ts`** (`GITLAB_PAYLOAD`, `-gl` emails).

**Second `it` — `blocks the commit when the connected module has multiple draft versions`:** the
single-branch counterpart of the §27 (multi-branch) multidraft guard — nothing else covers single-branch.
A connected module is bootstrapped into the app's commit from its ONE default-branch draft; give the
module a second default-branch draft (raw `INSERT` copying a version row) and the app `gitpush` must
fail **400 MODULES_NOT_READY** with a message naming the module (`/not ready to sync/i` +
`toContain('cc-multidraft-module')`) rather than silently committing an arbitrary draft.

## 33. App sync cascades all connected resources onto the feature branch — multi-branch (`describe: app sync cascades all connected resources onto the feature branch (multi-branch)`)

Dedicated isolated org, **multi-branch** (`isBranchingEnabled=true`). The multi-branch counterpart of §32:
the same graph (app A → dsA + module M; module M → dsB), synced to a feature branch, must **add every
connected resource to that branch** in one push.

| # | Step | Expected |
|---|------|----------|
| 1 | Configure git, enable branching, pull `main`, create feature branch `feat-sync-cascade` | 201/200 |
| 2 | On the feature branch: create app A + module M + dsA (query on A) + dsB (query on M); wire A's `ModuleViewer` to M | 201 |
| 3 | `gitpush` app A **once** to the feature branch | 201 |
| 4 | Clone the feature branch | A present under `apps/` (by `co_relation_id`); M under `modules/`; `data-sources/<dsA>/…` id = dsA `co_relation_id`; **`data-sources/<dsB>/…` id = dsB `co_relation_id`** |
| 5 | The pushed app version on the feature branch | `is_synced=true` (BRANCH-type push marks the pushed version; `ee/app-git/shared/app-git-operations.util.ts`) |

Complements §27 (which covers "app push carries a connected DS" and "app push carries a referenced
module" separately) by exercising the **full nested graph** — A + dsA + M + M-only dsB — in a single push.
The dsB assertion again pins the EE #794 cascade. **Mirrored in `git-sync-gitlab.spec.ts`**
(`GITLAB_PAYLOAD`, `-gl` emails).

**Second `it` — `blocks the sync when the connected module has multiple draft versions`:** the
multi-branch multidraft guard inside this cascade suite. The module lives on the feature branch, but the
readiness check counts drafts on the DEFAULT branch (`getConnectedModulesBlockingPush`), so TWO extra
default-branch drafts are injected there; the host-app `gitpush` then fails **400 MODULES_NOT_READY**
naming the module (`/not ready to sync/i` + `toContain('sc-multidraft-module')`).

---

## Test-only license control

The real License path (`ee/licensing/configs/License.ts`) always decrypts its key — no test-only branch. In
tests, the license terms are injected by spying on `LicenseDecryptService.prototype.decrypt` (see `setTestLicenseTerms`),
so `License.ts` gets test terms without any test hatch in production code.
In e2e tests (which mock `LicenseTermsService`), use the helpers from `test-helper`:

- `setTestLicenseTerms(app, terms, { expired })` — override the license at runtime (no restart)
- `restoreLicensePlan(app, plan = 'enterprise')` — revert

---

## GitLab e2e (`git-sync-gitlab.spec.ts`)

Runs against the **same git-http-simulator** as the GitHub suite (its `/api/v4` router + `oauth2:<token>`
git transport). One host, both providers. Covers: config save + connect (test-connection hits the
simulator's `/api/v4`), a create → feature-branch → gitpush → merge → pull lifecycle, save-version
(check-tag → publish → tag via `/api/v4/.../tags`), and remote-branch listing. Reuses the shared,
provider-agnostic admin endpoints (`/admin/repos/:o/:r.git/reset`, `/admin/merge`).

### Simulator side (repo is NOT public)

Start the simulator with a GitLab token so `/api/v4` + git require it:

```bash
EXPECTED_GITLAB_TOKEN=glpat-e2e-secret \
GIT_TRUST_WINDOW_SECONDS=0 \        # strict: git must carry oauth2:<token> (recommended for CI)
PORT=3002 node server.js
```

(Or put `"gitlabToken": "glpat-e2e-secret"` in `auth.json`. With `EXPECTED_GITLAB_TOKEN` set, anonymous
`/api/v4` → 401 and anonymous clone is rejected; only the matching PAT works. The GitHub `EXPECTED_*`
knobs are independent — set only the GitLab token for a GitLab-only locked simulator.)

### ToolJet test env

| Env var | Value | Notes |
|---|---|---|
| `TEST_GIT_BASE_URL` | `http://localhost:3002` | The simulator host (shared with the GitHub suite) |
| `TEST_GITLAB_TOKEN` | `glpat-e2e-secret` | **Must equal the simulator's `EXPECTED_GITLAB_TOKEN`** |
| `TEST_GITLAB_REPO_PATH` | per-run `run-ci/<uuid>-gitlab` (see below); static `gsmithun4/gitlab-e2e` fallback | Distinct repo from the GitHub suite; becomes `gitLabProjectId` |
| `TEST_GITLAB_BRANCH` | `main` (default) | Default branch |
| `TOOLJET_GIT_ADMIN_USER` / `TOOLJET_GIT_ADMIN_PASSWORD` | admin creds | Shared — for the `/admin/reset` + `/admin/merge` endpoints |

The config payload the suite sends: `{ gitType: 'gitlab', gitUrl: <base>/<repo>, branchName,
gitLabEnterpriseUrl: <base>, gitLabProjectId: <owner>/<repo>, gitLabProjectAccessToken: <token> }`.
`gitLabProjectId = owner/repo` (the provider URL-encodes it → `owner%2Frepo`, which the simulator
resolves to `repos/owner/repo.git`), and `gitLabEnterpriseUrl = <base>` makes the API base
`<base>/api/v4`.

```bash
npm run test:e2e -- --testPathPatterns "git-sync-gitlab"
```
