# mcp-oauth module

Owns external MCP client registration, browser consent, rotating credentials and constrained ToolJet delegation.
Deployment and protocol configuration lives in `ToolJet/tooljet-mcp`, `docs/oauth.md`.

## Boundaries

- `service.ts` owns the flows; `protocol.ts` validates protocol inputs; `engine.ts` adapts the OAuth engine to `store.ts`.
- `claims.ts` is shared by credential signing and runtime validation. Viewer credentials use a distinct audience, are app-pinned, and cannot become browser sessions, PATs or full delegations.
- `dto.ts` defines the browser API contracts. Map database rows explicitly; preserve existing wire fields when storage changes.
- Scope checks in `scope.interceptor.ts` share the PAT capability ceiling. They never replace the user's current permissions, workspace binding or edition gates.
- Only the configured MCP service may exchange an access token. A mismatched exchange secret returns `401 invalid_client` internally; the MCP boundary reports a service failure (503) without a user login challenge. Never log secrets or credential bodies.

## Revocation and concurrency

- The triggers in `migrations/1791290000000-AddMcpOAuthRevocationHooks.ts` (relative to `server/`) revoke grants in the same transaction as watched local security changes. The watched tables cover users, organizations, memberships, workspace bans, client disabling, SSO, OIDC group sync and selected instance settings. Instance user bans are not currently hooked.
- Grant insertion takes the shared `mcp-oauth-security-policy` advisory transaction lock. Relevant security changes take its exclusive side. Consent rechecks policy while holding that lock; preserve this ordering guarantee when changing concurrency behavior.
- Token rotation locks the grant row. Authenticated replay of a consumed code or refresh token revokes the entire grant, including derived credentials. Client authentication precedes replay detection so a wrong client secret cannot revoke someone else's grant. There is currently no retry grace window.
- `persistRevocationOnFailure` persists a rejected grant after the failed transaction rolls back; revoking only inside a transaction that throws would undo revocation.
- Every active-grant check rechecks the current workspace policy. The fingerprint includes enabled providers/entitlements, workspace restrictions, selected instance settings, stored SSO configuration and OIDC group-sync mapping. Provider display names are excluded; encrypted secret representation is currently included. Changing fingerprint inputs invalidates affected existing grants on their next check.
- Ordinary browser logout is separate from disconnecting an OAuth grant. Do not imply that deleting a browser session revokes all external clients.

## Storage and tests

- Raw SQL is deliberate for explicit row/advisory locks, atomic `UPDATE ... RETURNING` consumption, and trigger-coordinated revocation. Keep queries parameterized and maintain typed boundary mappings. Do not introduce ORM saves that bypass these transaction requirements.
- Credentials are stored as hashes. Do not add raw tokens or client secrets to logs, API connection listings or fixtures.
- Run `npm run test:mcp-oauth` from `server/`. Database flow tests require `MCP_OAUTH_TEST_DATABASE_URL` pointing to a disposable local database named `tooljet_oauth_test_*`; they create/drop their own fixture schema and must never run against a normal development database.
- Assert specific OAuth error codes or HTTP exception types, not merely that a promise throws. Use synthetic clients, identities and messages.
