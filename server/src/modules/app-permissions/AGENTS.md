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
| `view-as.service.ts` | CE: always the requester. EE: parses and authorizes the `x-tj-view-as` header (`VIEW_AS_HEADER`) |
| `ability/index.ts` | who may manage rules: workspace admins, or Builders who can edit the app |
| `repositories/*` | rule rows per entity type |

## View as (EE)

Header `x-tj-view-as: user:<uuid>` or `groups:<uuid>[,<uuid>...]` (max 20). Read by exactly three routes:
`GET /v2/apps/:id/versions/:versionId?mode=view`, `GET /data-queries/:versionId?mode=view` and
`POST /data-queries/:id/versions/:versionId/run/:environmentId?mode=view`. Callers thread it into
`ViewAsService.resolve()` and use the returned subject for page/component/query rules and the
data source `can_run_query` rule (`ee/data-queries/util.service.ts` `throwIfQueryRunRestricted`).

## Invariants & gotchas

- View as only changes the **subject of permission checks**. Session, data source credentials and
  `user` passed to plugins stay the requester's: it is not impersonation.
- `resolve()` rejects unless: view mode, front-end app, same workspace, licensed (VALID and any
  `APP_PERMISSIONS_*`), requester can manage the app's permissions (same rule as `ability/index.ts`),
  and the target is an active member or groups of the app's workspace that can open the app.
  "Not found" and "other workspace" return the same 400, so the header can't probe for ids.
- Released apps (`GET /apps/slugs/:slug`, `POST /data-queries/:id/run`) and embedded modules
  (`getVersionByStableIds`) never read the header. Keep it that way; it is part of the security model.
- Simulated version responses send `Cache-Control: no-store` and skip the released-version ETag
  (`versions/controller.v2.ts`): the ETag doesn't include the header.
- Simulated groups have no user id, so `SINGLE` rules never match them.
- Admins are not exempt from page/component/query rules (only from `can_run_query`).
- Audit: `APP_PREVIEW_VIEW_AS` on version loads; query runs add `metadata.viewAs`.

## Related modules

- `versions` (EE `getVersion` filters pages/components/queries), `data-queries` (run-time checks),
  `group-permissions` (group membership and app access), `apps` (`getBySlug`, released filtering).

Tests: `ee/test/modules/app-permissions/` (unit: header + rule; e2e: security matrix).
