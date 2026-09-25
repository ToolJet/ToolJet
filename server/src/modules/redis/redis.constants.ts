/**
 * Standalone token + options type for the Redis module. Kept out of module.ts/service.ts to avoid
 * a circular import (module.ts imports RedisService, and RedisService injects this token) that
 * would leave the token undefined at decorator-evaluation time.
 */

/** Injection token for the Redis module options (see RedisModuleOptions). */
export const REDIS_MODULE_OPTIONS = 'REDIS_MODULE_OPTIONS';

export interface RedisModuleOptions {
  /**
   * Whether to open the Redis connection eagerly on module init. False in the migration/CLI
   * context (IS_GET_CONTEXT), where the client is instead created lazily on first use — so
   * migrations and one-off scripts don't require (or noisily connect to) Redis.
   */
  eagerConnect: boolean;
}
