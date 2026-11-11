# audit-logs module

Records who did what to which resource. Two systems live here while routes migrate:
- **Legacy audit logs** (`audit_logs` table): services call `RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, …)` and `ResponseInterceptor` writes one row per request. They feed the dashboard Audit Logs page.
- **Audit events** (`events/`, `audit_events` table): a declarative engine. Its first adopter is the External API v2 Workspaces routes.

## Domain terms

- **Audit event**: one immutable record: `action` (`<resource>.<verb>`), `outcome` (`success` | `denied`), `actor`, `target`, `workspace_id`, `changes`, `request_id`.
- **Actor**: who called. `pat` (token owner plus token), `user` (session), or `api_key` (External API shared secret, no user).
- **Route spec**: `FeatureConfig.audit` on a feature: `{ action, target: { type, id } }` or `{ skip: reason }`.
- **Subject adapter**: one class per `target.type` that loads a before snapshot and reads the after state from the response, or reloads it by id (`after: 'reload'`) for routes that answer with an empty body.

## Key files

| File | Role |
|---|---|
| `events/catalog.ts` | Every audit action and its target type. A spec may only name an action listed here |
| `events/types.ts` | Event, actor, spec and request shapes |
| `events/diff-engine.ts` | Pure `{from,to}` diff. Create: all from null. Update: changed fields only; no change → null → no event |
| `events/interceptor.ts` | Global `APP_INTERCEPTOR` (`app/module.ts`). Before handler: snapshot. After it resolves: diff and persist |
| `events/module.ts` | Global module; loads the edition's `events/engine.service` |
| `events/request-utils.ts` | Reads the route spec, builds the actor |
| `events/coverage.ts` | `findAuditSpecProblems`, used by the unit test that guards Workspaces v2 coverage |
| `events/delivery.ts` | Queue name, batch sizes, `auditSinkMode()` (`AUDIT_SINK=queue\|db`), job payload helpers |
| `ee/audit-logs/events/sinks/queue.sink.ts` | `QueueAuditSink`: `addBulk` of 100-event jobs after the response; writes directly when Redis refuses, is slow (300 ms) or no worker is connected |
| `ee/audit-logs/events/queue/audit-batch.processor.ts` | `AuditBatchProcessor` (worker pods): buffers jobs, one INSERT at 500 rows or 1 s, isolates a bad job |
| `ee/audit-logs/events/engine.service.ts` | Real engine, adapters list, DB sink binding |
| `ee/audit-logs/events/adapters/*.adapter.ts` | One per target type (`workspace` today) |
| `ee/audit-logs/events/sinks/db.sink.ts` | One multi-row `INSERT … ON CONFLICT DO NOTHING` |
| `migrations/1793098882000-CreateAuditEvents.ts` | Table, indexes, append-only trigger |

## Edition split

- CE binds a no-op engine, so the interceptor returns immediately. EE binds the real engine.
- Events are written only when the workspace's licence has `auditLogs` (`LICENSE_FIELD.AUDIT_LOGS`).

## Invariants & gotchas

- Audit work never changes a response. Every engine error is logged and swallowed. A handler error writes no event.
- **Delivery (Enterprise):** `AUDIT_SINK=queue` (default) runs the audit step after the response and queues it to `audit-events`; `AUDIT_SINK=db` (default under `NODE_ENV=test`) writes before the response, as tests expect. `IAuditEngine.schedule` decides, and shutdown waits for in-flight work.
- The batch processor is registered only where `WORKER=true`, like the other queue processors. A job completes only after its rows commit; stalled jobs return to waiting, and reruns are skipped by `ON CONFLICT DO NOTHING` on `(id, created_at)`, both carried in the job.
- Retries: 8 attempts, exponential backoff from 2 s with jitter; failed jobs kept 7 days. A data or constraint error (`22xxx`/`23xxx`) fails the job without retries.
- `audit_events` is append-only: a trigger blocks UPDATE, and blocks DELETE unless `SET LOCAL tooljet.audit_retention = 'on'`. TRUNCATE is allowed because test resets truncate every table.
- Denied events come only from `AbilityGuard.recordDenied` at the two permission-failure sites. Plan (451), ban and business-rule 403s are not denials.
- Snapshots must be audit-safe: mask secrets in the adapter (`sensitive` fields become `{ changed: true }`).
- Adding a resource means: a catalogue entry, an adapter registered in `AUDIT_ENGINE_PROVIDERS`, specs on its features, and the feature keys added to a coverage test.

## Related modules

- `organizations`, `setup-organization`: own the Workspaces v2 routes; audit specs live in `organizations/constants/feature.ts`.
- `external-apis`: `ExternalApiAuthGuard` sets `tj_auth` and `tj_workspace`, which the engine reads.
- `request-context`: sets `tj_request_id` and the `X-Request-Id` response header.
- `app` (`guards/ability.guard.ts`): calls the engine for denied events.
