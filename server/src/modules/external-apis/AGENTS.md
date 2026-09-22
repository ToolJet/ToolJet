# external-apis module

Owns the **External API**: a machine-to-machine REST surface (`/api/ext/...`, `/api/v2/ext/...`)
for managing Users, Workspaces, Apps, Modules, and Workspace Groups from outside the product,
authenticated by a static bearer token rather than a user session.

## Domain terms

- **v1** vs **v2** — v1 (`ExternalApisController`, `ExternalApisAppsController`,
  `ExternalApisGroupsController`, `ExternalApisModulesController`, ...) is the original surface:
  git-sync operations, workspace-scoped user/group management, curated app import/export. v2
  (`*ControllerV2`) is a newer surface under `/api/v2/ext/...` for resources whose shape differs
  enough from v1 to need a clean contract: Users (`/api/v2/ext/users`, platform-wide), Workspaces
  (`/api/v2/ext/workspaces`, platform-wide), and Workspace Users (`/api/v2/ext/workspaces/:id/users`,
  nested under a workspace — a distinct resource from platform-wide Users, see below). v1 and v2
  are mounted side by side; v2 doesn't replace v1.
- **Identifier resolution** — v2 Users' and Workspace Users' `:userIdentifier` accept an id, then
  fall back to email (`resolveUserByIdentifier`); Workspaces' `:workspaceIdentifier` accepts an id,
  then falls back to slug, then name (`resolveWorkspaceByIdentifierV2`) — no status filter, so an
  archived workspace still resolves. No slug/name tier for users since users don't have one.
- **Users v2 vs Workspace Users v2** — two distinct resources that both wrap a `User`/
  `OrganizationUser` pair but serve different callers. Users v2 is platform-wide account
  management (no workspace in the URL, archiving cascades to every membership the user has).
  Workspace Users v2 is membership management scoped to one workspace (`role`, workspace-scoped
  `status`, workspace-scoped custom groups) — archiving a Workspace User only affects that one
  `OrganizationUser` row, not the user's other workspace memberships or their platform-wide
  `User.status`. Don't conflate the two archive semantics.

## Key files

| File | Role |
|---|---|
| `module.ts` | `register()`; `getProviders()`'s file list + `controllers` array is the actual wiring — a new controller file does nothing until added to both |
| `Interfaces/IController.ts` | Interfaces the CE stub controllers implement and the EE controllers extend/override |
| `dto/index.ts` | All v1 + v2 request/response DTOs |
| `constants/index.ts`, `constants/feature.ts`, `types/index.ts` | `FEATURE_KEY` enum + `FEATURES` config (license/gating per action) + the `Features` interface that forces every key to be mapped |
| `controllers/users.controller.v2.ts`, `workspaces.controller.v2.ts`, `workspace-users.controller.v2.ts` (CE) | Stub controllers — routes exist on the CE interface but every method throws `Method not implemented`; no HTTP decorators, so CE never registers these routes at all |
| `ee/external-apis/controllers/{users,workspaces,workspace-users}.controller.v2.ts`, `service.ts`, `util.service.ts` | Real v2 implementation |

## Edition split

- CE only defines the v2 interfaces/DTOs/stub controllers — no route decorators, so the routes
  don't exist on CE builds at all (404, not 501).
- `server/ee/external-apis/controllers/users.controller.v2.ts` extends the CE stub class and adds
  the real `@Get`/`@Patch`/`@Post` decorators + `ExternalApiSecurityGuard` + `InitFeature`, calling
  into `ee/external-apis/service.ts` for the actual logic, which in turn delegates to
  `ee/external-apis/util.service.ts` for resolution/mutation primitives.
- Gating is two-layered: `FeatureAbilityGuard` (from the CE `@UseGuards` on the stub, inherited by
  the EE subclass) checks the license field is on the plan at all (CE 404s, starter plan 451s);
  `ExternalApiSecurityGuard` then checks the bearer token itself.

## Invariants & gotchas

- Users v2's archive/unarchive are **symmetric by design**: both the dedicated
  `POST .../archive` / `.../unarchive` endpoints and a `PATCH .../users/:id { status }` change
  cascade to *every* `OrganizationUser` row the user has, not just their default workspace. This
  is a deliberate divergence from v1's `updateUser` (`ee/external-apis/util.service.ts`), whose
  status-patch archives all memberships but only *unarchives* the default-org one — don't "fix"
  v2 to match that asymmetry, and don't change v1's behavior to match v2.
  `ExternalApiUtilService.setUserArchivedV2` is the shared symmetric implementation both the
  dedicated endpoints and the PATCH path call into.
- `POST .../archive` and `.../unarchive` return NestJS's default **201**, not the spec doc's 200 —
  kept as the framework default rather than overridden with `@HttpCode(200)`; test file
  `users-v2.e2e-spec.ts` documents this as a deliberate deviation, not a bug.
- Archive/unarchive 409 if the user is already in the target state — this check is new v2-only
  logic in `setUserArchivedV2`, not present in v1's `updateUser`.
- **Workspaces v2**: the first workspace ever created on the platform is automatically `default`
  (`existingWorkspaceCount === 0` check in `createWorkspaceV2`, not race-safe but adequate at this
  scale). `default` can only move forward — `PATCH { default: false }` is rejected (422; make a
  different workspace default instead), `default: true` on an archived workspace is rejected (422),
  and archiving the current default is rejected (409, both via `PATCH { status: 'archived' }` and
  the dedicated archive endpoint) — always mark another workspace default first.
  `OrganizationRepository.changeDefaultWorkspace` does the atomic swap.
- **Workspaces v2 creation bootstraps default groups + environments**: `ExternalApisService
  .createWorkspaceV2` calls `groupPermissionsUtilService.createDefaultGroups` and
  `appEnvironmentUtilService.createDefaultEnvironments` right after `util.service`'s
  `createWorkspaceV2`, mirroring what `SetupOrganizationsUtilService.create` does for
  product-created workspaces. Skipping this would leave a v2-API-created workspace unable to
  accept a Workspace User (role assignment needs the default group to exist) or an app.
- **Workspace Users v2 create is direct-active, not invite-based**: `CreateWorkspaceUserV2Dto`
  requires a `password` and the resulting membership is `active` immediately — no invitation email,
  no invitation token. This is deliberately different from v1's `createUser` invite flow. If the
  email already belongs to a platform user, that `User` row is reused and `password` is ignored;
  only a brand-new user gets the supplied password.
- **Workspace Users v2 bulk create accepts JSON or CSV on the same route**
  (`POST .../users/bulk`): the controller types `@Body() body: any` instead of a strict DTO because
  the global `ValidationPipe` (`main.ts`) would otherwise reject an empty body on the CSV path.
  Both paths converge on `ExternalApiUtilService#createWorkspaceUserEntryV2`, with each entry
  manually validated via `class-validator`'s `validate()` before being written — CSV columns must
  be exactly `name,email,password,role` (no `userDetails` support in CSV). Processing is
  *sequential*, not parallel, and every entry pre-checks for an existing membership before writing
  — this is intentional: a real DB constraint violation mid-batch would abort the shared
  transaction for every subsequent entry, so failures must be caught before they reach the DB, not
  after. Bulk update (`PATCH .../users/bulk`, JSON-only) follows the same shared-entry-function
  pattern via `#updateWorkspaceUserEntryV2`. Both bulk endpoints return **207 Multi-Status** with a
  `created`/`updated` + `errors` breakdown — there's no plain success status for a bulk request.
- **Workspace Users v2 group listing is custom groups only**:
  `GroupPermissionsRepository.getAllUserGroups` filters to `GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP`,
  matching the spec's "Workspace Groups" concept — it deliberately excludes the default role groups
  (admin/builder/end-user), which are surfaced instead via the `role` field on the Workspace User
  itself.
- **Local dev DB gotcha**: `ormconfig.ts`'s `getEnvVars()` loads `.env` or `.env.test` from disk
  and those file values *override* already-exported shell env vars (`{...process.env,
  ...dotenv.parse(file)}`), and which file loads depends on `NODE_ENV`. Separately, `migrations:
  []` when `NODE_ENV === 'test'` means schema migrations never run in test mode — they're expected
  pre-applied. If e2e tests suddenly fail with a `column "..." does not exist` error, the local
  test DB's schema has drifted from `migrations`'s bookkeeping table (TypeORM's runner only checks
  the latest-executed migration's timestamp, not each migration individually, so a migration
  landing with an earlier timestamp than one already marked executed gets silently skipped
  forever). Fix by temporarily pointing `.env`'s `PG_DB` at the test database and running
  `NODE_ENV=development npm run db:migrate` (real migrations array, correct DB), then reverting
  `PG_DB`. When drift is bad enough, drop and recreate the test database instead of chasing
  individual missing columns.

## Related modules

- `users`, `organizations` (Organization = Workspace) — v2 Users delegates directly to `User`/
  `OrganizationUser` entity operations rather than a `UsersService`/`OrganizationsService` layer.
