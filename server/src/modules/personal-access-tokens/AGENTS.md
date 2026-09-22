# personal-access-tokens module

Owns personal access tokens (PATs) and their exchange for workspace sessions.

## Key files

- `constants/scopes.ts`: capability bundles and the workspace PAT access ceiling.
- `interceptors/pat-scope.interceptor.ts`: global scope enforcement after authentication guards.
- `../app/module.ts`: registers `PatScopeInterceptor` globally.
- `../../../test/modules/personal-access-tokens/`: scope unit tests and session e2e tests.

## Invariants

- Workspace PATs can reach Apps, Data, Workflows, and the explicitly allowed Workspace Users features.
- Workflow creation, execution, status, and node routes use the existing module metadata; do not add controller-specific PAT checks.
- Scope access never overrides owner permissions or edition/license gates.
- Unassigned modules and routes without module metadata fail closed.
- Credential modules are never grantable; a PAT must not mint another PAT.
- Browser sessions and app-scoped embed sessions are exempt from this workspace ceiling.
