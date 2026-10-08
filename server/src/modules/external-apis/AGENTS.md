# external-apis module

Owns the **External API**: a machine-to-machine REST surface (`/api/ext/...`, `/api/v2/ext/...`)
for managing Users, Workspaces, Apps, Modules, Workflows, their Folders and Versions, and
Environments and Data Sources (read-only) from outside the
product, authenticated by a static bearer token rather than a user session.

## Domain terms

- **v1** vs **v2** — v1 (`ExternalApisController`, `ExternalApisAppsController`, ...) is the
  original surface: git-sync operations, user/workspace management, curated app import/export.
  v2 (`*ControllerV2`) is a newer, workspace-scoped CRUD surface for Apps/Modules/Workflows, their
  Folders and Versions, and Environments
  under `/api/v2/ext/workspaces/:workspaceIdentifier/...` — a different resource model, not a
  breaking version of v1's routes. Both are mounted side by side; neither replaces the other.
- **Identifier resolution** — every v2 `:xIdentifier` path param accepts an id, then falls back to
  a name/slug lookup, always scoped to the workspace (and, for Apps/Modules/Workflows, to the
  resource's `type`): `resolveWorkspaceByIdentifier` tries `id` → `slug` → `name`;
  `resolveAppByIdentifier` tries `id`/`slug` (via `AppsUtilService.findAppWithIdOrSlug`) → `name`
  (via `findByAppName`), then rejects if the match's `type` doesn't match the caller's route.
  `resolveAppFolder` tries `id` → `name`, scoped to workspace + folder `type`.

## Key files

| File | Role |
|---|---|
| `module.ts` | `register()`; wires v1 + v2 controllers, imports `FoldersModule`/`FolderAppsModule` for folder resources |
| `Interfaces/IController.ts` | Interfaces the CE stub controllers implement and the EE controllers extend/override |
| `dto/index.ts` | All v1 + v2 request/response DTOs |
| `constants/feature.ts`, `constants/index.ts` | `FEATURE_KEY` enum + `FEATURES` config — license (`EXTERNAL_API`) and public/gated status per action |
| `controllers/*.controller.v2.ts` (CE) | Stub controllers — routes exist on the CE interface but every method throws `Method not implemented`; no HTTP decorators, so CE never registers these routes at all |
| `ee/external-apis/service.ts`, `util.service.ts` | Real v2 implementation; `util.service.ts` holds the identifier-resolution helpers above |

## Edition split

- CE only defines the v2 interfaces/DTOs/stub controllers — no route decorators, so the routes
  don't exist on CE builds at all (404, not 501).
- `server/ee/external-apis/controllers/*.controller.v2.ts` extend the CE stub classes and add the
  real `@Get`/`@Post`/`@Patch`/`@Delete` decorators + `ExternalApiSecurityGuard` + `InitFeature`,
  calling into `ee/external-apis/service.ts` for the actual logic.
- Gating is two-layered: `FeatureAbilityGuard` (from the CE `@UseGuards` on the stub, inherited by
  the EE subclass) checks the `EXTERNAL_API` license field is on the plan at all (CE 404s, starter
  plan 451s); `ExternalApiSecurityGuard` then checks the bearer token itself.

## Invariants & gotchas

- v2 actions run as **an arbitrary workspace admin** (`validateAndGetAdminUser`), not a specific
  caller — no per-user CASL checks; authorization is all-or-nothing at the license/feature-key level.
- Apps/Modules/Workflows share the `apps` table; v2 endpoints for one type must never cross-resolve
  into another (`resolveAppByIdentifier` checks `type` after the lookup).
- `AppsUtilService.create()` throws 400 on a name clash by design for v1; v2 translates it to 409 via
  `#toConflictIfNameTaken` — don't change `AppsUtilService.create()` itself (v1 contract).
- Modules v2 has no `folder_id` anywhere (request or response) — an explicit product decision, not
  a gap; don't add it without checking `api-spec-viewer.html` first.
- `apps.name`/`apps.slug` stay null for API-created resources (the name lives on `app_versions.app_name`);
  v2 create/import patch `.name` in memory before responding — skipping it returns `name: null`.
- Create/import enforce the product's app/workflow caps (`assertResourceLimitV2`, mirroring the count
  guards); module create/rename/delete/import/export need `LICENSE_FIELD.MODULES` (`assertModulesLicensedV2`).
  Every license call passes the URL's workspace id — new create/import paths must call these first.
- Import takes exactly one version (422 `MULTIPLE_VERSIONS_NOT_SUPPORTED`) and always lands as an
  unreleased draft in the lowest environment; export returns one version (`?version_id=`, else latest).
- Versions v2 (apps/modules/workflows share one type-parameterized flow): `status: released` is
  derived from `apps.current_version_id`; `published_at`/`released_at` are written only by v2.
  Release keeps the product's production gate; promote accepts any higher environment. Promote/
  release are copied from the EE `VersionService`/`AppsService` overrides (no exported util) — keep
  them in sync. Per type: modules list the default branch only and skip the nested-draft save check;
  workflows skip git-sync filtering/tags, and deleting a version emits `app.deleted` to stop its
  schedule jobs (the product leaves them orphaned).
- Data Sources v2 read options through the default-branch DSV (`data_source_version_options`), list
  only `default`/`sample` global sources (no static built-ins, git-sync dummies, or feature-branch-only
  sources), and mask every encrypted value. Test-connection loads stored options itself (the internal
  util tests body-supplied options), runs without a user, redacts secrets, and times out after 30s.

## Related modules

- `apps`, `folders`, `folder-apps` — v2 delegates directly to these CE services/util-services
  rather than re-implementing app/folder persistence.
- `versions`, `app-environments`, `app-history`, `data-sources` — Versions/Environments/Data Sources v2
  reuse their exported utils (`VersionUtilService`, `AppEnvironmentUtilService`, `AppHistoryUtilService`,
  `DataSourcesUtilService`, `PluginsServiceSelector`).
