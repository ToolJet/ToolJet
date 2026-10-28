import { MigrationInterface, QueryRunner } from 'typeorm';
import { ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS } from './pre-cutoff-allowlist';

type Env = Record<string, string | undefined>;

/** Operator opt-out: serving pods never refuse writes during migrations. */
export function isMigrationTrafficGateDisabled(env: Env = process.env): boolean {
  return env.DISABLE_MIGRATION_TRAFFIC_GATE === 'true';
}

/** blocking: entrypoint migrates before boot. async: server migrates in the background. */
export type MigrationMode = 'blocking' | 'async';

/** Every edition, Cloud included: the deploy sets MIGRATION_MODE. */
export function getMigrationMode(env: Env = process.env): MigrationMode {
  return env.MIGRATION_MODE === 'async' ? 'async' : 'blocking';
}

/** async: the server boots first and owns the migration run. */
export function isServerManagedMigrationMode(env: Env = process.env): boolean {
  return getMigrationMode(env) !== 'blocking';
}

/** The entrypoint exports its edition's database-only command. */
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
 * - contract: removes or tightens what no released code uses any more. After writes reopen. Folder `migrations/contract`.
 */
export type MigrationPhase = 'expand' | 'backfill' | 'contract';

/**
 * - single-transaction: every phase in one transaction before boot (blocking mode, fresh install, `db:migrate`).
 * - multi-transaction: one process and transaction per phase (async mode); MIGRATION_PHASE names it.
 */
export type RunStrategy = 'single-transaction' | 'multi-transaction';

/**
 * `tail` holds a backfill's lock-taking statements (index builds, triggers, NOT VALID, VALIDATE). Tails run after
 * every backfill up(), just before commit, so their locks last seconds instead of the whole run.
 */
export interface BackfillMigration extends MigrationInterface {
  tail?(queryRunner: QueryRunner): Promise<void>;
}

/**
 * Removes what an earlier release stopped using. `requires` names a migration of that release: the contract runs
 * only once an earlier upgrade recorded it, so an instance that skipped that release can still roll back.
 */
export interface ContractMigration extends MigrationInterface {
  transaction: false;
  requires: string;
}

export interface ContractCandidate {
  name: string;
  requires?: string;
}

export interface ContractPlan {
  run: string[];
  deferred: { name: string; waitingFor: string }[];
}

/** `baselineId`: last migration id recorded before this code first ran; 0 on a fresh install, where all run. */
export function planContract(
  candidates: readonly ContractCandidate[],
  recordedIds: ReadonlyMap<string, number>,
  baselineId: number
): ContractPlan {
  const plan: ContractPlan = { run: [], deferred: [] };
  for (const { name, requires } of candidates) {
    const recordedAt = requires ? recordedIds.get(requires) : undefined;
    if (baselineId === 0 || (recordedAt !== undefined && recordedAt <= baselineId)) plan.run.push(name);
    else plan.deferred.push({ name, waitingFor: requires ?? 'a requires migration' });
  }
  return plan;
}

/** Unset: all phases, single-transaction. */
export function parseMigrationPhase(raw: string | undefined): MigrationPhase | undefined {
  if (!raw) return undefined;
  if (raw === 'expand' || raw === 'backfill' || raw === 'contract') return raw;
  throw new Error(`Unknown MIGRATION_PHASE '${raw}': use 'expand', 'backfill' or 'contract', or leave it unset.`);
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
