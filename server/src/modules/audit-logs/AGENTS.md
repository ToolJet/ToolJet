# audit-logs module

Records who did what to which resource, in `audit_logs`. The Audit Logs page reads this table.
- Requests: services call `RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, …)` and `ResponseInterceptor` writes one row per request (a feature can opt out with `skipAuditLogs`).
- Outside a request (workers, listeners): code emits `auditLogEntry`; `AuditLogsListener` writes the row. Git Sync uses this path (`git-sync-audit` module).

## Key files

| File | Role |
|---|---|
| `constants/index.ts` | `AUDIT_ONLY_ACTIONS` (listed in the Actions filter without a route key), `LEGACY_ACTION_ALIASES` |
| `ee/audit-logs/service.ts` | `AuditLoggerService.perform`: writes the row; the licence's `auditLogs` gates the file log |
| `ee/audit-logs/listener.ts` | `auditLogEntry` handler |
| `ee/audit-logs/util.service.ts` | Audit Logs page query and Actions filter list |

## Invariants & gotchas

- `auditLogEntry` is an in-process event: the row is written right away, with no queue or retry. Never let an audit write fail the operation that triggered it.
- `audit_logs.resource_id` is a uuid column: pass `null` for a resource known only by name.
- Renamed actions are not migrated. `LEGACY_ACTION_ALIASES` makes filtering on the new name also return old rows (`WORKSPACE_PULL_COMMIT` → `MASTER_PULL_COMMIT`, …).
- The Actions filter on the page only shows actions listed in `eventMapping` in `frontend/ee/modules/AuditLogs/BaseAuditLogs.jsx`.

## Related modules

- `git-sync-audit`: writes one entry per Git Sync push or pull.
