# personal-access-tokens module

Owns personal access tokens (PATs) and their exchange for workspace sessions.

## Key files

- `constants/scopes.ts`: capability bundles, the workspace PAT ceiling, and the app-pinned viewer surface.
- `interceptors/pat-scope.interceptor.ts`: global scope enforcement after authentication guards.
- `../app/module.ts`: registers `PatScopeInterceptor` globally.
- `../../../test/modules/personal-access-tokens/`: scope unit tests and session e2e tests.

## Invariants

- Workspace PATs can reach Apps, Data, Workflows, and the explicitly allowed Workspace Users features.
- Workflow creation, execution, status, and node routes use the existing module metadata; do not add controller-specific PAT checks.
- Scope access never overrides owner permissions or edition/license gates.
- Unassigned modules and routes without module metadata fail closed.
- Credential modules are never grantable; a PAT must not mint another PAT.
- Minting (`POST /personal-access-tokens`) is gated by the `CREATE_PAT` feature ability: `isAdmin || superAdmin || patCreate`. The token binds to the request workspace (`user.organizationId`); a body `organizationId` is ignored.
- The AI app builder's service token (`getOrCreateServicePat`) never passes through that gate and is hidden from the list.
- `PAT_CREATE` audit is set in `createPat` via `AUDIT_LOGS_REQUEST_CONTEXT_KEY`. `PAT_REVOKE` is registered on `DELETE_PAT` but not emitted yet.
- Browser sessions and embed sessions (`patScope='app'`) are exempt from this workspace ceiling.

## Session kinds

The discriminator is the pair `(patScope, patAppId)`, never `patAppId` alone — once a workspace
token can pin a session to an app, "has an appId" stops meaning "is an embed session".

| `patScope` | `appId` | Session | Ceiling |
|---|---|---|---|
| `app` | set | embed viewer | unrestricted; the token is bound to the app row, so the binding is the scope |
| `workspace` | set | app-pinned render check | `PAT_APP_VIEWER_MODULES`, pinned to that one app, read-only |
| `workspace` | none | automation | `PAT_ALLOWED_BUNDLES` |

- `PAT_APP_VIEWER_MODULES` is deliberately NOT a `PAT_BUNDLE`: bundles partition the module space
  and exclude the credential surface, while the viewer list overlaps `APPS` (APP, VERSION) and
  includes `AUTH`.
- An app-pinned session must never reach more than the same token without an `appId`, except the
  listed viewer-only boot reads. A module with any GET on a workspace-level path enters
  `PAT_APP_VIEWER_MODULES` only with a feature narrowing in `PAT_APP_VIEWER_FEATURES`.
- The app pin reads `request.tj_app` first (guards resolve the app for slug and query routes, which
  carry no uuid in the path) and falls back to matching `/apps/<uuid>` in the URL.
