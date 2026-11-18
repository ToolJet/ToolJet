# rate-limit module

Cluster-wide rate limiting on the shared Redis connection (`RedisService`). It backs `@nestjs/throttler` throttles that must hold across every server pod, and is the primitive the workflow run-admission layer builds on.

## Domain terms

- **Hit**: one counted request against a key. Each hit expires `windowMs` after it was made (sliding window).
- **Block**: once hits exceed `limit`, the key refuses for `blockMs` (defaults to the window). Hits while blocked aren't counted; the count restarts at zero after the block.

## Key files

| File | Role |
|---|---|
| `redis-rate-limiter.ts` | `RedisRateLimiter.hit(key, {windowMs, limit, blockMs})`: one atomic Lua script (sorted set + block key, Redis `TIME` clock) |
| `redis-throttler-storage.ts` | `RedisThrottlerStorage`: `ThrottlerStorage` adapter; falls back to the library's in-memory storage when Redis is unreachable |
| `webhook-throttler.options.ts` | Shared `ThrottlerModule` options for webhook routes (workflows, git sync): `WEBHOOK_THROTTLE_LIMIT` per `WEBHOOK_THROTTLE_TTL` |
| `module.ts` | `RateLimitModule`: provides and exports both classes; `RedisService` comes from the global `RedisModule` |

## Edition split

- CE only; EE controllers use it through the CE module registrations (`workflows`, `git-sync-webhooks`).

## Invariants & gotchas

- Semantics mirror `@nestjs/throttler`'s `ThrottlerStorageService` exactly (a parity test pins this). Change both or neither.
- Keys are `tj:rl:{<key>}:hits|block`: the `{}` hash tag keeps both keys in one Redis Cluster slot, as the Lua script requires.
- `ThrottlerModule` only uses a custom `storage` in the **object** options form (`{ throttlers, storage }`). The array form silently ignores `storage` (`throttler.providers.js`).
- Redis down means counting per pod (warning logged at most once a minute), never "allow everything".
- Only the webhook throttles use Redis storage so far. Data-query run and frontend-metrics throttles are still per pod by decision (2026-11-18), until their limits are tuned for cluster-wide counting.
- `req.ip` is only the real client IP when `TRUST_PROXY` is set (`src/helpers/trust-proxy.helper.ts`, applied in `main.ts`); unset keeps Express's default.

## Related modules

- `redis`: the shared client.
- `workflows`, `git-sync-webhooks`: webhook throttles registered with `webhookThrottlerOptions`.
- `workflows/limits`: `WorkflowLimits` policy (rates, concurrency, run caps) that later admission phases feed into this limiter.
