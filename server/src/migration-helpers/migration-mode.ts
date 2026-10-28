import { ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS } from './pre-cutoff-allowlist';

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

/**
 * Expand and contract (standard pattern; also "parallel change"):
 * - expand:   adds only; old and new code both run on it. Before boot. Folder `migrations/expand`.
 * - backfill: fills what expand added; reads keep working. After boot, writes paused. Folder `migrations/backfill`.
 * - contract: removes or tightens what no released code uses any more. After writes reopen.
 */
export type MigrationPhase = 'expand' | 'backfill' | 'contract';

/**
 * - single-transaction: every phase in one transaction before boot (blocking mode, fresh install, `db:migrate`).
 * - multi-transaction: one process and transaction per phase (async mode); MIGRATION_PHASE names it.
 */
export type RunStrategy = 'single-transaction' | 'multi-transaction';

/** Unset: all phases, single-transaction. */
export function parseMigrationPhase(raw: string | undefined): MigrationPhase | undefined {
  if (!raw) return undefined;
  if (raw === 'expand' || raw === 'backfill') return raw;
  throw new Error(`Unknown MIGRATION_PHASE '${raw}': use 'expand' or 'backfill', or leave it unset.`);
}

export function runStrategy(phase: MigrationPhase | undefined): RunStrategy {
  return phase ? 'multi-transaction' : 'single-transaction';
}

/**
 * Migrations at or before this timestamp predate the async-mode authoring rules (`server/AGENTS.md` § Migrations).
 * Just below the oldest migration pending on 3.21.74-beta, so upgrades from 3.21.74 onwards run async.
 */
export const MIGRATION_AUTHORING_RULES_CUTOFF = 1789300000000;

/** TypeORM's rule: a migration name ends in its 13-digit timestamp. */
export function migrationTimestamp(name: string): number {
  return Number(name.slice(-13));
}

export function isPreCutoffMigration(name: string): boolean {
  return migrationTimestamp(name) <= MIGRATION_AUTHORING_RULES_CUTOFF;
}

/** A pending pre-cutoff migration outside the allowlist: the database predates 3.21.58, so the upgrade runs jointly before boot. */
export function blocksAsyncUpgrade(name: string): boolean {
  return isPreCutoffMigration(name) && !ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS.has(name);
}
