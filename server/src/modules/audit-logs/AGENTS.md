# audit-logs module

Records who did what to which resource. Two tables are kept side by side:
- **Legacy audit logs** (`audit_logs`): services call `RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, …)` and `ResponseInterceptor` writes one row per request; code outside a request emits `auditLogEntry`. The Audit Logs page reads this table.
- **Audit events** (`events/`, `audit_events`): the newer engine. Routes opt in with a route spec; services and workers call `IAuditEngine.recordEvent`. Git Sync writes to both tables (`git-sync-audit` module).

## Domain terms

- **Audit event**: one immutable record: `action`, `outcome` (`success` | `denied` | `failed` | `partial`), `actor`, `target`, `workspace_id`, `changes`, `metadata`, `request_id`.
- **Actor**: who called. `pat`, `user` or `api_key`. Automatic Git Sync work is `user` with `on_behalf: true` (the first workspace admin), plus `trigger` and `source`.
- **Route spec**: `FeatureConfig.audit` on a feature: `{ action, target: { type, id } }` or `{ skip: reason }`.
- **Subject adapter**: one class per route-spec `target.type`; loads a before snapshot and the after state.

## Key files

| File | Role |
|---|---|
| `events/catalog.ts` | Every audit action and its target type(s). Route specs and `recordEvent` may only name these |
| `events/types.ts` | Event, actor, spec, `AuditEventInput` and request shapes |
| `events/interceptor.ts` | Global `APP_INTERCEPTOR`: snapshot before the handler, diff and persist after |
| `events/module.ts` | Global module; loads the edition's `events/engine.service` |
| `events/delivery.ts` | Queue name, batch sizes, `auditSinkMode()` (`AUDIT_SINK=queue\|db`) |
| `ee/audit-logs/events/engine.service.ts` | Real engine: route specs, `recordEvent`, licence check, sink |
| `ee/audit-logs/events/sinks/*.ts`, `queue/audit-batch.processor.ts` | Queue after the response, batch writer on worker pods, direct-write fallback |
| `constants/index.ts` | `AUDIT_ONLY_ACTIONS` (listed in the Actions filter without a route key), `LEGACY_ACTION_ALIASES` |
| `ee/audit-logs/util.service.ts` | Audit Logs page query and Actions filter list |
| `migrations/schema/1794896707000-CreateAuditEvents.ts` | Table, indexes, append-only trigger |

## Edition split

- CE binds a no-op engine. EE binds the real one.
- `audit_events` rows are written only when the workspace's licence has `auditLogs`. (Legacy rows are written regardless; the licence gates only the file log.)

## Invariants & gotchas

- Audit work never changes a response or fails an operation. Every engine error is logged and swallowed.
- **Delivery:** `AUDIT_SINK=queue` (default) queues to `audit-events` after the response; `AUDIT_SINK=db` (default under `NODE_ENV=test`) writes inline. Shutdown waits for in-flight work.
- `recordEvent` takes an optional `id`: a queue job that may run twice passes a fixed id, and the second write is ignored (`ON CONFLICT DO NOTHING` on `(id, created_at)`).
- `audit_events` is append-only: a trigger blocks UPDATE, and DELETE unless `SET LOCAL tooljet.audit_retention = 'on'`.
- `audit_logs.resource_id` is a uuid column: pass `null` for a resource known only by name.
- Renamed actions are not migrated. `LEGACY_ACTION_ALIASES` makes filtering on the new name also return old rows (`WORKSPACE_PULL_COMMIT` → `MASTER_PULL_COMMIT`, …).
- The Actions filter on the page only shows actions listed in `eventMapping` in `frontend/ee/modules/AuditLogs/BaseAuditLogs.jsx`.

## Related modules

- `git-sync-audit`: writes one entry per Git Sync push or pull to both tables.
- `request-context`: sets `tj_request_id` and the `X-Request-Id` response header.
- `app` (`guards/ability.guard.ts`): calls the engine for denied events.
