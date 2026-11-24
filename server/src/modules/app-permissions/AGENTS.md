# app-permissions module

Owns **app permissions** below the app level: restricting a Page, Component or Query to specific
users or user groups, and **View as**, which lets a Builder preview an app with another user's or
group's permissions without logging in as them. Enforcement happens in EE when an app is loaded or
run in view mode (preview and released app); CE stores nothing and enforces nothing.

## Domain terms

- **Access rule**: one `*_permissions` row per page/component/query (`PAGE_PERMISSION_TYPE`):
  `GROUP` (rows in `*_users.permission_groups_id`), `SINGLE` (rows in `*_users.user_id`) or `ALL`.
  No row means unrestricted. Only `permissions[0]` is read.
- **Permission subject** (`types/view-as.ts`): who rules are evaluated for. Usually the requester;
  in View as, another workspace user (`kind: 'user'`) or a set of groups (`kind: 'groups'`).
- **App groups**: the subject's groups that can view or edit the app (`findUserGroupsWithAppAccess` /
  `findGroupsWithAppAccess` in `group-permissions/repository.ts`). `GROUP` rules match these only.

## Key files

| File | Role |
|---|---|
| `controller.ts` / `service.ts` | CRUD for page/query/component rules; CE stubs throw |
| `util.service.ts` | CE stubs. EE (`ee/app-permissions/util.service.ts`) adds `checkQueryAccess(For)`, `getSubjectAppGroupIds`, and the pure `isResourceAvailableTo` rule |
| `view-as.service.ts` | CE: always the requester. EE: parses and authorizes the `x-tj-view-as` header (`VIEW_AS_HEADER`). Registered under the CE class token, so CE and EE code inject the same one |
| `view-as.interceptor.ts` | `@ResolveViewAs()` (route opt-in) + `@ViewAsSubject()` (handler param): resolves the header once per request |
| `ability/index.ts` | who may manage rules: workspace admins, or Builders who can edit the app |
| `repositories/*` | rule rows per entity type |

## View as (EE)

Header `x-tj-view-as: user:<uuid>` or `group:<uuid>` (one user or one group, never combined). Read by exactly three routes:
`GET /v2/apps/:id/versions/:versionId?mode=view`, `GET /data-queries/:versionId?mode=view` and
`POST /data-queries/:id/versions/:versionId/run/:environmentId?mode=view`. Each is marked
`@ResolveViewAs()`: `ViewAsInterceptor` runs `ViewAsService.resolve()` after the guards and the
handler takes the result with `@ViewAsSubject()`. Services receive a `PermissionSubject`, never the
raw header, and use it for page/component/query rules and the data source `can_run_query` rule
(`ee/data-queries/util.service.ts` `throwIfQueryRunRestricted`). A new route that should honour
View as needs both decorators; `@ViewAsSubject()` without `@ResolveViewAs()` throws.

## Invariants & gotchas

- View as only changes the **subject of permission checks**. Session, data source credentials and
  `user` passed to plugins stay the requester's: it is not impersonation.
- `resolve()` rejects unless: view mode, front-end app, same workspace, licensed (VALID and any
  `APP_PERMISSIONS_*`), requester can manage the app's permissions (same rule as `ability/index.ts`),
  and the target is an active member or groups of the app's workspace that can open the app.
  "Not found" and "other workspace" return the same 400, so the header can't probe for ids.
- Released apps (`GET /apps/slugs/:slug`, `POST /data-queries/:id/run`) and embedded modules
  (`getVersionByStableIds`) never read the header. Keep it that way; it is part of the security model.
- Embedded modules are never simulated: EE `getVersion` evaluates the modules it bundles for the
  requester (`prepareResponse(..., isModule)`), matching their query runs, which the client sends
  without the header.
- Simulated version responses send `Cache-Control: no-store` and skip the released-version ETag
  (`versions/controller.v2.ts`): the ETag doesn't include the header.
- Simulated groups have no user id, so `SINGLE` rules never match them.
- Admins are not exempt from page/component/query rules (only from `can_run_query`).
- Code mode apps (`build_mode = 'code'`) exempt whoever can edit the app from their limits (`ee/app-permissions/code-app-limits.ts`). That exemption is the requester's, so a View as request never gets it: the simulated subject is held to the limits in `getVersion`, `getAll` and query runs.
- Audit: `APP_PREVIEW_VIEW_AS` on version loads; query runs add `metadata.viewAs`.
- Simulated version responses carry `view_as` (`ViewAsIdentity`: kind, id, label, custom `groups`,
  `role`), the session's shape, so the client mirrors `globals.currentUser.groups`/`role`. A custom
  group simulates an end user in it; a role group simulates that role. No `view_as` = not simulated.
- Frontend: `frontend/src/AppBuilder/_helpers/viewAs.js` (sessionStorage per app, header, currentUser),
  `Viewer/ViewAs/` (picker in Preview settings + chip), `viewAsSlice`; applied by `useAppData`.

## Related modules

- `versions` (EE `getVersion` filters pages/components/queries), `data-queries` (run-time checks),
  `group-permissions` (group membership and app access), `apps` (`getBySlug`, released filtering).

Tests: `ee/test/modules/app-permissions/` (unit: header + rule; e2e: security matrix).
