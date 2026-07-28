# group-permissions module

Owns workspace access-control groups: the three default role groups (Admin, Builder, End User) and
custom groups, plus the granular (per-resource) permissions attached to them. A "role" in ToolJet IS
a default group — `RolesRepository` (`@modules/roles`) is a `Repository<GroupPermissions>` filtered to
`type = 'default'`. This module manages group CRUD, group membership, group-level permission flags,
and granular permissions; the `ability` module consumes them to build `UserAllPermissions` for CASL.

## Domain terms

- **Group** — `GroupPermissions` entity → `permission_groups` table. `type`: `default` | `custom` (`GROUP_PERMISSIONS_TYPE`).
- **Role** — default group per workspace: `USER_ROLE.ADMIN | BUILDER | END_USER`. Every user has exactly one; role changes go through `roles` module, not group-user add/delete.
- **Custom Group** — admin-created group; grants extra permissions on top of a user's role. License-gated at runtime (see Edition split).
- **Group-level permission** — boolean columns on the group row (`appCreate`, `dataSourceDelete`, `orgConstantCRUD`, `tjdbCRUD`, ...).
- **Granular permission** — `GranularPermissions` entity scoping a group to specific resources; `ResourceType`: `app`, `data_source`, `workflow`, `folder`. Workspace-constant access is NOT a granular type — it's the group-level `orgConstantCRUD` flag.
- **Group admin** (EE) — a Builder assigned to administer specific custom groups (`GroupAdmin` entity).

## Key files

| File | Role |
|---|---|
| `module.ts` | `SubModule.register()`; exports `GroupPermissionsUtilService`, `GranularPermissionsUtilService`, `GroupAdminService`; imports `RolesModule` |
| `service.ts` | Group CRUD facade + audit-log `RequestContext` locals; delegates to util service |
| `util.service.ts` | Core logic: validations, `createDefaultGroups()` (workspace bootstrap), `addUsersToGroup()`, `getGroupWithBuilderLevel()`, license gating, `deleteFromAllCustomGroupUser()` |
| `repository.ts` | `GroupPermissionsRepository` — group/user/granular queries |
| `services/granular-permissions.service.ts` | Granular permission CRUD per `ResourceType` |
| `services/duplicate.service.ts` | Group duplication (CE copies app permissions only) |
| `services/group-admin.service.ts` | CE: empty stub class; all group-admin logic lives in EE override |
| `util-services/license.util.service.ts` | `GroupPermissionLicenseUtilService` — CE stub (`isCustomGroupsEnabled` → false) |
| `constants/index.ts` | `USER_ROLE`, `GROUP_PERMISSIONS_TYPE`, `ResourceType`, `DEFAULT_GROUP_PERMISSIONS`, `DEFAULT_RESOURCE_PERMISSIONS`, `FEATURE_KEY` |
| `constants/error.ts` | `ERROR_HANDLER` messages + DB-constraint mappings |
| `ability/index.ts` | `FeatureAbilityFactory` for this module's own endpoints (see Invariants) |

## Edition split

- EE override: `server/ee/group-permissions/` — services extend CE via `super()`.
  - `license.util.service.ts` reads real license terms (`LICENSE_FIELD.CUSTOM_GROUPS`, `PLAN`, promote/release features).
  - `service.ts` — `duplicateGroup` adds data_source/workflow/folder/group-admin copying; `getAllGroup` filters custom groups to those a group admin administers.
  - `constants/index.ts` overrides `DEFAULT_GROUP_PERMISSIONS` (omits `tjdbCRUD`/`appPromote`/`appRelease` keys).
  - Group-admin controllers/guards are functional only in EE (`guards/group-existance.guard.ts` populates `request.tj_admin_groups`).
- Custom groups exist as data in all editions, but management is license-gated: invalid license → mutations on custom groups throw 403 `INVALID_LICENSE`; `CUSTOM_GROUPS` feature off → listing marks them `disabled: true`; basic/starter plans are read-only (`isRestrictedPlan`).

## Invariants & gotchas

- Default groups are immutable identity: cannot rename, delete, or directly add/remove members (`DEFAULT_GROUP_NAME_UPDATE`, `DEFAULT_GROUP_UPDATE_NOT_ALLOWED`, `DELETING_DEFAULT_GROUP_USER`). Role changes route through `roles` module (`FEATURE_KEY.USER_ROLE_CHANGE`).
- End User group/users can never hold builder-level permissions; adding one to a builder-level custom group throws with the conflicting user list unless `allowRoleChange` promotes them.
- Admin group cannot have granular permissions (`ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS`).
- Cannot demote/remove the last Admin (`EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED`).
- Group names: unique per workspace (DB constraint) and role names are reserved keywords.
- `ability/index.ts`: super admins + workspace Admins get all `FEATURE_KEY`s; Builders get anything only via `request.tj_admin_groups` (populated by the EE guard — always empty in CE, so CE Builders get nothing). Group admins can never assign/revoke other group admins.
- `getAllGroupUsers`/`getAddableUser` wrap queries in `skipAppEditingVersionHydration.run(true, ...)` to muzzle `AppsSubscriber` fan-out — keep this when touching those paths.
- Terminology: user-facing/domain terms are **Builder**/**End User** (never Editor/Viewer). Legacy names survive in code: `ERROR_HANDLER.EDITOR_LEVEL_PERMISSIONS_NOT_ALLOWED`, `FEATURE_KEY.GET_ADDABLE_DS`, `isBuilderLevel`. Match existing symbols; don't coin new "editor"/"ds" names.

## Related modules

- `roles` — role (= default group) resolution and user role changes; this module imports `RolesModule`.
- `ability` — builds `UserAllPermissions` from group + granular permission rows; consumed by every CASL guard.
- `casl` / `app/guards/ability.guard.ts` — CASL plumbing that `FeatureAbilityFactory` plugs into.
- `users`, `organization-users` — group membership joins (`GroupUsers`), user archival checks.
- `app-permissions` — per-app resource permission records referenced by granular app permissions.
- `licensing` — `LicenseTermsService` (EE) and `LicenseUserService.validateUser()` after membership mutations.
