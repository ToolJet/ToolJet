import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { RedisService } from '@modules/redis/service';

/** Anything that hands out a connected ioredis client; RedisService in the app, a stub in tests. */
export interface RedisClientProvider {
  getClient(): Redis;
}

export interface RateLimitWindow {
  /** Each hit counts for this long (sliding window). */
  windowMs: number;
  /** Hits allowed within one window. */
  limit: number;
  /** Once over the limit, refuse for this long. Defaults to the window. */
  blockMs?: number;
}

export interface RateLimitHit {
  totalHits: number;
  timeToExpireMs: number;
  isBlocked: boolean;
  timeToBlockExpireMs: number;
}

/*
 * One atomic step, run in Redis so every server pod shares the count. It mirrors
 * @nestjs/throttler's in-memory storage: each hit expires `window` ms after it was made; the hit
 * that exceeds `limit` blocks the key for `block` ms; hits while blocked are not counted; the count
 * starts again from zero after the block. Redis's own clock (TIME) is used so pods with skewed
 * clocks agree. Both keys share a hash tag, so this also works on Redis Cluster.
 *
 * KEYS[1] hits (sorted set: score = hit time)  KEYS[2] block marker
 * ARGV    window ms, limit, block ms, unique member
 * Returns {totalHits, timeToExpireMs, isBlocked (0/1), timeToBlockExpireMs}
 */
const HIT_SCRIPT = `
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local block = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)

local blockTtl = redis.call('PTTL', KEYS[2])
if blockTtl > 0 then
  return {limit + 1, window, 1, blockTtl}
end

redis.call('ZADD', KEYS[1], now, ARGV[4])
redis.call('PEXPIRE', KEYS[1], window)
local hits = redis.call('ZCARD', KEYS[1])
local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
local expire = window
if oldest[2] then expire = tonumber(oldest[2]) + window - now end

if hits > limit then
  redis.call('SET', KEYS[2], '1', 'PX', block)
  redis.call('DEL', KEYS[1])
  return {hits, expire, 1, block}
end
return {hits, expire, 0, 0}
`;

/** Redis keys for one counter. The `{...}` hash tag keeps both keys in one Cluster slot. */
export const rateLimitKeys = (key: string) => {
  const tag = `tj:rl:{${key}}`;
  return { hits: `${tag}:hits`, block: `${tag}:block` };
};

/** Shared, cluster-wide rate limiter: the primitive behind throttler storage and run admission. */
@Injectable()
export class RedisRateLimiter {
  constructor(@Inject(RedisService) private readonly redis: RedisClientProvider) {}

  /** Records one hit on `key`. Rejects if Redis can't be reached; callers decide the fallback. */
  async hit(key: string, { windowMs, limit, blockMs }: RateLimitWindow): Promise<RateLimitHit> {
    const keys = rateLimitKeys(key);
    const block = Math.max(1, blockMs ?? windowMs);
    const [totalHits, timeToExpireMs, isBlocked, timeToBlockExpireMs] = (await this.redis
      .getClient()
      .eval(HIT_SCRIPT, 2, keys.hits, keys.block, windowMs, limit, block, randomUUID())) as number[];

    return {
      totalHits,
      timeToExpireMs: Math.max(0, timeToExpireMs),
      isBlocked: isBlocked === 1,
      timeToBlockExpireMs: Math.max(0, timeToBlockExpireMs),
    };
  }
}
