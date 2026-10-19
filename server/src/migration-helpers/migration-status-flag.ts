import { hostname } from 'os';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { getRedisConnectionOptions, RedisEnvSource } from '../helpers/redis-config';
import { withTimeout } from '../helpers/with-timeout';
import {
  getMigrationFlagTtlSeconds,
  isMigrationTrafficGateDisabled,
  MIGRATION_IN_PROGRESS_KEY,
} from './migration-status';

/**
 * Releases the flag only if this process still owns it.
 *
 * Two pods can legitimately both decide migrations are pending and both raise the flag; the
 * second one to write owns it. Without this check the first pod to finish would clear a gate
 * the second pod is still relying on.
 */
const COMPARE_AND_DELETE = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
  end
  return 0
`;

/**
 * The gate is best-effort; a deploy is not. A black-holed Redis (dropped packets rather than a
 * refused connection) otherwise leaves ioredis retrying against its connect timeout, which
 * measured at ~20s per call — ~40s added to every pod's boot across acquire + release.
 */
const REDIS_OP_TIMEOUT_MS = 3000;

/** A healthy QUIT is instant; an unhealthy one has nothing worth waiting for. */
const REDIS_CLOSE_TIMEOUT_MS = 1000;

type Log = (message: string) => void;

export interface MigrationStatusFlagLogger {
  log: Log;
  warn: Log;
}

const consoleLogger: MigrationStatusFlagLogger = {
  log: (message) => console.log(message),
  warn: (message) => console.warn(message),
};

/**
 * Writer side of {@link MIGRATION_IN_PROGRESS_KEY}, owned by the migration process.
 *
 * Every method swallows Redis failures: an unreachable Redis must never turn a healthy
 * migration into a failed deploy. The cost of a missed `acquire` is that traffic is not cut;
 * the cost of a missed `release` is bounded by the key's TTL.
 */
export class MigrationStatusFlag {
  private readonly token = `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
  private released = false;

  private constructor(
    private readonly client: Redis,
    private readonly ttlSeconds: number,
    private readonly logger: MigrationStatusFlagLogger
  ) {}

  /**
   * Returns `null` when the gate cannot or should not run, so callers can `flag?.acquire()`.
   *
   * Never throws. An unreachable Redis is already survivable because every command is guarded,
   * but construction has to be guarded too: malformed REDIS_* values reach `new Redis()` before
   * any command is sent, and a migration must not be the thing that fails over a best-effort
   * traffic gate.
   */
  static create(
    env: RedisEnvSource = process.env,
    logger: MigrationStatusFlagLogger = consoleLogger
  ): MigrationStatusFlag | null {
    if (isMigrationTrafficGateDisabled(env)) {
      logger.log(
        '[migrations] Skipping the upgrade gate — disabled by env variable DISABLE_MIGRATION_TRAFFIC_GATE=true. ' +
          'Migrations will run WITHOUT cutting API traffic, so requests may hit a half-migrated schema.'
      );
      return null;
    }

    try {
      const client = new Redis({ ...getRedisConnectionOptions(env), lazyConnect: true });
      // ioredis emits 'error' on every failed reconnect; without a listener those become
      // unhandled events and kill the migration process.
      client.on('error', (error: Error) => {
        logger.warn(`[migrations] Redis error while managing the upgrade gate: ${error.message}`);
      });

      return new MigrationStatusFlag(client, getMigrationFlagTtlSeconds(env), logger);
    } catch (error) {
      logger.warn(
        `[migrations] Could not create the Redis client for the upgrade gate: ${describe(error)}. ` +
          'Continuing without it; migrations will run but API traffic will NOT be cut.'
      );
      return null;
    }
  }

  async acquire(): Promise<void> {
    try {
      await this.set();
      this.logger.log(
        `[migrations] Upgrade gate ON — ${MIGRATION_IN_PROGRESS_KEY} set by ${this.token} ` +
          `(expires in ${this.ttlSeconds}s). API traffic will be answered with 503 until migrations finish.`
      );
    } catch (error) {
      this.logger.warn(
        `[migrations] Could not set ${MIGRATION_IN_PROGRESS_KEY}: ${describe(error)}. ` +
          'Continuing with the migration; API traffic will NOT be cut.'
      );
    }
  }

  /** Re-sets the key every third of its TTL until the returned stop function runs. */
  keepAlive(): () => void {
    const timer = setInterval(() => void this.refresh(), (this.ttlSeconds * 1000) / 3);
    timer.unref();
    return () => clearInterval(timer);
  }

  async refresh(): Promise<void> {
    if (this.released) return;
    try {
      await this.set();
    } catch (error) {
      this.logger.warn(`[migrations] Could not refresh ${MIGRATION_IN_PROGRESS_KEY}: ${describe(error)}.`);
    }
  }

  async release(): Promise<void> {
    if (this.released) return;
    this.released = true;
    try {
      const deleted = await withTimeout(
        this.client.eval(COMPARE_AND_DELETE, 1, MIGRATION_IN_PROGRESS_KEY, this.token),
        REDIS_OP_TIMEOUT_MS,
        'clearing the upgrade gate'
      );
      this.logger.log(
        deleted === 1
          ? `[migrations] Upgrade gate OFF — ${MIGRATION_IN_PROGRESS_KEY} cleared by ${this.token}.`
          : `[migrations] Upgrade gate still held by another migrating pod; left ${MIGRATION_IN_PROGRESS_KEY} in place.`
      );
    } catch (error) {
      this.logger.warn(
        `[migrations] Could not clear ${MIGRATION_IN_PROGRESS_KEY}: ${describe(error)}. ` +
          `It expires on its own in at most ${this.ttlSeconds}s.`
      );
    }
  }

  private set(): Promise<unknown> {
    return withTimeout(
      this.client.set(MIGRATION_IN_PROGRESS_KEY, this.token, 'EX', this.ttlSeconds),
      REDIS_OP_TIMEOUT_MS,
      'setting the upgrade gate'
    );
  }

  async close(): Promise<void> {
    try {
      await withTimeout(this.client.quit(), REDIS_CLOSE_TIMEOUT_MS, 'closing the Redis connection');
    } catch {
      this.client.disconnect();
    }
  }

  /**
   * Clears the flag when the orchestrator stops this pod mid-migration. SIGKILL cannot be
   * trapped — that case is what the TTL is for. Returns a disarm function.
   */
  armShutdownRelease(): () => void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    const handlers = signals.map((signal) => {
      const handler = async () => {
        this.logger.warn(`[migrations] Received ${signal} during migration — clearing the upgrade gate.`);
        await this.release();
        await this.close();
        process.exit(1);
      };
      process.once(signal, handler);
      return { signal, handler };
    });

    return () => handlers.forEach(({ signal, handler }) => process.removeListener(signal, handler));
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
