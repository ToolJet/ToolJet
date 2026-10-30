# Audit logs

Audit entries describe actions on workspace resources. The CE service is the
injection boundary; the edition-specific audit module supplies its implementation.

- `service.ts`: CE no-op `AuditLoggerService.perform(fields, manager?)` boundary.
- `server/ee/audit-logs/service.ts`: EE implementation extends CE and retains
  database persistence plus licensed `LOG_FILE_PATH` output.
- `module.ts` / EE module: export the CE service token; EE aliases it to its
  existing logger instance, so direct callers and the listener use one service.
- Passing an `EntityManager` joins the caller transaction; errors propagate and
  roll back that transaction. Omitting it starts the existing audit transaction.
- Transactional callers must not also set deferred audit interceptor locals for
  the same event, or the listener will record a duplicate.
- The file sink follows the established logger timing before database save;
  database rollback cannot retract a file entry already emitted.

Focused tests: `server/ee/test/modules/audit-logs/unit/transactional-audit.spec.ts`.
