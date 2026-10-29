# Task 6 — shared Query Library lifecycle UI

Status: implemented and committed. Code commit: `7b1aab1c81` (`feat: share module lifecycle UI with Query Library`). Normal pre-commit hooks passed, including scoped eslint --fix. Unrelated root and private-submodule work remains unstaged; no submodule commits or pointer updates were made.

## Implementation

- `frontend/src/AppBuilder/QueryLibrary/useLibraryVersionLifecycle.js`: normalizes real draft/saved IDs, persisted names, descriptions, parent/source metadata, environments, release pointer and statuses into the reviewed shared contract. Uses explicit Task 4 draft actions; saving therefore awaits the store's pending-write barrier. Multiple drafts remain available. Source-based resource permissions stay separate from saved-content locking.
- `frontend/src/AppBuilder/QueryLibrary/LibraryVersionDropdown.jsx`: keys its adapter/provider/content subtree by query ID and renders only the shared lifecycle provider/content. No library lifecycle forms, dialogs or row JSX remain.
- Removed the pre-existing untracked `LibraryVersionItem.jsx` from the working tree (it was absent from Git HEAD, so there is no tracked deletion entry).
- `frontend/src/AppBuilder/QueryLibrary/AGENTS.md`: documents these invariants and the test seams.
- `frontend/src/AppBuilder/QueryLibrary/__tests__/integration/LibraryVersionDropdown.spec.jsx`: real store + MSW coverage for Save and custom metadata refresh, cancel, named multi-draft creation, metadata editing, draft-write Save ordering, environment browsing, permissions, load error/retry, and explicit library Promote/Release routes.
- `frontend/src/AppBuilder/Header/VersionManager/__tests__/integration/lifecycleParity.spec.jsx`: runs both real adapters through the same shared Save fields/warning/cancel, named multi-draft source form, draft-only Edit details, search/empty, and ordered promotion/release confirmation scenarios in light/dark presentation.

Approved shared boundary fixes: `Header/CreateVersionModal.jsx` displays its existing immutable-name/description warning for Modules and Query Library when Git is disabled; ordinary app behavior stays unchanged. `Header/VersionManager/VersionManagerDropdown.jsx` displays lifecycle load errors separately from empty results. `Header/VersionManager/VersionDropdownItem.jsx` explicitly includes Query Library in the Modules saved-edit restriction. Existing PromoteVersionButton/PromoteConfirmationModal and ReleaseVersionButton forward their supplied darkMode into shared confirmations instead of relying solely on localStorage.

## Authorization and isolation evidence

`server/ee/query-library/guards/validate-library-environment-access.guard.ts` resolves workspace `MODULES.APP.environmentAccess` without an app resource ID. The adapter uses only session workspace default `app_group_permissions.environment_access` and admin/super-admin access; it ignores app-specific environment maps and app-editable grants. Source capability follows `canUseDataSourceForQuery`, with null-source surviving drafts remaining editable as allowed by `server/src/modules/query-library/service.ts::authorizeDataSource`.

Library Git capabilities are explicitly disabled. The adapter imports no app/Git services, supplies no fake app ID/state, and delegates only Query Library actions. The library suite asserts all captured HTTP calls use `/query-library/` after Save/Create/Edit/Promote/Release. Every library parity scenario also asserts that all observed requests are library-scoped; the library branch does not initialize an app.

Environment clicks update local browsing only. Selecting a row commits its browsed environment before selecting its real ID. Opening resets browsing to the editor environment. Saved selection preserves lifecycle permissions; immutability is represented by row status and the existing editor lock.

## Executed verification

All Node commands used `source ~/.nvm/nvm.sh && nvm use` first: Node `v22.23.4`, npm `10.9.9`. Commands ran from the isolated worktree; linked dependencies were used read-only.

1. RED: from `frontend`, `npm test -- --runInBand LibraryVersionDropdown lifecycleParity`; six new library cases failed against the original bespoke dropdown (it lacked the shared controls/forms). Log: `/tmp/task6-red.log`.
2. Additional focused RED exposed the existing Git-only immutable-warning guard; the ordinary module/library parity cases required the same warning with Git disabled.
3. GREEN: `npm test -- --runInBand LibraryVersionDropdown lifecycleParity` — 2 suites, 29 tests passed before the final two explicit Promote/Release route cases were added (`/tmp/task6-green-final.log`).
4. Restored-code regression run: `npm test -- --runInBand LibraryVersionDropdown lifecycleParity moduleLifecycle` — **3 suites, 46 tests passed**, 0 snapshots (`/tmp/task6-verified.log`). This includes all 31 Task 6 cases plus 15 existing Modules lifecycle cases.
5. Final scoped eslint across all ten changed JS/JSX files: passed with no output (`/tmp/task6-final-lint.log`). `git diff --check`: passed. Commit hooks also linted the same staged frontend scope successfully.
6. After the code commit, exact required command `npm test -- --runInBand LibraryVersionDropdown lifecycleParity` — **2 suites, 31 tests passed**, 0 snapshots (`/tmp/task6-exact-final.log`).

## Executed fault proof

Each mutation was applied temporarily, its focused test command was run, and the original production file was restored in a finally block. Every command exited 1 due to the expected behavioral assertions. Summary: `/tmp/task6-fault-results.json`; per-fault logs: `/tmp/task6-fault-<name>.log`.

| Fault | Focused `-t` pattern | Failed assertions |
| --- | --- | --- |
| Restore Git-only Save warning | `same Save fields` | 4 |
| Hide Create draft when drafts exist | `Create draft enabled` | 2 |
| Expose saved-row Edit details | `does not offer Edit details` | 1 |
| Bypass version search filtering | `shared search` | 2 |
| Ignore lifecycle load error | `resource load errors` | 1 |
| Commit environment on browse | `browses environments` | 1 |
| Ignore source permission | `uses source access` | 1 |
| Force release confirmation light theme | `release confirmation` | 2 dark cases; 2 light cases stayed green |
| Force promote confirmation light theme | `promotion confirmation` | 2 dark cases; 2 light cases stayed green |

Fault commands used `npm test -- --runInBand LibraryVersionDropdown lifecycleParity -t '<pattern>'`. Nine faults were caught; no fault remains in the committed code.

## Self-review and limits

Reviewed the adapter against the exact Task 5 value/actions and Task 4 explicit-ID interfaces. No legacy draft sentinel, singular draft fallback, generated version names, app grants, app initialization or Git action was introduced. Forms and confirmations remain the same rendered components for both resources. No backend/service/store code changed in Task 6.

RTL checks confirm DOM/theme classes and behavior; they are not pixel screenshots. Live-browser light/dark review and full editor journeys remain controller/final-verification work. No full frontend suite or live service stack was run for this scoped task. Existing console warnings about Zustand's deprecated equality API, icon SVG properties and React act timing remain visible in test logs; all assertions pass. Task 7 still owns dependency-warning extraction. The previously recorded refresh-overlay observation remains in progress.md for final review.
