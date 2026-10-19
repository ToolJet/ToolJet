import type { RedisOptions } from 'ioredis';

export type RedisEnvSource = Record<string, string | undefined>;

/**
 * Single place that translates REDIS_* environment variables into ioredis options.
 *
 * `env` is a parameter because not every Redis consumer runs inside NestJS. The standalone
 * migration process (`run-all-migrations.ts`) never boots ConfigModule, so it reads the env
 * file itself via `getEnvVars()` and passes the result here — it cannot assume the container
 * entrypoint exported REDIS_* into `process.env`.
 */
export function getRedisConnectionOptions(env: RedisEnvSource = process.env): RedisOptions {
  return {
    host: env.REDIS_HOST || 'localhost',
    port: parseInt(env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    ...(env.REDIS_USERNAME && { username: env.REDIS_USERNAME }),
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
    ...(env.REDIS_DB && { db: parseInt(env.REDIS_DB) }),
    ...(env.REDIS_TLS === 'true' && { tls: {} }),
  };
}
