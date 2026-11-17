export const MIGRATION_GATE_EVENT = 'tooljet:migration-gate';

const GATE_CODES = ['MIGRATION_IN_PROGRESS', 'MIGRATION_FAILED'];

// The upgrade gate refused a write: the migration banner checks the status again.
export function notifyMigrationGate(status, body) {
  if (status === 503 && GATE_CODES.includes(body?.code)) window.dispatchEvent(new Event(MIGRATION_GATE_EVENT));
}
