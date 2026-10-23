import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { NextFunction, Request, Response } from 'express';
import { RedisService } from '@modules/redis/service';
import { withTimeout } from '@helpers/with-timeout';
import {
  isMigrationInProgressValue,
  isMigrationTrafficGateDisabled,
  MIGRATION_IN_PROGRESS_KEY,
} from '../../../migration-helpers/migration-status';

/**
 * Answers API traffic with 503 while a deploy is running database migrations.
 *
 * During a rolling upgrade the pods still serving traffic are talking to a database that is
 * mid-migration. The migration process raises `MIGRATION_IN_PROGRESS` in Redis for the
 * duration (see `migration-helpers/migration-status.ts`) and this middleware turns that into
 * a clean, retryable 503 instead of letting requests hit a half-migrated schema.
 *
 * Three properties matter more than the gating itself:
 *  - Health checks are never gated. Gating them would make the orchestrator kill the very
 *    pods that are waiting out the upgrade.
 *  - Only API routes are gated, so the SPA shell still loads and can show the upgrade state.
 *  - It fails open. A Redis outage must not take the API down on its own, so any read error
 *    is treated as "no migration running".
 */

/** Relative to the API prefix — `/api/health` and `/api/metrics` in a default install. */
const UNGATED_API_PATHS = new Set(['/health', '/metrics']);

/** Caps Redis reads at one per second per pod, whatever the request rate. */
const STATUS_CACHE_TTL_MS = 1000;

/**
 * A Redis that accepts connections but never answers would otherwise park every request in
 * ioredis' offline queue. Losing the gate is survivable; stalling the API is not.
 */
const READ_TIMEOUT_MS = 500;

/** How often to repeat the "requests are being rejected" / "Redis unreachable" lines. */
const LOG_THROTTLE_MS = 30_000;

const RETRY_AFTER_SECONDS = 30;

export const MIGRATION_IN_PROGRESS_MESSAGE =
  'ToolJet is being upgraded — database migrations are in progress. Please retry in a few moments.';

/**
 * Rebuilds the prefix `main.ts` passes to `setGlobalPrefix(urlPrefix + 'api')`, so a subpath
 * install gates `/<SUB_PATH>/api/...` rather than nothing at all.
 */
export function buildApiPrefix(subPath: string | undefined): string {
  return `/${[subPath, 'api'].filter(Boolean).join('/')}`.replace(/\/{2,}/g, '/');
}

@Injectable()
export class MigrationGateMiddleware implements NestMiddleware {
  private readonly enabled = !isMigrationTrafficGateDisabled();
  private readonly apiPrefix = buildApiPrefix(process.env.SUB_PATH);

  private cachedInProgress = false;
  private cachedAt = 0;
  private inFlightRead: Promise<boolean> | null = null;
  private lastReadErrorLoggedAt = 0;
  private lastRejectionLoggedAt = 0;

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: Logger
  ) {
    // Announced once at boot: an operator looking at a pod that served traffic straight
    // through an upgrade needs to find the reason in that pod's own log, not guess at env.
    if (!this.enabled) {
      this.logger.warn(
        '[migration-gate] Skipping the upgrade gate — disabled by env variable ' +
          'DISABLE_MIGRATION_TRAFFIC_GATE=true. API requests will NOT be answered with 503 while ' +
          'database migrations are running.'
      );
    }
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.enabled || !this.shouldGate(req.path)) return next();
    if (!(await this.isMigrationInProgress())) return next();

    this.logRejection(req);
    res.setHeader('Retry-After', String(RETRY_AFTER_SECONDS));
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      message: MIGRATION_IN_PROGRESS_MESSAGE,
      code: 'MIGRATION_IN_PROGRESS',
    });
  }

  private shouldGate(path: string): boolean {
    if (!path.startsWith(this.apiPrefix)) return false;
    return !UNGATED_API_PATHS.has(path.slice(this.apiPrefix.length));
  }

  private async isMigrationInProgress(): Promise<boolean> {
    if (Date.now() - this.cachedAt < STATUS_CACHE_TTL_MS) return this.cachedInProgress;
    // Single-flight: a burst of concurrent requests on a cold cache shares one Redis round trip.
    this.inFlightRead ??= this.readFlag().finally(() => {
      this.inFlightRead = null;
    });
    return this.inFlightRead;
  }

  private async readFlag(): Promise<boolean> {
    try {
      const value = await withTimeout(
        this.redisService.getClient().get(MIGRATION_IN_PROGRESS_KEY),
        READ_TIMEOUT_MS,
        'reading the upgrade gate'
      );
      this.cachedInProgress = isMigrationInProgressValue(value);
    } catch (error) {
      this.cachedInProgress = false;
      this.logThrottled('lastReadErrorLoggedAt', () =>
        this.logger.warn(
          `[migration-gate] Could not read ${MIGRATION_IN_PROGRESS_KEY} from Redis ` +
            `(${error instanceof Error ? error.message : String(error)}); serving traffic normally.`
        )
      );
    }
    this.cachedAt = Date.now();
    return this.cachedInProgress;
  }

  private logRejection(req: Request): void {
    this.logThrottled('lastRejectionLoggedAt', () =>
      this.logger.warn(
        `[migration-gate] ${MIGRATION_IN_PROGRESS_KEY} is set — answering API requests with 503 ` +
          `(most recent: ${req.method} ${req.originalUrl}).`
      )
    );
  }

  private logThrottled(field: 'lastReadErrorLoggedAt' | 'lastRejectionLoggedAt', emit: () => void): void {
    const now = Date.now();
    if (now - this[field] < LOG_THROTTLE_MS) return;
    this[field] = now;
    emit();
  }
}
