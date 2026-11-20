import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { RedisRateLimiter } from './redis-rate-limiter';

const FALLBACK_WARNING_INTERVAL_MS = 60_000;

// The record type isn't exported from the package root
type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

/*
 * @nestjs/throttler storage that counts in Redis, so a limit holds across every server pod instead
 * of per pod. If Redis can't be reached it falls back to counting on this pod (the library's own
 * in-memory storage) rather than failing every request or allowing everything; a warning is logged
 * at most once a minute while that lasts.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly localFallback = new ThrottlerStorageService();
  private lastFallbackWarningAt = 0;

  constructor(private readonly rateLimiter: RedisRateLimiter) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string
  ): Promise<ThrottlerStorageRecord> {
    try {
      const hit = await this.rateLimiter.hit(`${key}:${throttlerName}`, {
        windowMs: ttl,
        limit,
        blockMs: blockDuration,
      });
      // The library reports both times in whole seconds, rounded up
      return {
        totalHits: hit.totalHits,
        timeToExpire: Math.ceil(hit.timeToExpireMs / 1000),
        isBlocked: hit.isBlocked,
        timeToBlockExpire: Math.ceil(hit.timeToBlockExpireMs / 1000),
      };
    } catch (error) {
      this.warnFallback(error as Error);
      return this.localFallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  onApplicationShutdown(): void {
    this.localFallback.onApplicationShutdown();
  }

  private warnFallback(error: Error): void {
    const now = Date.now();
    if (now - this.lastFallbackWarningAt < FALLBACK_WARNING_INTERVAL_MS) return;
    this.lastFallbackWarningAt = now;
    this.logger.warn(`Rate limits are counting per pod: Redis is unavailable (${error?.message})`);
  }
}
