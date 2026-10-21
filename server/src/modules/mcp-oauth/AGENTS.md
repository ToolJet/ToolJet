# mcp-oauth module

Owns external MCP client registration, browser consent, rotating credentials and constrained ToolJet delegation.
Deployment and protocol configuration lives in `ToolJet/tooljet-mcp`, `docs/oauth.md`.

## Boundaries

- This release is Cloud-only: both `TOOLJET_EDITION=cloud` and `MCP_OAUTH_ENABLED=true` are required. `isMcpOAuthEnabled` is shared by backend settings, login evidence/cleanup, protocol middleware and public config. CE and self-hosted EE keep their normal login/PAT behavior.

- Pending DCR clients form a rolling cache (1,000 entries, one hour); registration prunes synchronously under the cross-replica registration lock. Only approved/legacy clients spend the 10,000 hard cap, checked on first consent. Cleanup and consent take the registration lock before row locks.
- `throttle.guard.ts` trusts only configured proxy CIDRs. Verified token possession/client authentication and signed delegation select per-grant buckets; unverified traffic uses separate bounded address buckets. Never key token limits by an unverified client ID or JWT claim.

- `service.ts` owns browser consent and token issuance; `identity.service.ts` handles per-request credential checks without depending on the browser flow. `parsers.ts` and `policy.ts` hold shared configuration/registration parsing and policy loading. `engine.ts` adapts the OAuth engine to `store.ts`.
- `claims.ts` is shared by credential signing and runtime validation. Viewer credentials use a distinct audience, are app-pinned, and cannot become browser sessions, PATs or full delegations.
- `dto.ts` defines the browser API contracts. Map database rows explicitly; preserve existing wire fields when storage changes.
- Scope checks in `scope.interceptor.ts` share the PAT capability ceiling. They never replace the user's current permissions, workspace binding or edition gates.
- Only the configured MCP service may exchange an access token. A mismatched exchange secret returns `401 invalid_client` internally; the MCP boundary reports a service failure (503) without a user login challenge. Never log secrets or credential bodies.

## Revocation and concurrency

- The triggers in `migrations/1791290000000-AddMcpOAuthRevocationHooks.ts` (relative to `server/`) revoke grants in the same transaction as watched local security changes. The watched tables cover users, organizations, memberships, workspace bans, client disabling, SSO, OIDC group sync and selected instance settings. Migration `1792627200000-RevokeMcpOAuthOnInstanceBan` hooks instance user bans by case-insensitive email, revokes existing grants and expires PATs; active-grant checks also reject live bans. Cloud administrative session termination revokes grants and expires PATs atomically with session deletion. Consent rechecks its session after the insertion barrier.
- Migration `1792540800000-ReduceMcpOAuthPolicyContention` narrows triggers to watched columns. Security updates take a shared global policy lock; grant insertion takes the exclusive lock and rechecks policy afterward. This lets independent administrative updates run concurrently, with no scoped-lock ordering or lock upgrades. New approvals briefly serialize across workspaces. Keep the insertion/recheck barrier when changing concurrency behavior.
- Token rotation locks the grant row. Authenticated replay of a consumed code revokes the grant. A refresh retry can recover the same unused child pair within five seconds for the same client, resource and scopes; other refresh replays revoke the grant, including derived credentials. Client authentication precedes replay detection so a wrong client secret cannot revoke someone else's grant. Cached retry responses are AES-GCM encrypted with an artifact-bound associated value and purpose-specific key; never persist plaintext token pairs.
- `persistRevocationOnFailure` persists a rejected grant after the failed transaction rolls back; revoking only inside a transaction that throws would undo revocation.
- Every active-grant check rechecks the current workspace policy. The fingerprint includes enabled providers/entitlements, workspace restrictions, selected instance settings, stored SSO configuration and OIDC group-sync mapping. Provider display names are excluded; encrypted secret representation is included. SSO save paths preserve existing ciphertext only when decrypted plaintext is unchanged; never ignore secret changes in fingerprints or triggers. Changing fingerprint inputs invalidates affected existing grants on their next check.
- Ordinary browser logout is separate from disconnecting an OAuth grant. Do not imply that deleting a browser session revokes all external clients.

## Storage and tests

- Raw SQL is deliberate for explicit row/advisory locks, atomic `UPDATE ... RETURNING` consumption, and trigger-coordinated revocation. Keep queries parameterized and maintain typed boundary mappings. Do not introduce ORM saves that bypass these transaction requirements.
- Credential lookups use hashes; the bounded refresh retry response is encrypted separately. Do not add raw tokens or client secrets to logs, API connection listings or fixtures.
- Run `npm run test:mcp-oauth` from `server/`. Database flow tests require `MCP_OAUTH_TEST_DATABASE_URL` pointing to a disposable local database named `tooljet_oauth_test_*`; the preparation script applies the real ToolJet migration chain to its isolated schema and also pins historical migrations’ secondary DB connections to that disposable database. It refuses dotenv files. Never run against a normal development database. CI requires the database URL and runs the complete suite.
- Assert specific OAuth error codes or HTTP exception types, not merely that a promise throws. Use synthetic clients, identities and messages.

- Viewer credentials get a separate short-lived access artifact capped by the live grant, so expiration of the minting access token does not interrupt an ongoing render. Viewer app/audience/scope checks and live policy revocation still apply.
- The reviewed PAT/OAuth route inventories live under `test/modules/personal-access-tokens/` and `ee/test/modules/mcp-oauth/`. New reachable controllers or features require explicit inventory review. Enterprise-only tests belong in `ee/test/`; the OAuth runner includes both trees.
