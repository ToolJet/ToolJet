# idempotency module

Generic, edition-agnostic request-idempotency interceptor: an optional `Idempotency-Key` header lets a client safely retry a mutating request (network timeout, double submit) and get the original response instead of re-running the handler. CE module — Redis is already required in every edition (notifications publish through it).

## Domain terms

- **Idempotency-Key** — client-generated UUID, one per logical user action (e.g. one per modal session), sent as a request header. Optional today; a route without the header is untouched.
- **Fingerprint** — sha256 of `{ params, query, body }`, stored alongside the key so a reused key with a different payload is rejected rather than silently replayed.

## Key files

| File | Role |
|---|---|
| `interceptor.ts` | `IdempotencyInterceptor` — the entire module. No `module.ts`/provider registration: it depends only on `RedisService`, which is `@Global()`, so any controller can reference the class directly in `@UseInterceptors`. |

## Contract

- Header `Idempotency-Key`, optional. Present but not a UUID → 400.
- Redis key: `tj:idem:{organizationId}:{userId}:{METHOD}:{routePattern}:{idempotencyKey}` — scoped per user, so one user can't replay/block another's request with a guessed key.
- On first sight: `SET key {state:'pending', fp} EX 600 NX` (600s — matches the git org-lease TTL, long enough for a slow handler, short enough that a crashed pod can't wedge the key forever).
  - Acquired → handler runs. Success → `SET key {state:'done', fp, body} EX 86400` (replayable for a day). Error → `DEL key` (frees it; the client's retry, possibly with a changed body, gets a clean attempt).
- On a repeat with the same key before it's freed:
  - Fingerprint differs from the stored one → 422 (`Idempotency-Key was reused with a different request`).
  - `state: 'pending'` → 409 (`A request with this Idempotency-Key is still in progress`) — the first attempt hasn't finished.
  - `state: 'done'` → stored `body` is replayed; the handler is not called again.
- Runs outermost: `@UseInterceptors(IdempotencyInterceptor, ClassSerializerInterceptor)`, so the value it stores/replays is the already-serialized response DTO.
- Guards run before interceptors, so `req.user` is populated when the interceptor builds its Redis key.

## How to apply to another endpoint

Add `@UseInterceptors(IdempotencyInterceptor, ...)` (interceptor first) to the handler — no module wiring needed. The client must generate a fresh UUID per logical action and send it as `Idempotency-Key`; reusing it across genuinely different requests trips the 422 fingerprint check.

## Invariants & gotchas

- This guards retries of the *same* request only. It does not replace domain-level duplicate checks (e.g. version name-exists) or BullMQ's deterministic `jobId` dedup, which guard different failure modes — see `server/src/modules/versions/AGENTS.md` and `server/src/modules/workspace-branches/AGENTS.md` for how all three layer together on the version/branch create endpoints.
- Currently applied to `POST /apps/:id/versions` and `POST /workspace-branches`; both are optional today, planned to become required once all clients send the header.

## Related modules

- `redis` — `RedisService`, the only dependency; `@Global()` module.
- `versions`, `workspace-branches` — current consumers.
