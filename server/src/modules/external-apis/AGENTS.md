# external-apis module

Owns the **External API**: a machine-to-machine REST surface (`/api/ext/...`, `/api/v2/ext/...`)
for managing Users, Workspaces, Apps, Modules, and Workspace Groups from outside the product,
authenticated by a static bearer token rather than a user session.

## Domain terms

- **v1** vs **v2** — v1 (`ExternalApisController`, `...AppsController`, `...GroupsController`,
  `...ModulesController`) is the original surface: git-sync, workspace-scoped user/group
  management, curated app import/export. v2 (`*ControllerV2`) is a newer, cleaner-contract surface
  under `/api/v2/ext/...`: Users (`/users`, platform-wide), Workspace Users
  (`/workspaces/:id/users`, nested — see below). Workspaces v2 (`/workspaces`) lives in its domain
  modules, see "Where v2 routes live". Mounted side by side with v1.
- **Identifier resolution** — `:userIdentifier` accepts an id, then falls back to email
  (`resolveUserByIdentifier`); `:workspaceIdentifier` accepts an id, then slug, then name
  (`OrganizationRepository.findByIdentifier`) — no status filter, so an archived workspace still resolves.
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
| `ee/external-apis/guards/external-api-auth.guard.ts` | PAT or shared secret; sets `tj_auth`, `tj_workspace`. Injects only `ConfigService` + `OrganizationRepository`, so any module can use it |
| `helpers/pagination-headers.ts` | `X-Total-Count` and `Link` headers for v2 lists |

## Edition split

CE only defines v2 interfaces/DTOs/stub controllers — no route decorators, so CE 404s, not 501.
`ee/external-apis/controllers/*.v2.ts` extend the CE stubs and add the real decorators +
`ExternalApiSecurityGuard` + `InitFeature`. Gating is two-layered: `FeatureAbilityGuard`
(license on the plan — CE 404s, starter 451s) then `ExternalApiSecurityGuard` (bearer token).

**PAT-enabled v2 routes** (Workspaces today) use class-level `ExternalApiAuthGuard`, which accepts a
workspace PAT (`Bearer tj_pat_…`) or the shared secret (`Basic …`) and runs before the permission
guard. Shared-secret callers get only the instance-licence check (`AbilityGuard`, `tj_auth === 'api_key'`);
PAT callers go through the domain module's CASL rules. These routes write audit events (`audit-logs/AGENTS.md`).

### Where v2 routes live

A v2 route lives in the **module that owns its dashboard counterpart**, as a sibling
`*.controller.v2.ts` (CE stub + EE subclass), and calls that module's service. Workspaces v2 is the
reference: create in `setup-organization`, the rest in `organizations`.
- **Keys, config and CASL rules** sit beside the dashboard's in the domain module. One
  `can([DASHBOARD_KEY, V2_KEY])` per shared predicate; v2-only conditions sit next to it.
- **Writes reuse the dashboard's service functions.** Create, update, archive, delete and the like
  must call the same function the dashboard calls, refactored if needed (optional `manager`, optional
  actor, target id instead of session) so both controllers share it. The `*V2` method adds only the
  v2 contract: identifier lookup, v2-only rules, status-code mapping (e.g. dashboard 406 → v2 409),
  response shape. Never write entities directly in a `*V2` method when a dashboard service does that
  write. Reads (list/get) may use new query functions when the dashboard's is hard to reuse.
  v2 methods go in the CE base service so the EE subclass inherits them under the module's token.
- **v2 features set `skipAuditLogs: true`.** They are audited through `audit_events`; the shared
  services also set legacy audit locals for the dashboard.
- **One controller class has one URL prefix and one module id.** A resource whose dashboard routes
  span modules gets one v2 controller per module; Users v2 spans `USER` and `ORGANIZATION_USER`.
- **Per-resource rules** (apps, modules, folders, groups, versions, data sources) read `tj_app` /
  `tj_resource_id`. Resolve the path identifier before the permission guard, as
  `ExternalApiAuthGuard` does with `tj_workspace`, or non-admins are always denied.

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

- `organizations`, `setup-organization` — own the Workspaces v2 routes, rules and service methods.
- `audit-logs` — the `denied` hook and the `audit_events` table.
- `personal-access-tokens` — `authenticatePatRequest` is shared with `PatAuthGuard`.
- `users`, `organizations` (Organization = Workspace) — v2 Users delegates directly to `User`/
  `OrganizationUser` entity operations rather than a `UsersService`/`OrganizationsService` layer.
