type Env = Record<string, string | undefined>;

/** Operator opt-out: serving pods never refuse writes during migrations. */
export function isMigrationTrafficGateDisabled(env: Env = process.env): boolean {
  return env.DISABLE_MIGRATION_TRAFFIC_GATE === 'true';
}

/** blocking: entrypoint migrates before boot. async: server migrates in the background. */
export type MigrationMode = 'blocking' | 'async';

/** Cloud always migrates before boot: it has no migrations page, and its deploy sets the env. */
export function getMigrationMode(env: Env = process.env): MigrationMode {
  if (env.TOOLJET_EDITION === 'cloud') return 'blocking';
  return env.MIGRATION_MODE === 'async' ? 'async' : 'blocking';
}

/** async: the server boots first and owns the migration run. */
export function isServerManagedMigrationMode(env: Env = process.env): boolean {
  return getMigrationMode(env) !== 'blocking';
}

/** The entrypoint exports its edition's command (Cloud: cloud:setup:prod). */
export function setupCommand(env: Env = process.env): string {
  return env.MIGRATION_SETUP_COMMAND || (env.NODE_ENV === 'production' ? 'npm run db:setup:prod' : 'npm run db:setup');
}

/** `joint`: MIGRATION_PHASE unset, schema and data together (blocking mode, Cloud). */
export type MigrationPhase = 'joint' | 'schema' | 'data';

export function parseMigrationPhase(raw: string | undefined): MigrationPhase {
  if (!raw) return 'joint';
  if (raw === 'schema' || raw === 'data') return raw;
  throw new Error(`Unknown MIGRATION_PHASE '${raw}': use 'schema' or 'data', or leave it unset.`);
}
