# external-apis module

Owns the **External API**: a machine-to-machine REST surface (`/api/ext/...`, `/api/v2/ext/...`)
for managing Users, Workspaces, Apps, Modules, and Workspace Groups from outside the product,
authenticated by a static bearer token rather than a user session.

## Domain terms

- **v1** vs **v2** — v1 (`ExternalApisController`, `...AppsController`, `...GroupsController`,
  `...ModulesController`) is the original surface: git-sync, workspace-scoped user/group
  management, curated app import/export. v2 (`*ControllerV2`) is a newer, cleaner-contract surface
  under `/api/v2/ext/...`: Users (`/users`, platform-wide), Workspaces (`/workspaces`,
  platform-wide), Workspace Users (`/workspaces/:id/users`, nested — see below). Mounted side by
  side with v1.
- **Identifier resolution** — `:userIdentifier` accepts an id, then falls back to email
  (`resolveUserByIdentifier`); `:workspaceIdentifier` accepts an id, then slug, then name
  (`resolveWorkspaceByIdentifierV2`) — no status filter, so an archived workspace still resolves.
- **Users v2 vs Workspace Users v2** — both wrap a `User`/`OrganizationUser` pair but serve
  different callers. Users v2 is platform-wide account management (archiving cascades to every
  membership). Workspace Users v2 is membership management scoped to one workspace (`role`,
  workspace-scoped `status`, custom groups) — archiving a Workspace User only touches that one
  `OrganizationUser` row. Don't conflate the two archive semantics.

## Key files

| File | Role |
|---|---|
| `module.ts` | `register()` — `getProviders()`'s file list + `controllers` array is the actual wiring; a new controller does nothing until added to both |
| `Interfaces/IController.ts` | Interfaces the CE stubs implement and EE controllers extend/override |
| `dto/index.ts` | All v1 + v2 request/response DTOs |
| `constants/index.ts`, `constants/feature.ts`, `types/index.ts` | `FEATURE_KEY` enum + `FEATURES` config (license/gating) + the `Features` interface forcing every key to be mapped |
| `controllers/*.v2.ts` (CE) | Stub controllers, no HTTP decorators — CE never registers these routes |
| `ee/external-apis/controllers/*.v2.ts`, `service.ts`, `util.service.ts` | Real v2 implementation |

## Edition split

CE only defines v2 interfaces/DTOs/stub controllers — no route decorators, so CE 404s, not 501.
`ee/external-apis/controllers/*.v2.ts` extend the CE stubs and add the real decorators +
`ExternalApiSecurityGuard` + `InitFeature`. Gating is two-layered: `FeatureAbilityGuard`
(license on the plan — CE 404s, starter 451s) then `ExternalApiSecurityGuard` (bearer token).

**Workspaces v2 is different** (`workspaces.controller.v2.ts`). It accepts a workspace PAT
(`Bearer tj_pat_…`) or the shared secret (`Basic …`):
- **Guard order:** class-level `ExternalApiAuthGuard` (`ee/external-apis/guards/`) runs before the
  permission guard. It sets `req.tj_auth` (`'pat'` | `'api_key'`) and `req.tj_workspace`
  (`:workspaceIdentifier`, resolved once).
- **Shared secret:** `AbilityGuard` sees `tj_auth === 'api_key'` and checks only the instance licence.
- **PAT callers:** go through CASL in the organizations ability (next section).
- **Reads:** list and get are limited to the caller's active memberships unless super admin.
- **Audit events:** these routes write them (`audit-logs/AGENTS.md`).

### Where v2 permissions live

A v2 resource's feature keys, `FeatureConfig` (licence, audit spec) and CASL rules live in its
**domain module**, beside the dashboard's — not in this module. Workspaces v2 is the reference:
- **Keys, config and rules:** `organizations/constants` (keys + config) and
  `organizations/ability/index.ts` (rules). One `can([DASHBOARD_KEY, V2_KEY])` per shared predicate;
  v2-only conditions sit next to it.
- **Controller:** stays in `ExternalApiModule` (moving it would cycle: the auth guard needs
  `ExternalApiUtilService`). It declares `@InitModule(MODULES.ORGANIZATIONS)` and uses
  `@ee/organizations/ability/guard`.
- **Factory:** `ModuleRef.resolve` is strict, so `module.ts` provides the domain's edition factory
  (`getProviders(configs, 'organizations', ['ability'])`), as `setup-organization` and `app-git` do.

To move another v2 resource when it gets PAT support:
- **One controller has one module id.** Split controllers that span domains; Users v2 spans `USER`
  and `ORGANIZATION_USER`.
- **Per-resource rules** (apps, modules, folders, groups, versions, data sources) read `tj_app` /
  `tj_resource_id`. Resolve the path identifier into them before the permission guard, as
  `ExternalApiAuthGuard` does with `tj_workspace`, or non-admins are always denied.
- **Session PATs** (`PatScopeInterceptor`) are scoped by the domain module's bundle once the id
  changes. Bearer PATs are not.

| v2 resource | Domain module | Dashboard keys it shares rules with |
|---|---|---|
| Workspaces | `ORGANIZATIONS` | `CREATE`, `UPDATE`, `GET`, `WORKSPACE_ARCHIVE`/`UNARCHIVE`, `SET_DEFAULT` |
| Workspace Users | `ORGANIZATION_USER` | `USER_INVITE`, `USER_BULK_UPLOAD`, `USER_UPDATE`, `USER_ARCHIVE`/`UNARCHIVE`, `VIEW_ALL_USERS` |
| Users (instance) | `USER` + `ORGANIZATION_USER` | `GET_ALL_USERS`, `UPDATE_USER_TYPE_INSTANCE`, `USER_ARCHIVE_ALL`/`UNARCHIVE_ALL` |
| Apps | `APP` | `CREATE`, `UPDATE`, `DELETE`, `GET_ONE`, `GET`; release → `RELEASE` |
| App import / export | `IMPORT_EXPORT_RESOURCES` | `APP_RESOURCE_IMPORT`, `APP_RESOURCE_EXPORT` |
| Modules | `MODULES` | `CREATE_MODULE`, `IMPORT_MODULE`, `UPDATE_MODULE`, `DELETE_MODULE`, `EXPORT_MODULE` |
| Folders | `FOLDER` | `CREATE_FOLDER`, `UPDATE_FOLDER`, `DELETE_FOLDER` |
| Groups | `GROUP_PERMISSIONS` | group CRUD and member features |
| Constants | `ORGANIZATION_CONSTANT` | `CREATE`, `UPDATE`, `DELETE`, `GET_SECRETS` |
| Versions | `VERSION` | `APP_VERSION_CREATE`/`UPDATE`/`DELETE`, `PROMOTE` |
| Data sources | `GLOBAL_DATA_SOURCE` | `GET`, `TEST_CONNECTION`, `QUERIES_LINKED_TO_DATASOURCE` |

## Invariants & gotchas

- **Archive/unarchive are symmetric by design** for Users v2: both the dedicated
  `.../archive`/`.../unarchive` endpoints and `PATCH .../users/:id { status }` cascade to *every*
  `OrganizationUser` row, not just the default workspace — a deliberate divergence from v1's
  `updateUser`, whose status-patch archives all memberships but only *unarchives* the default-org
  one. Don't "fix" v2 to match that asymmetry. `setUserArchivedV2` is the shared implementation.
  `PATCH { status }` only accepts `active`/`archived` — `invited`/`verified` are rejected (400),
  since folding a third state into a binary archived/active toggle silently mis-maps it.
  Archive/unarchive 409 if the user is already in the target state.
- `POST .../archive` and `.../unarchive` return NestJS's default **201**, not 200 — kept as the
  framework default rather than overridden, documented as deliberate in `users-v2.e2e-spec.ts`.
- **Workspaces v2**: the first workspace ever created is automatically `default`
  (`existingWorkspaceCount === 0`, not race-safe but adequate at this scale). `default` only moves
  forward — `{default:false}` rejected (422), `{default:true}` on an archived or already-default
  workspace rejected (422 / 409), archiving the current default rejected (409). Creation
  bootstraps default groups + environments (`createDefaultGroups`, `createDefaultEnvironments`)
  in the same transaction — skipping this leaves the workspace unable to accept a Workspace User.
- **Workspace Users v2 create is direct-active**: `CreateWorkspaceUserV2Dto` requires a `password`,
  membership is `active` immediately, no invite flow. If the email already belongs to a platform
  `User`, that row is reused and `password` is ignored — but a **platform-archived** user cannot
  be reused this way (`#createWorkspaceUserEntryV2` rejects it, mirroring
  `replaceUserWorkspaceRelations`'s "unarchive the user from the Instance" guard); re-granting
  workspace access to an archived account must go through Users v2 unarchive first.
- **Bulk create/update** (`POST`/`PATCH .../users/bulk`) accept JSON or CSV on the same route
  (`@Body() body: any` — the global `ValidationPipe` would otherwise reject an empty CSV body);
  CSV columns must be exactly `name,email,password,role`. Both converge on
  `#createWorkspaceUserEntryV2`/`#updateWorkspaceUserEntryV2`, sequential (not parallel), each
  entry pre-checked before writing since a mid-batch constraint violation would abort the shared
  transaction. Both return **207** with a `created`/`updated` + `errors` breakdown; a non-domain
  error is logged server-side and replaced with a generic message, never forwarded raw.
- **License limits** (seat/workspace count, 451) are checked post-mutation, same transaction, at
  every v2 write site except `unarchiveUserV2` (deliberate gap — its cross-workspace cascade
  needs its own partial-success design). Bulk create/update alone must **compensate** (revert
  exactly what the failing entry wrote) before reporting a per-entry `LICENSE_LIMIT_REACHED`
  error, since elsewhere the 451 just propagates and the outer transaction rolls back. Bulk
  create short-circuits the rest of the batch on a limit hit; bulk update does not (only
  role-changing entries hit the check).
- **Guard metadata is inherited.** Never put class-level `@UseGuards` on a CE stub controller
  whose EE subclass needs its own guard order: `@UseGuards` appends to the parent's list, so the
  stub's guards run first.
- **Workspace Users v2 group listing is custom groups only** — excludes the default role groups
  (admin/builder/end-user), surfaced instead via the `role` field on the Workspace User itself.

## Related modules

- `organizations` — owns the Workspaces v2 feature keys, config and permission rules.
- `audit-logs` — the `denied` hook and the `audit_events` table.
- `personal-access-tokens` — `authenticatePatRequest` is shared with `PatAuthGuard`.
- `users`, `organizations` (Organization = Workspace) — v2 Users delegates directly to `User`/
  `OrganizationUser` entity operations rather than a `UsersService`/`OrganizationsService` layer.
