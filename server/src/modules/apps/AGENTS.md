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
| `services/widget-config/` | Per-widget default config (`index.js` aggregates); served to the builder |
| `subscribers/apps.subscriber.ts` | Workflow slug placeholder on insert; bumps `apps.updated_at` when a version row updates (inserts deliberately don't bump) |
| `ability/` + `guards/` | CASL `FeatureAbilityFactory` (`app.ability.ts`, `workflow.ability.ts`); `ValidAppGuard`, `ValidSlugGuard`, app-auth/public/private guards |

## Edition split

- EE override: `server/ee/apps/` — every class extends its CE base (`AppsService`, `AppsUtilService`, `AppsController`, `WorkflowController`, all 5 guards, and services: component, event, page, page.util, workflow, app-import-export).
- EE `service.ts` adds git-sync integration: stub-app hydration from git on first open, Redis `git-deletion-lock` + `app.deletion.push-to-git` event on feature-branch delete, license checks (`LICENSE_FIELD`).

## Invariants & gotchas

- **Widget config sync (CRITICAL)**: `services/widget-config/` and `frontend/src/AppBuilder/WidgetManager/widgets/` must change together. A config change that moves/renames/removes a key needs a data migration for existing component rows.
- App name/slug uniqueness is enforced at the DB level by partial unique indexes on `app_versions` (`app_versions_app_name_branch_id_unique`, `app_versions_slug_branch_id_unique`, `app_versions_slug_default_branch_unique`) plus the `enforce_app_versions_app_name_branch_unique` trigger; `util.service.ts` wraps inserts to surface friendly errors ("This slug is already taken."). Don't add app-level uniqueness checks that race with these.
- New non-workflow apps get `slug = app.id` as placeholder on the version row; user renames later. Workflow slug placeholder is set by the subscriber on `apps` itself. `apps.slug` stays NULL for non-workflows (multiple NULLs allowed on the unique column).
- Deleting a MODULE-type app must pass `checkModuleInUseByApps` (called from the EE delete path); releasing a version must pass `checkModulesReleasedInApp` — every module consumed by that version must resolve to the module's released version.
- **File/clone imports must materialize referenced-module content on the consumer's branch, never leave a git stub.** In `app-import-export.service.ts` `mapModulesForAppImport`, a `!isGitApp` import that reuses an already-imported module on a non-default branch calls `materializeReusedModuleOnBranch` (a nested `import()` against the existing App via `existingAppId`) so the module gets a real non-stub DRAFT there. An empty `is_stub:true` row would send app-open into `hydrateStubApp` (a git pull) that fails for content never pushed to git — the "module hydration error". The empty-stub path stays only for `isGitApp` imports, where git supplies the content. Dedup itself is correct — one App per identity; the bug was the second consumer's branch lacking real content. `materializeReusedModuleOnBranch` also returns the branch row's `module_reference_id`, and the ModuleViewer pin is remapped to it (`branchPinKey`) rather than to a name/co_relation match — because `resolveModuleRef` only serves a UUID pin from a default-branch PUBLISHED/legacy-unsynced row or the exact row on the consumer's branch, so a pin left aimed at the module's default-branch synced DRAFT resolves to nothing → "Module version not found". `branchPinKey` is null on the default branch, so multi-version pinning there is preserved.
- Wrap multi-step writes in `dbTransactionWrap`; branch-aware reads take an optional `branchId` throughout (repository + services).
- Non-admin/non-builder users are denied MODULE-type resources in `ability/app.ability.ts`.

## Related modules

- `versions` — Version rows carry app metadata + content; `VersionRepository` is a provider here.
- `app-environments`, `app-permissions`, `app-history`, `folders`/`folder-apps` — imported by `module.ts` for listing, access, and history.
- `git-sync` — `OrganizationGitSyncRepository` provider; EE lifecycle hooks push/pull app state.
- `workflows` — workflow execution; this module only owns workflow CRUD surface (`workflow.service.ts`).
