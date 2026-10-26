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

const END_USER_MESSAGE_ENV: Record<string, string> = {
  running: 'MIGRATION_END_USER_MESSAGE_RUNNING',
  failed: 'MIGRATION_END_USER_MESSAGE_FAILED',
};

export const END_USER_MESSAGE_MAX_LENGTH = 200;

/** Operator's banner text for end users of released apps in this state; undefined keeps the built-in text. */
export function endUserMessage(state: string, env: Env = process.env): string | undefined {
  const text = env[END_USER_MESSAGE_ENV[state]]?.trim();
  return text ? text.slice(0, END_USER_MESSAGE_MAX_LENGTH) : undefined;
}

/** `joint`: MIGRATION_PHASE unset, schema and data together (blocking mode, Cloud). */
export type MigrationPhase = 'joint' | 'schema' | 'data';

export function parseMigrationPhase(raw: string | undefined): MigrationPhase {
  if (!raw) return 'joint';
  if (raw === 'schema' || raw === 'data') return raw;
  throw new Error(`Unknown MIGRATION_PHASE '${raw}': use 'schema' or 'data', or leave it unset.`);
}

/** Migrations at or before this timestamp predate the async-mode authoring rules (`server/AGENTS.md` § Migrations). */
export const MIGRATION_AUTHORING_RULES_CUTOFF = 1790700000000;
