# app-environments module

Owns `AppEnvironment` (development → staging → production, priority-ordered, per Workspace) and the endpoints the App Builder uses to initialise its environment/version state. Version lifecycle lives in the versions module; this module only reads versions to answer "which version is the editor on for this environment".

## Domain terms

- **Environment** — `AppEnvironment` (`app_environments`), one set per Workspace (`organizationId`). `priority` 1 = development; `isDefault` = production. Multi-environment is EE-licensed (`LICENSE_FIELD.MULTI_ENVIRONMENT`).
- **Editor environment/version** — the pair the App Builder is currently showing; computed by `init` and the `post-action` endpoints.

## Key files

| File | Role |
|---|---|
| `controller.ts` | `GET init`, `GET /`, `GET :id/versions`, `POST post-action/:action`, `GET :id`, `GET default` |
| `service.ts` | `init`, `processActions` (`version_deleted`, `environment_changed`), `getAll`, `getVersionsByEnvironment` |
| `util.service.ts` | `assertOwnedByOrganization`, `getAll`, `get` (memoised per request), `getSelectedVersion`, `init` |
| `ability/` | Feature-level CASL only (role → feature key). No per-resource ownership. |
| `guards/public_app_environment.guard.ts` | Lets public-app viewers call `GET :id` / `GET default` without a session |

## Edition split

- EE override: `server/ee/app-environments/` — controller/service/util extend CE. EE `init` adds the auto-promote-on-license-upgrade write and per-environment access fallback; EE `processActions` adds environment access checks.
- `getVersionsByEnvironment` is inherited by EE unchanged.

## Invariants & gotchas

- **Every client-supplied app / version / environment id must be verified against `user.organizationId` in the service before it is used.** The ability guard does not do this. Use `assertOwnedByOrganization` (throws 404, not 403, so foreign ids aren't confirmed to exist). `init` does it in the query itself (`where: { id, app: { organizationId } }`).
- Do not put the ownership check in `util.getAll`: it has many internal callers (data-sources, versions, org-constants, import/export) that pass trusted ids.
- TypeORM drops `undefined` from `where`. An omitted `app_id` / id param therefore widens the query to every workspace instead of failing — `getVersionsByEnvironment` rejects a missing `app_id` with 400 for this reason. Check for absent params, not just foreign ones.
- Missing rows must surface as `NotFoundException`. `EntityNotFoundError` (from `findOneOrFail`) is not an `HttpException`, so `AllExceptionsFilter` turns it into a 500.
- The frontend reads `response.editorVersion.app.id` from EE `init`; keep the `app` relation loaded.
- `GET :id` / `GET default` are already workspace-scoped through `get(organizationId, …)`.

## Related modules

- `versions` — owns `AppVersion`; `currentEnvironmentId` links a version to an environment.
- `data-sources`, `organization-constants` — call `AppEnvironmentUtilService.getAll` with trusted org ids.
