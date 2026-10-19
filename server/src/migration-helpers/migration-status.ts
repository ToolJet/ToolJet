import { RedisEnvSource } from '../helpers/redis-config';

/**
 * The upgrade flag shared between the standalone migration process (writer) and every
 * running ToolJet pod (reader, see `MigrationGateMiddleware`).
 *
 * Why Redis and not the database: the whole point of the flag is to be readable while a pod
 * holds an ACCESS EXCLUSIVE lock on `migrations` — a database-backed flag would be exactly as
 * unreachable as the thing it describes.
 *
 * Presence of the key means "an upgrade is running, reject traffic". Absence means normal
 * service. The literal string `false` is also treated as "not in progress", so an operator can
 * clear a stuck gate with `SET MIGRATION_IN_PROGRESS false` without having to DEL it.
 */
export const MIGRATION_IN_PROGRESS_KEY = 'MIGRATION_IN_PROGRESS';

/** Backstop against a leaked flag: a pod SIGKILLed mid-migration cannot release its own key. */
export const DEFAULT_MIGRATION_FLAG_TTL_SECONDS = 30 * 60;

/** Pure reader-side predicate, shared by the middleware and its tests. */
export function isMigrationInProgressValue(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== '' && normalized !== 'false';
}

export function getMigrationFlagTtlSeconds(env: RedisEnvSource = process.env): number {
  const minutes = parseInt(env.MIGRATION_FLAG_TTL_MINUTES || '');
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : DEFAULT_MIGRATION_FLAG_TTL_SECONDS;
}

export function isMigrationTrafficGateDisabled(env: RedisEnvSource = process.env): boolean {
  return env.DISABLE_MIGRATION_TRAFFIC_GATE === 'true';
}

export function isAsyncMigrationMode(env: RedisEnvSource = process.env): boolean {
  return env.MIGRATION_MODE === 'async';
}

/** The entrypoint exports its edition's command (Cloud: cloud:setup:prod). */
export function setupCommand(env: RedisEnvSource = process.env): string {
  return env.MIGRATION_SETUP_COMMAND || (env.NODE_ENV === 'production' ? 'npm run db:setup:prod' : 'npm run db:setup');
}
