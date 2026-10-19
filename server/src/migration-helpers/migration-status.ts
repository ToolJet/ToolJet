type Env = Record<string, string | undefined>;

/** Operator opt-out: serving pods never refuse writes during migrations. */
export function isMigrationTrafficGateDisabled(env: Env = process.env): boolean {
  return env.DISABLE_MIGRATION_TRAFFIC_GATE === 'true';
}

/** blocking: entrypoint migrates before boot. async: server migrates in the background. manual: a super admin starts it. */
export type MigrationMode = 'blocking' | 'async' | 'manual';

/** Cloud always migrates before boot: it has no migrations page, and its deploy sets the env. */
export function getMigrationMode(env: Env = process.env): MigrationMode {
  if (env.TOOLJET_EDITION === 'cloud') return 'blocking';
  return env.MIGRATION_MODE === 'async' || env.MIGRATION_MODE === 'manual' ? env.MIGRATION_MODE : 'blocking';
}

/** async and manual: the server boots first and owns the migration run. */
export function isServerManagedMigrationMode(env: Env = process.env): boolean {
  return getMigrationMode(env) !== 'blocking';
}

/** The entrypoint exports its edition's command (Cloud: cloud:setup:prod). */
export function setupCommand(env: Env = process.env): string {
  return env.MIGRATION_SETUP_COMMAND || (env.NODE_ENV === 'production' ? 'npm run db:setup:prod' : 'npm run db:setup');
}
