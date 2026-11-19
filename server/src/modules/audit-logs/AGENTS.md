# audit-logs module

Records who did what to which resource. Two systems live here while routes migrate:
- **Legacy audit logs** (`audit_logs` table): services call `RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, …)` and `ResponseInterceptor` writes one row per request. They feed the dashboard Audit Logs page.
- **Audit events** (`events/`, `audit_events` table): a declarative engine. Its first adopter is the External API v2 Workspaces routes.

## Which to use

- New write routes use **audit events**: declare an `audit` spec on the feature (or `{ skip: reason }`) and set `skipAuditLogs: true`. `findAuditSpecProblems` fails a spec without it, since the route would write both tables.
- `AUDIT_LOGS_REQUEST_CONTEXT_KEY` and `auditLogEntry` are for existing routes only. Moving those routes, and the Audit Logs page, to `audit_events` is decided separately.

## Domain terms

- **Audit event**: one immutable record: `action` (`<resource>.<verb>`), `outcome` (`success` | `denied`), `actor`, `target`, `workspace_id`, `changes`, `request_id`.
- **Actor**: who called. `pat` (token owner plus token), `user` (session), or `api_key` (External API shared secret, no user).
- **Route spec**: `FeatureConfig.audit` on a feature: `{ action, target: { type, id } }` or `{ skip: reason }`.
- **Subject adapter**: one class per `target.type` that loads a before snapshot and reads the after state from the response, or reloads it by id (`after: 'reload'`) for routes that answer with an empty body.

## Key files

| File | Role |
|---|---|
| `events/catalog.ts` | Merges every module's actions (`<module>/constants/audit-actions.ts`); target types are derived. A spec may only name an action listed here |
| `events/types.ts` | Event, actor, spec and request shapes |
| `events/diff-engine.ts` | Pure `{from,to}` diff. Create: all from null. Update: changed fields only; no change → null → no event |
| `events/interceptor.ts` | Global `APP_INTERCEPTOR` (`app/module.ts`). Before handler: snapshot. After it resolves: diff and persist |
| `events/module.ts` | Global module; loads the edition's `events/engine.service` |
| `events/request-utils.ts` | Reads the route spec, builds the actor |
| `events/coverage.ts` | `findAuditSpecProblems`, used by the unit test that guards Workspaces v2 coverage |
| `ee/audit-logs/events/engine.service.ts` | Real engine, adapters list, DB sink binding |
| `ee/audit-logs/events/adapters/*.adapter.ts` | One per target type (`workspace` today) |
| `ee/audit-logs/events/sinks/db.sink.ts` | One multi-row `INSERT … ON CONFLICT DO NOTHING` |
| `migrations/1793098882000-CreateAuditEvents.ts` | Table, indexes, append-only trigger |

## Edition split

- CE binds a no-op engine, so the interceptor returns immediately. EE binds the real engine.
- Events are written only when the workspace's licence has `auditLogs` (`LICENSE_FIELD.AUDIT_LOGS`).

## Invariants & gotchas

- Audit work never changes a response. Every engine error is logged and swallowed. A handler error writes no event.
- **Delivery:** the event is written by one INSERT in the request, after the handler and before the response, so a reload or diff never sees a later call's changes. There is no queue: one Redis per pod (the bundled image's default) would lose queued events.
- `audit_events` is append-only: a trigger blocks UPDATE, and blocks DELETE unless `SET LOCAL tooljet.audit_retention = 'on'`. TRUNCATE is allowed because test resets truncate every table.
- Denied events come only from `AbilityGuard.recordDenied` at the two permission-failure sites. Plan (451), ban and business-rule 403s are not denials.
- Snapshots must be audit-safe: mask secrets in the adapter (`sensitive` fields become `{ changed: true }`).
- Adding a resource means: the module's own `constants/audit-actions.ts` (spread into `AUDIT_CATALOG`), an adapter, specs on its features, and the feature keys added to a coverage test. Adapters are one list in `AUDIT_ENGINE_PROVIDERS` today; with a second resource they move to per-module registration, as the catalog did.

## Related modules

- `organizations`, `setup-organization`: own the Workspaces v2 routes; audit specs live in `organizations/constants/feature.ts`.
- `external-apis`: `ExternalApiAuthGuard` sets `tj_auth` and `tj_workspace`, which the engine reads.
- `request-context`: sets `tj_request_id` and the `X-Request-Id` response header.
- `app` (`guards/ability.guard.ts`): calls the engine for denied events.
