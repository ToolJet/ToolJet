# external-apis module

Owns the **External API**: a machine-to-machine REST surface (`/api/ext/...`, `/api/v2/ext/...`)
for managing Users, Workspaces, Apps, Modules, Workflows, and their Folders from outside the
product, authenticated by a static bearer token rather than a user session.

## Domain terms

- **v1** vs **v2** — v1 (`ExternalApisController`, `ExternalApisAppsController`, ...) is the
  original surface: git-sync operations, user/workspace management, curated app import/export.
  v2 (`*ControllerV2`) is a newer, workspace-scoped CRUD surface for Apps/Modules/Workflows/Folders
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

- v2 actions run as **an arbitrary admin user of the workspace** (`validateAndGetAdminUser` picks
  any admin via `GroupPermissionRepository.getAdminUserForOrg`), not as a specific authenticated
  caller — there is no per-user CASL `AbilityGuard` check here the way the internal builder API
  enforces per-app/per-resource permissions. Authorization is all-or-nothing at the
  license/feature-key level, not resource-level.
- Apps/Modules/Workflows share the `apps` table (`type` column); v2 endpoints for one type must
  never cross-resolve into another (`resolveAppByIdentifier` enforces this after the lookup, not
  as part of the query).
- `AppsUtilService.create()`'s pre-flight name-uniqueness check throws `BadRequestException` (400)
  by design for v1; v2's spec promises 409 for the same conflict, so v2 callers wrap that (and the
  equivalent import-time collision) and translate to `ConflictException` via
  `#toConflictIfNameTaken` — don't "fix" this by changing `AppsUtilService.create()` itself, that
  would change v1's contract.
- Modules v2 has no `folder_id` anywhere (request or response) — an explicit product decision, not
  a gap; don't add it without checking `api-spec-viewer.html` first.
- `AppsUtilService.create()`/`update()` leave `apps.name`/`apps.slug` null for API-created
  resources (the real name lives on `app_versions.app_name`) — every v2 create/import path patches
  `.name` in memory afterward before returning it; missing this reintroduces a `name: null` regression.

## Related modules

- `apps`, `folders`, `folder-apps` — v2 delegates directly to these CE services/util-services
  rather than re-implementing app/folder persistence.
