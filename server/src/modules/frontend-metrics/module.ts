import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { FrontendMetricsController } from './controller';
import { FrontendMetricsService } from './service';
import { FeatureAbilityFactory } from './ability';
import { UserScopedThrottlerGuard } from './throttler/user-scoped-throttler.guard';

function parsePositiveInt(raw: unknown, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // 60 req/min per user — headroom above the 30s flush interval.
          // Tune with FRONTEND_METRICS_THROTTLE_LIMIT / _TTL env vars.
          ttl: parsePositiveInt(config.get('FRONTEND_METRICS_THROTTLE_TTL'), 60_000),
          limit: parsePositiveInt(config.get('FRONTEND_METRICS_THROTTLE_LIMIT'), 60),
        },
      ],
    }),
  ],
  providers: [FrontendMetricsService, FeatureAbilityFactory, UserScopedThrottlerGuard],
  controllers: [FrontendMetricsController],
})
export class FrontendMetricsModule {}
