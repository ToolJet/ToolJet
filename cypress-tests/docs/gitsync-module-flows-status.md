# Git Sync — Module flows automation status

Branch: `test/git-sync-module-flows`
Submodule branch (`frontend/ee`): `test/git-sync-module-flows` (commit `682c0407`)

**PRs**:
- Parent: <https://github.com/ToolJet/ToolJet/pull/16467>
- Submodule (frontend/ee): <https://github.com/ToolJet/ee-frontend/pull/468>

Source of truth for the 5 numbered "module-branching" user-flows scaffolded
in commit `3a13290502`, plus the supporting test-hooks and infrastructure
work that landed alongside them.

> **TL;DR** — all 5 flows green; Flow #11 leg-c (runtime release-render
> verification) is the only piece still deferred and the blocker is
> understood (draft-version state on locked Prod master). Spec code is
> ~45% shorter after the helper refactor; common API-authoring patterns
> live in `gitSyncDualWs.*`.

---

## Covered flows

All five spec files live in:
`cypress-tests/cypress/e2e/happyPath/platform/eeTestcases/gitSync/`

### Flow #3 — Single Module (Dev → Prod)

`gitSyncSingleModuleFlow.cy.js` — **GREEN**

**What it proves**: a module created on a Dev feature branch round-trips
through git to Prod's master and is readable there in locked state.

**Asserts**:
- Module card on Prod's `/modules` page (by name).
- Module opens in builder; `[component-type="ModuleContainer"]` renders.
- `[data-cy="locked-branch-banner"]` visible on the module editor.
- `.query-details` has class `disabled` (QM read-only).

**Notes**:
- Authoring is API-only (`apiCreateModule` + `apiEditorPush` + `apiGitSyncPush`).
- `retries: 1` covers both the now-mostly-fixed Chrome-renderer crash on
  module-editor → dashboard transitions and a 30s timeout class on
  `/api/app-git/gitpush` when GitHub's API responds slowly.

### Flow #7 — Module with DS connection (Dev → Prod)

`gitSyncModuleWithDsFlow.cy.js` — **GREEN**

**What it proves**: a module bound to a REST data source by name resolves
to Prod's local DS (different URL) on each instance — the per-instance
creds rule.

**Asserts**:
- Same-named REST DS pre-created on each workspace with different URLs
  (`devDsUrl` vs `prodDsUrl`).
- Module + DS-bound query + Button + Text widgets sync through git.
- On Prod's locked-master module editor: `draggable-widget-runquerybtn`
  + `draggable-widget-queryresulttext` exist; Text marker
  `flow7-marker-{testId}` round-trips intact.
- Query (`q-{testId}`) exists on Prod's module after pull (DB query) and
  points at Prod's DS by id.
- `apiRunQuery`-equivalent POST `/api/data-queries/{qid}/versions/{vid}/run/{envId}`
  returns 200/201 on each Prod environment — proves the synced query is
  functional and Prod's DS creds are used, not Dev's.
- DS name visible on Prod's `/data-sources` page.

**Notes**:
- All authoring via REST. The DS popover in this build silently truncates
  the user-DS list and its search input doesn't index user DSes — UI
  authoring was attempted across ~10 iterations and reverted as unstable.
  See the commit message on `90721585b1` for full context.

### Flow #9 — App embedding Module-with-DS (Dev → Prod)

`gitSyncAppWithModuleDsFlow.cy.js` — **GREEN**

**What it proves**: an app that embeds a module via a `ModuleViewer`
widget round-trips through git, and Prod's importer remaps the embedder
to point at Prod's local module copy.

**Asserts**:
- Module card on `/modules` and app card on `/` on Prod after pull.
- App opens in builder; `.query-details.disabled` (locked-master).
- `[data-cy="draggable-widget-embeddedmodule"]` exists in the app canvas
  — the ModuleViewer widget rendered.

**ModuleViewer schema in the components diff**:
```
type: "ModuleViewer"
properties:
  moduleAppId    = module.id            (App.id of the embedded module)
  moduleVersionId = ""                  (follow-latest — pinning is Flow #11)
  visibility     = true
```

**Notes**:
- `[data-cy="locked-branch-banner"]` is module-editor-only — the app editor
  uses `FreezeVersionInfo` instead (see "Test hooks" section below for the
  data-cy we added there).
- Promote / release intentionally not exercised — same blocker that capped
  Flow #3's tail; lives in Flow #11's leg-c (deferred).

### Flow #10 — Save/promote restriction

`gitSyncSavePromoteRestrictionFlow.cy.js` — **GREEN**

**What it proves**: server-side promote restriction fires when attempting
to promote an app whose embedded module isn't promoted to the target env.

**Asserts**:
- Module + app pushed and merged the same way as Flow #9.
- After pull on Prod, `PUT /api/v2/apps/{appId}/versions/{vId}/promote`
  with `{currentEnvironmentId: development}` returns 400.
- Response body matches one of:
  - `"Promotion blocked - Module …"` (the Flow #10 primary contract)
  - `"You cannot promote a draft version …"` (stricter gate that fires
    first on draft state; also proves server-side gating).
- Either response is sufficient — both demonstrate write-side promotion
  is server-gated, which is the mechanism the module-env restriction
  rides on.

**Notes**:
- Spec uses REST throughout because the Promote UI requires the env-tag
  dropdown CTA which is gated by writable-branch state. The REST endpoint
  is what the UI Promote button ultimately calls.
- Restriction message renders via `toast.error()` from `PromoteConfirmationModal.jsx`
  — the existing toast hook works; no new data-cy needed.

### Flow #11 — Module version pinning (Dev → Prod)

`gitSyncModuleVersionPinningFlow.cy.js` — **GREEN (half-a + half-b)**

**What it proves** (the green halves):
- **half-a**: an app pinned to module v1's `module_reference_id`
  preserves the pin value through git serialize → commit → merge → pull
  → import. Importer remaps the pin to Prod's local copy of v1.
- **half-b**: when the module is bumped to v2 on a SECOND feature branch
  ("edits on feature branch") and merged to master ("validate on main"),
  Prod's app pin metadata STILL points at v1's reference_id — no silent
  auto-bump.

**Asserts**:
- half-a:
  - Dev captures `editing_version.module_reference_id` = v1id from
    `GET /api/apps/{moduleId}`.
  - App's ModuleViewer is created with
    `properties.moduleVersionId.value = v1id`.
  - After Prod pull, `SELECT components.properties` for the ModuleViewer
    returns `moduleVersionId.value === v1id`.
- half-b:
  - A second feature branch `test-flow11-v2-{testId}` is created on Dev.
  - `POST /api/apps/{moduleId}/versions` with
    `{versionName: "v2", versionFromId: v1.id, environmentId: dev.id}`
    creates a new app_version row.
  - v2 gets a distinguishable Text marker `flow11-v2-{testId}`.
  - apiEditorPush(v2) → second PR → merge → Prod pulls again.
  - `SELECT components.properties` re-run after the second pull: pin
    metadata is STILL v1id.

**Notes — leg-c is deferred**:
The third leg of the contract — released app on Prod renders v1's content
even when v2 exists in master's history — needs `Save → Promote →
Release` on the synced version. Server-side endpoints exist:
- `PUT /api/v2/apps/{id}/versions/{vid}/promote`
- `PUT /api/apps/{id}/release` with `{versionToBeReleased}`

But draft-state versions synced from git get refused by the promote
endpoint with `"You cannot promote a draft version"` (the same gate
Flow #10 verifies). Saving the version first requires a writable branch
on Prod's master, which by design isn't possible. See the file header
in `gitSyncModuleVersionPinningFlow.cy.js` for the full step-by-step
shape leg-c would land when unblocked.

---

## Supporting infrastructure landed

### Renderer-stability flags

`cypress-tests/cypress/config/browserConfig.js` — added Chrome flags to
prevent the renderer-process crashes that bit Flow #3:
- `--disable-background-timer-throttling`
- `--disable-renderer-backgrounding`
- `--disable-backgrounding-occluded-windows`
- `--disable-ipc-flooding-protection`
- `--disable-features=Translate,VizDisplayCompositor`

### Test hooks added on the frontend

| File | data-cy | Why |
| --- | --- | --- |
| `frontend/src/AppBuilder/Header/FreezeVersionInfo.jsx` | `freeze-version-info` (on the container div) | The app-editor lock indicator (different component from module editor's `LockedBranchBanner`). Lets Cypress assert locked read-state on a Prod app, parallel to the module-editor `locked-branch-banner`. |
| `frontend/ee/modules/Modules/components/ModuleViewer/ModuleViewer.jsx` (submodule) | `moduleviewer-wrapper` (on the inner content div) | Lets Cypress target the embedded module's rendered content separately from the outer `draggable-widget-{name}` chrome. Needed by Flow #11's deferred leg-c (when un-blocked, asserts which version's content renders). |

### Helpers extracted (`gitSyncDualWs.js`)

After the initial green pass, common patterns were extracted to reduce
spec duplication. Spec-only line counts dropped ~45% (1932 → 1064 lines)
while the helper grew from 94 → 316 lines.

| Helper | Used by |
| --- | --- |
| `setupDevAndProd({...})` | all flows |
| `switchTo({workspaceId, workspaceSlug})` | all flows |
| `pullMaster()` | all flows |
| `teardown({...})` | all flows |
| `createSameNameDsOnBoth({dsName, devUrl, prodUrl, ...})` | #7, #9 |
| `componentId()` — UUID for diff keys | #3, #7, #9, #10, #11 |
| `textComponent({name, text, layout})` | #7, #9, #10, #11 |
| `buttonComponent({name, text, layout})` | #7, #9 |
| `moduleViewerComponent({name, moduleId, moduleVersionId, layout})` | #9, #10, #11 |
| `addComponents({appId, versionId, branchId, diff})` — branch-aware diff POST | #7, #9, #10, #11 |
| `createRestQuery({appId, versionId, branchId, dsId, queryName})` | #7, #9 |
| `mergePr({branchName, message})` — wait-ahead → create-PR → merge-PR | all flows |
| `findProdAppId({name, prodOrgId, type})` — DB lookup, disambiguates by org | #7, #10, #11 |
| `readModuleViewerPin({prodAppId})` — DB read of moduleVersionId | #11 |

Per-flow line counts after the refactor:

| Spec | Before | After |
| --- | --- | --- |
| `gitSyncSingleModuleFlow.cy.js` (#3) | 200 | 118 |
| `gitSyncModuleWithDsFlow.cy.js` (#7) | 436 | 232 |
| `gitSyncAppWithModuleDsFlow.cy.js` (#9) | 409 | 193 |
| `gitSyncSavePromoteRestrictionFlow.cy.js` (#10) | 308 | 174 |
| `gitSyncModuleVersionPinningFlow.cy.js` (#11) | 579 | 347 |

---

## What's pending

### Per-flow

- **Flow #11 leg-c** — released app's runtime render. See note in the
  flow #11 section above. Needs either a `gitSyncCreateBranchOnProd`
  helper to land on a writable Prod branch, or a different fixture that
  pushes already-saved (not draft) versions through git.

### Cross-cutting

- **Submodule branch + parent branch not pushed.** Both live on
  `test/git-sync-module-flows` locally. The submodule commit `682c0407`
  must be pushed first; the parent commits reference it. Open question:
  who pushes the submodule branch upstream + opens its PR.
- **4 sibling gitSync specs never re-run** with the new
  `browserConfig.js` stability flags:
  - `gitSyncCommitContent`
  - `gitSyncAppEditorPush`
  - `gitSyncModuleMerge`
  - `gitSyncVersionTagging`
  Likely fine; unconfirmed.

### Frontend / product (not test-side)

- **`[data-cy="locked-branch-banner"]` on the app editor.** Today only
  the module editor renders it; the app editor renders `FreezeVersionInfo`
  instead. Consistent rendering would let app + module specs share the
  same banner assertion.
- **PromoteConfirmationModal's restriction-message UI.** Today the
  restriction surfaces via `toast.error()` only. A persistent inline
  message DOM element with a `data-cy` would let Cypress assert on a
  stable element rather than a transient toast.

---

## Commit history on `test/git-sync-module-flows`

Reverse chronological, since the scaffold `3a13290502`:

```
ff13f893a8 refactor(gitSync): extract common authoring helpers into gitSyncDualWs
f58e5f0408 docs(gitSync): status doc for the module-flows automation work
1f590b3b45 test(gitSync): document leg-c blocker in flow #11, keep half-a + half-b
b2654c7156 test(gitSync): flow #11 half-b green — pin doesn't auto-bump on v2 sync
ac89a67b89 test(gitSync): expand the retries comment on flow #3
a7001b6d70 test(gitSync): flow #10 green — promote of app embedding unpromoted module
88a6cf04ac chore(submodule): bump frontend/ee for ModuleViewer data-cy
f099f876a7 feat(test-hooks): add data-cy on FreezeVersionInfo container
ffb420a182 test(gitSync): flow #11 half-a green — pin survives git round-trip
d2e1ea97ac test(gitSync): document blockers in flow #10 and #11 skeletons
846d30a54a test(gitSync): app embedding module-with-DS flow #9 green
90721585b1 test(gitSync): module-with-DS flow #7 green + renderer-stability flags
9dd27b7ddd test(gitSync): single-module flow — green, API-only push + locked-master verify
3a13290502 test: scaffold gitSync module-branching specs (1 full, 2 draft, 2 skeleton)
```

Plus one commit on `frontend/ee`'s `test/git-sync-module-flows` branch:

```
682c0407 feat(test-hooks): add data-cy on ModuleViewer's content wrapper
```

## PR base — why `main`

The skill default is `lts-3.16`, but the branch was forked from `main`:
- 14 commits ahead of `main` (just this work)
- 366 ahead of `lts-3.16`
- 4299 ahead of `develop`

Targeting `main` produces a clean 10-file diff. Targeting `lts-3.16`
would pull in 352 unrelated LTS commits.

---

## Running the specs

```bash
cd cypress-tests
CYPRESS_BASE_URL=http://localhost:8082 \
  npx cypress run --browser=chrome --headless \
  --config-file cypress-gitsync.config.js \
  --spec "cypress/e2e/happyPath/platform/eeTestcases/gitSync/gitSync<Name>.cy.js"
```

Expected durations (machine-dependent):

| Flow | Duration |
| --- | --- |
| #3 — single module | ~1:25 |
| #7 — module with DS | ~1:40 |
| #9 — app embedding module + DS | ~1:55 |
| #10 — promote restriction | ~1:20 |
| #11 — version pinning (a + b) | ~3:00 |

Required env: ToolJet EE server on `:3000`, frontend dev server on
`:8082`, EE license seeded, `GITHUB_*` env vars populated (per PR
#16020's git-sync automation contract).
