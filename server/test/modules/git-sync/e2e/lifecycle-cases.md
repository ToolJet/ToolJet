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
| Save v1 | Publish the app version (`PUT status=PUBLISHED`, name `v1`) | v1 has `[comp_A]` / `[query_A]` |
| New draft | Create draft from `v1` (`replace:false`) → `d2` | `d2` is a clean copy of v1 (`[comp_A]` / `[query_A]`); it's the editing version |
| Edit draft | Add `comp_B` + `query_B` to `d2` | `d2` = `[comp_A, comp_B]` / `[query_A, query_B]` |
| Stamp staleness | Set `remote_updated_at` + `pulled_at` to `now()` on both `d2` (draft being replaced) and `v1` (source version) | — |
| **Patch (replace)** | Create draft from `v1` (`replace:true`) → `d3` | `d2` is **deleted**; `d3` is a clean copy of v1 (`[comp_A]` / `[query_A]`) — the uncommitted `comp_B`/`query_B` are **discarded**; `d3` is the editing version; `d3.remote_updated_at` and `d3.pulled_at` are **NULL** (never-pulled) so a later `pull latest` refreshes it instead of skipping |
| Save v2 | Add `comp_C` + `query_C` to `d3`, publish as `v2` | `v2` = `[comp_A, comp_C]` |
| **Patch from first version** | Create draft from `v1` again (`replace:true`) → `d4` | `d4` mirrors **v1** (`[comp_A]` / `[query_A]`), **not** v2 (no `comp_C`/`query_C`); `d4` is the editing version |

Component/query assertions read the DB keyed by the version id resolved from `GET /apps/:id`
(`editing_version`), so they're deterministic. Backend: `replaceDraftVersion` deletes the existing
default-branch draft and clones the chosen published version in one transaction, preserving the
replaced draft's sync state. It also forces the new draft's `remote_updated_at` / `pulled_at` to
`NULL` — the pull staleness logic skips a draft whose `pulled_at >= remote commit` and only
lazy-hydrates when `remote_updated_at` is set and newer than `pulled_at`, so a patched draft must
look never-pulled to guarantee the next `pull latest` refreshes it.

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

---

## Test-only license control

`ee/licensing/configs/License.ts` reads `TEST_LICENSE_TERMS` (JSON) under `NODE_ENV=test` instead of decrypting a key.
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
| `TEST_GITLAB_REPO_PATH` | `gsmithun4/gitlab-e2e` (default) | Distinct repo from the GitHub suite; becomes `gitLabProjectId` |
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
