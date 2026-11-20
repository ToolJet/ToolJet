import { Module } from '@nestjs/common';
import { RedisRateLimiter } from './redis-rate-limiter';
import { RedisThrottlerStorage } from './redis-throttler-storage';

/**
 * Cluster-wide rate limiting on the shared Redis connection (RedisService, global). Import it where
 * a ThrottlerModule registration needs `storage`, or a service needs RedisRateLimiter directly.
 */
@Module({
  providers: [RedisRateLimiter, RedisThrottlerStorage],
  exports: [RedisRateLimiter, RedisThrottlerStorage],
})
export class RateLimitModule {}
