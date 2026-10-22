# apps module

Owns the App aggregate: CRUD, lifecycle (create → edit Versions → Release), dashboard
listing, slug/name resolution, import/export, and the server-side widget (Component)
config catalog. An App has a `type` (`APP_TYPES` in `constants/index.ts`):
`FRONT_END` ('front-end'), `WORKFLOW` ('workflow'), `MODULE` ('module' — reusable
app building block embeddable in other apps). Version content (pages, components,
events) is edited per Version; Release marks a version as the one served to End Users.
Workspace is the user-facing term for the `Organization` entity (legacy name).

## Domain terms

- **Module (app type)** — reusable app embedded via moduleContainer/moduleViewer components; not a NestJS module.
- **App metadata on versions** — for non-workflow apps, `appName`/`slug`/`icon`/`isPublic` live on `app_versions` rows (branch-aware); workflows keep `slug` on `apps` (see `subscribers/apps.subscriber.ts`).
- **Editing version hydration** — TypeORM `afterLoad` hydrates `app.editingVersion` per entity; list endpoints opt out via `skipAppEditingVersionHydration` (AsyncLocalStorage in the subscriber) and bulk-hydrate instead.

## Key files

| File | Role |
|---|---|
| `module.ts` | `AppsModule extends SubModule`; `getProviders(configs, 'apps', [...])` resolves CE vs EE classes |
| `controller.ts` | `@Controller('apps')`: create/get/update/delete, `:id/release`, `slugs/:slug`, `:id/icons`, `:id/tables`, `/addable`, public/private access validation |
| `controllers/workflow.controller.ts` | `GET apps/:id/workflows` |
| `service.ts` | `AppsService`: create/update/delete/release, `getAllApps` (dashboard, bulk hydration), `getOne`/`getBySlug`, app-access validation |
| `util.service.ts` | `AppsUtilService`: create internals, name/slug uniqueness handling, `fetchModules`, module in-use/released checks, `overlayAppMetadata` |
| `repository.ts` | `AppsRepository`: `findBySlug`, `findByAppName`, `findByIdOrSlug`, `findAllOrganizationApps`, `findAllOrganizationModules` |
| `services/` | `page.service` + `page.util.service` (PageHelperService), `component.service`, `event.service`, `workflow.service`, `app-import-export.service` |
| `services/widget-config/` | `index.js` aggregates the per-widget configs from `@tooljet/widget-definitions` (`packages/widget-definitions`) into `componentTypes` |
| `subscribers/apps.subscriber.ts` | Workflow slug placeholder on insert; bumps `apps.updated_at` when a version row updates (inserts deliberately don't bump) |
| `ability/` + `guards/` | CASL `FeatureAbilityFactory` (`app.ability.ts`, `workflow.ability.ts`); `ValidAppGuard`, `ValidSlugGuard`, app-auth/public/private guards |

## Edition split

- EE override: `server/ee/apps/` — every class extends its CE base (`AppsService`, `AppsUtilService`, `AppsController`, `WorkflowController`, all 5 guards, and services: component, event, page, page.util, workflow, app-import-export).
- EE `service.ts` adds git-sync integration: stub-app hydration from git on first open, Redis `git-deletion-lock` + `app.deletion.push-to-git` event on feature-branch delete, license checks (`LICENSE_FIELD`).

## Invariants & gotchas

- **Widget config (CRITICAL)**: configs are shared with the frontend via `packages/widget-definitions` — one copy, edited once. A config change that moves/renames/removes a key needs a data migration for existing component rows.
- App name/slug uniqueness is enforced at the DB level by partial unique indexes on `app_versions` (`app_versions_app_name_branch_id_unique`, `app_versions_slug_branch_id_unique`, `app_versions_slug_default_branch_unique`) plus the `enforce_app_versions_app_name_branch_unique` trigger; `util.service.ts` wraps inserts to surface friendly errors ("This slug is already taken."). Don't add app-level uniqueness checks that race with these.
- New non-workflow apps get `slug = app.id` as placeholder on the version row; user renames later. Workflow slug placeholder is set by the subscriber on `apps` itself. `apps.slug` stays NULL for non-workflows (multiple NULLs allowed on the unique column).
- Deleting a MODULE-type app must pass `checkModuleInUseByApps` (called from the EE delete path); releasing a version must pass `checkModulesReleasedInApp` — every module consumed by that version must resolve to the module's released version.
- **Module in-use checks are branch-scoped, and read `app_versions.app_name` — never `apps.name`.** A ModuleViewer stores `moduleAppId.value` = the module's `co_relation_id`, the git-stable identity shared across branches **and git-cloned workspaces** (`module-ref.util.ts`). The module delete removes only the current branch's version, so the guard must look only at consumers on that same `branchId` (which also pins the workspace, since a branch belongs to one) — matching by `co_relation_id` alone swept every branch and every cloned workspace. Just as important, the consuming app's display name lives on `app_versions.app_name` (branch-scoped); the legacy `apps.name` column is NULL for apps created/pulled after the name migration, so reading it and dropping empties (`.filter(Boolean)`) silently skipped newer consumers and printed stale names for renamed older ones — making the block depend on a consumer's age, not on what it uses. `checkModuleInUseByApps` (`util.service.ts`, takes `branchId` from the EE delete) and the pull-path twin `findModulesInUse` (EE `platform-git-sync/git-conflict-detection.service.ts`) both filter `appVersion.branchId` and select `COALESCE(appVersion.app_name, app.name)` — mirroring the sibling `findDataSourcesInUse`.
- **File/clone imports must materialize referenced-module content on the consumer's branch, never leave a git stub.** In `app-import-export.service.ts` `mapModulesForAppImport`, a `!isGitApp` import that reuses an already-imported module on a non-default branch calls `materializeReusedModuleOnBranch` (a nested `import()` against the existing App via `existingAppId`) so the module gets a real non-stub DRAFT there. An empty `is_stub:true` row would send app-open into `hydrateStubApp` (a git pull) that fails for content never pushed to git — the "module hydration error". The empty-stub path stays only for `isGitApp` imports, where git supplies the content. Dedup itself is correct — one App per identity; the bug was the second consumer's branch lacking real content. `materializeReusedModuleOnBranch` also returns the branch row's `module_reference_id`, and the ModuleViewer pin is remapped to it (`branchPinKey`) rather than to a name/co_relation match — because `resolveModuleRef` only serves a UUID pin from a default-branch PUBLISHED/legacy-unsynced row or the exact row on the consumer's branch, so a pin left aimed at the module's default-branch synced DRAFT resolves to nothing → "Module version not found". `branchPinKey` is null on the default branch, so multi-version pinning there is preserved.
- **Clones must not inherit identity.** `clonePage` copies component/layout rows by spread, so any new identity column has to be reset alongside `id` — `co_relation_id`, `createdAt` and `updatedAt` are cleared so push mints fresh git ids. Sharing a `co_relation_id` makes both rows resolve to the same `components/<co_relation_id>.json` on push (one silently overwrites the other) and lets `module-ref.util.ts` inherit a ModuleViewer pin across unrelated components.
- Wrap multi-step writes in `dbTransactionWrap`; branch-aware reads take an optional `branchId` throughout (repository + services).
- Non-admin/non-builder users are denied MODULE-type resources in `ability/app.ability.ts`.

## Released-app viewer cache

The viewer keeps the released app's `GET apps/slugs/:slug` response in IndexedDB and reuses it while the key matches. `validateReleasedApp` returns the key as `appDataRevision` (`app-data-revision.ts`); the v2 version endpoint uses it in the released version's ETag. The key hashes:

- the app's name/public/maintenance values and released version id;
- the app's change stamp (`app_viewer_cache_stamps`), moved by triggers from migration `AddViewerCacheStamps`: permissions on the released version, the workspace theme (every app in it), a release (the app plus apps embedding it as a module), app/version slugs and first release/unrelease (every app in the workspace, for links);
- the viewer's id and their groups with access (`findUserGroupsWithAppAccess`, read live);
- the server version (covers deploys and their migrations) and the `VIEWER_LICENSE_FIELDS` license terms, both read live.

Not `apps.updated_at` (every draft edit bumps it) and not released version content (frozen).

Stamps are only written by `tj_viewer_cache_stamp`, which locks rows in id order in one statement (migration `AddViewerCacheStamps`). A trigger must collect every app it touches and write them in one call: two writes in one statement deadlock against a concurrent theme change.

**Checklist — anything that changes what a viewer sees in a released app.** A miss here serves a stale app to viewers until the next deploy, and nothing else fails.

| The change | What to do |
|---|---|
| Ships only in a new ToolJet version (code, widget defaults, migrations) | Nothing; the server version is in the key. |
| A new license flag read by `getBySlug` or the version endpoint | Add it to `VIEWER_LICENSE_FIELDS` and to the license-flags test. |
| New data an admin or builder can change without a release (a permission table, a workspace or app setting) | New migration with a trigger that makes one call to `tj_viewer_cache_touch_apps` / `_versions` / `_workspaces`, plus a case in `test/modules/apps/e2e/viewer-cache-stamps.spec.ts`. |
| Something that differs per viewer (like group membership) | Add it to the inputs in `getAppDataRevision`. |
| A new `apps` column the response reads | Add it to the inputs (the app row is already loaded). |

## Related modules

- `versions` — Version rows carry app metadata + content; `VersionRepository` is a provider here.
- `app-environments`, `app-permissions`, `app-history`, `folders`/`folder-apps` — imported by `module.ts` for listing, access, and history.
- `git-sync` — `OrganizationGitSyncRepository` provider; EE lifecycle hooks push/pull app state.
- `workflows` — workflow execution; this module only owns workflow CRUD surface (`workflow.service.ts`).
