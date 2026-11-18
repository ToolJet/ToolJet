import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { RedisThrottlerStorage } from './redis-throttler-storage';

/** Webhook routes (workflows, git sync): WEBHOOK_THROTTLE_LIMIT per WEBHOOK_THROTTLE_TTL, counted in Redis. */
export const webhookThrottlerOptions = (
  config: ConfigService,
  storage: RedisThrottlerStorage
): ThrottlerModuleOptions => ({
  throttlers: [
    {
      ttl: config.get('WEBHOOK_THROTTLE_TTL') || 60000,
      limit: config.get('WEBHOOK_THROTTLE_LIMIT') || 100,
    },
  ],
  storage,
});
