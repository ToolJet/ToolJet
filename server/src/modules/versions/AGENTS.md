# versions module

Owns the AppVersion lifecycle: named development snapshots of an App. Create/clone a version (deep definition copy), edit it as a DRAFT, save (PUBLISHED), promote it across App Environments (EE), and delete it. **Release itself lives in the apps module** (`apps/service.ts` `release()` sets `apps.current_version_id`); this module supplies the eligibility checks. Also owns version-scoped page/component/event endpoints and module-version pin resolution.

## Domain terms

- **Version** — `AppVersion` entity (`app_versions`). `status`: `DRAFT` → `PUBLISHED` → `RELEASED`; `versionType`: `VERSION` (named snapshot) or `BRANCH` (git-branch head; `name` is a UUID, display name comes from `WorkspaceBranch`).
- **Release** — `apps.current_version_id` points at the released version. Set by apps module `release()`, guarded by env + slug checks.
- **Environment** — `AppEnvironment` (app-environments module), priority-ordered (development=1 → staging → production). Each version carries `currentEnvironmentId`.
- **Promote** — advance a saved version's `currentEnvironmentId` to the next-higher-priority environment. Multi-environment is EE-licensed (`LICENSE_FIELD.MULTI_ENVIRONMENT`).
- **Module pin** — a ModuleViewer component pins a module version via `moduleReferenceId` (stable UUID per version row, survives git/zip round-trips).

## Key files

| File | Role |
|---|---|
| `module.ts` | `VersionModule extends SubModule`; registers 5 controllers + services via `getProviders`; exports `VersionUtilService` |
| `service.ts` | `VersionService`: getAllVersions, getVersion (editor payload), update/updateSettings, promoteVersion, createDraftVersion; CE no-op before/after hooks for app-history |
| `util.service.ts` | `VersionUtilService`: createVersion, updateVersion (status flips + `handleDefaultBranchPublish`), deleteVersion/deleteVersionGit, checkDraftModulesInApp, checkModulesPromotableToEnvironment |
| `services/create.service.ts` | `VersionsCreateService.setupNewVersion`: deep-clones settings, data sources+queries, pages/components/layouts, event handlers; remaps old→new ids and entity references; copies workflow bundles |
| `repository.ts` | `VersionRepository`: findVersion, getVersionsInApp (branch-scoped), findLatestVersionForEnvironment, resolveMetadataVersion, updateVersion |
| `module-ref.util.ts` | Resolves **module** pins (`resolveModuleRef`, `resolveAllModuleViewersForVersion`, `listModuleVersions`); pin/unpinned/orphan fallback rules documented in header |
| `workflow-ref.util.ts` | Resolves **workflow query** pins (`resolveWorkflowRef`, `resolveAllWorkflowRefsForVersion`, `reconcileWorkflowQueryPinsFromDefault`, `pinIsDraftSentinel`). Split out of `module-ref.util.ts`; the two halves shared only the sentinels |
| `ref-sentinels.ts` | `DRAFT_SENTINEL` / `WORKFLOW_CURRENT_BRANCH_SENTINEL`. **Persisted** pin values — they sit in component properties and query options and travel through git, so changing a string orphans every ref holding it. Mirrored in `frontend/src/_helpers/versionLabels.js` |
| `helpers/version-copy-parent.helper.ts` | Parent-id remapping during clone (composite ids, ghost parents) |
| `controller.ts` | `/apps/:id/versions` GET/POST/DELETE, `/apps/:id/draft-versions` POST |
| `controller.v2.ts` | v2: get one, PUT update, PUT global/page settings, PUT promote, GET `module/by-correlation/:coRelationId/version` |
| `controllers/{components,events,pages}.controller.ts` | Version-scoped component/event/page CRUD (delegates to apps-module services) |
| `guards/`, `ability/` | `validate-app-version.guard`, `valid-module-by-correlation.guard`; CASL abilities for app + workflow versions |
| `dto/index.ts` | `VersionCreateDto` (name ≤25 chars, git-unsafe chars rejected), `PromoteVersionDto`, `DraftVersionDto` |

## Edition split

- `server/ee/versions/service.ts` extends CE `VersionService`: implements app-history hooks (initial snapshot on create, settings deltas on update); `getVersion` adds page/query/component-level permission filtering (license-gated) and git-branch editor freeze; `promoteVersion` adds module-promotability check + per-environment access check (returns `hasAccessToPromotedEnvironment`).
- `server/ee/versions/util.service.ts`: deletes git tag on version delete; `setupVersionFromSource` — cross-app clone (no appId ownership check) for building BRANCH versions from git-imported temp apps.
- `server/ee/versions/services/create.service.ts` overrides clone internals (incl. `handleModuleViewerComponent`).
- CE behavior when license lacks MULTI_ENVIRONMENT: version pinned to development env, promote throws.

## Invariants & gotchas

- Non-DRAFT versions are immutable in name/description (`service.ts` update: "Cannot edit name or description of a saved version"). Content edits are frozen via `should_freeze_editor` (env priority > 1, status PUBLISHED, or EE git freeze).
- Promote: DRAFT cannot be promoted (save first); request's `currentEnvironmentId` must equal the version's, else 406; next env = lowest priority above current; `promotedFrom` is nulled on promote.
- Delete: released version (matches `apps.current_version_id` or status RELEASED) and the only/branch-head version cannot be deleted; module versions in use by apps block deletion (`checkModuleVersionInUse`). `DataQueryFolder`/`DataQueryFolderMapping` need explicit cleanup (no CASCADE).
- Git branching on ⇒ only one DRAFT of type VERSION per branch — but the single-draft unique index is predicated on `is_synced = TRUE` (`1782100000000-ExemptUnsyncedDraftsFromDefaultBranchUniqueIndex.ts`), so an unsynced app may legitimately hold several default-branch drafts. Publishing a default-branch draft (`handleDefaultBranchPublish`) seeds a fresh DRAFT on that branch and **leaves `branch_id` intact on the published row**.
- **PUBLISHED rows keep their default-branch `branch_id`.** The old `chk_app_versions_branched_implies_draft` CHECK is dropped (`data-migrations/1781741000000-MakeAppVersionBranchIdNotNullAndGitSyncFlags.ts:55-58`; the re-add at `:504` is in `down()`), and `branch_id` is now NOT NULL. Anything reasoning about a *released* app's branch context depends on this: `consumerBranchId` for a released app is the default branch, not null, which is why workflow ref resolution needs a published-consumer backstop (`workflow-ref.util.ts`).
- Non-workflow app metadata (`appName`/`slug`/`icon`/`isPublic`) lives on `app_versions` rows, not `apps.*`. Workflows keep `appName`/`slug`/`icon`/`isPublic` on `apps.*`, but **`workflow_enabled` is a version column** (`app_versions.workflow_enabled`, the fifth member of the propagate-trigger set) so webhook enablement is branch-scoped and travels through git. `apps.workflow_enabled` is retained unwritten as the rollback source.
- Publishing an app version blocks if any ModuleViewer resolves to a draft/orphan/unpinned module (`checkDraftModulesInApp`), or if any workflow query resolves to a DRAFT version (`checkDraftWorkflowsInApp`); EE promote blocks if a pinned module version isn't yet in the target environment. The workflow twin deliberately treats an **unpinned** query as *not* an offender — unpinned means "run whatever is released", which every existing app relies on. Only the module check faults unpinned.
- `co_relation_id` is only unique per-organization (git clones share it) — always scope lookups by org.
- **Orphaned module pins fall back only on feature branches.** `resolveModuleRef` (the `module/by-correlation/:coRel/version` fetch) resolves a UUID/name pin that matches no tier by falling back to the module's own row on the consumer's *non-default* branch — never on the default branch, where an unhonorable pin still returns null (404). This mirrors `resolveAllModuleViewersForVersion` (app-load), so the two agree: without it the parent app renders the ModuleViewer via its orphan-fallback while this endpoint 404s, blanking the embed. Keep the default-branch strictness — an explicit pin there must resolve to a servable row (PUBLISHED / legacy `isSynced:false`), not silently swap to a synced draft (see `module-ref-resolution.spec` "synced draft name-pin still 404s").
- **`__current_branch__` never crosses a branch boundary.** On a feature branch, Tier C returns that branch's BRANCH row or **throws** — it does not fall back to the default branch's draft (`workflow-ref.util.ts`, Phase 10 Step 10.4). A stub counts as absent (`isStub: false` is part of the lookup); the pull and app-open hydrate cascades are what make that state self-healing. The default-branch arm still serves the two callers that *should* reach it: publish/promote checks, which omit `consumerBranchId` deliberately, and consumers already on the default branch — which includes **released apps** (see the PUBLISHED-rows note above). Pinning main's draft explicitly is what `__default_branch_draft__` is for. Covered by `test/modules/versions/unit/resolve-workflow-ref.spec.ts` (full-tier spec; its Tier C block holds the branch-arm throw cases and both default-branch arms).
- **"Unpinned" means opposite things for a ModuleViewer and a workflow query.** The two resolvers are otherwise twins, so this is the trap the split into `module-ref.util.ts` / `workflow-ref.util.ts` makes visible rather than hides. A ModuleViewer with no pin *follows the consumer's branch*; a workflow query with no pin *runs whatever is released*. The module viewer also encodes unpinned as `''` while a workflow query encodes it as absent/null. Never generalise a fix from one file to the other without re-deriving which semantic applies.
- New versions/drafts always start on the lowest-priority (development) environment regardless of source.

## Related modules

- `apps` — release flow + `current_version_id`; Page/Event/Component services this module reuses; `overlayAppMetadata`, `fetchModules`
- `app-environments` — environment priority ordering drives promote; `currentEnvironmentId` lookups
- `data-sources` / `data-queries` — cloned per version by `VersionsCreateService`; local vs global scope handling
- `git-sync` — branching flags (`isBranchingEnabled`), `version-rename-commit` event, EE git tags/freeze
- `app-history` (EE) — before/after hooks queue deltas via `AppHistoryUtilService`
- `licensing` — gates multi-environment, JS libraries, page/query/component permissions
