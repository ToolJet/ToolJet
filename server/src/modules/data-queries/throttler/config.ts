import { ConfigService } from '@nestjs/config';

// An unset or empty variable keeps the default (Number('') would be 0: no limit window at all).
function parsePositiveInt(raw: unknown, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Query runs (app and library) share one rate limit configuration.
export const queryRunThrottlerConfig = (config: ConfigService) => [
  {
    ttl: parsePositiveInt(config.get('DATA_QUERY_RUN_TTL'), 1000),
    limit: parsePositiveInt(config.get('DATA_QUERY_RUN_LIMIT'), 50),
  },
];
