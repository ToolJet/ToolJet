import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { NextFunction, Request, Response } from 'express';
import { MigrationRunsService, MigrationState } from '../migration-runs/service';
import {
  isServerManagedMigrationMode,
  isMigrationTrafficGateDisabled,
} from '../../../migration-helpers/migration-status';

/**
 * Answers API traffic with 503 while a deploy is running database migrations.
 *
 * During a rolling upgrade the pods still serving traffic are talking to a database that is
 * mid-migration. The migrating process holds an advisory lock for the duration, and
 * `MigrationRunsService.status()` reads it (plus, in async mode, the latest run);
 * this middleware turns that into a clean, retryable 503 instead of letting requests hit a
 * half-migrated schema.
 *
 * Three properties matter more than the gating itself:
 *  - Health checks are never gated. Gating them would make the orchestrator kill the very
 *    pods that are waiting out the upgrade.
 *  - Only API routes are gated, so the SPA shell still loads and can show the upgrade state.
 *  - It fails open: a status read error is treated as "no migration running".
 */

/** Relative to the API prefix — `/api/health` and `/api/metrics` in a default install. */
const UNGATED_API_PATHS = new Set(['/health', '/metrics']);

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Async mode keeps serving: reads and these end-user writes pass, every other write gets 503. */
const ASYNC_MODE_WRITE_ALLOWLIST = [
  /^\/authenticate(\/|$)/,
  /^\/session(\/|$)/,
  /^\/oauth\//,
  /^\/sso\//,
  /^\/data-queries\/[^/]+\/run$/,
  /^\/data-queries\/[^/]+\/versions\/[^/]+\/run\/[^/]+$/,
  /^\/migration-runs\/run$/,
];

/** How often to repeat the "requests are being rejected" line. */
const LOG_THROTTLE_MS = 30_000;

const RETRY_AFTER_SECONDS = 30;

export const MIGRATION_IN_PROGRESS_MESSAGE =
  'ToolJet is being upgraded — database migrations are in progress. Please retry in a few moments.';

export const MIGRATION_FAILED_MESSAGE =
  'The latest ToolJet upgrade failed. Changes cannot be saved until an administrator retries it.';

/** What each refusing state answers; other states pass. */
const REFUSALS: Partial<Record<MigrationState, { code: string; message: string }>> = {
  running: { code: 'MIGRATION_IN_PROGRESS', message: MIGRATION_IN_PROGRESS_MESSAGE },
  failed: { code: 'MIGRATION_FAILED', message: MIGRATION_FAILED_MESSAGE },
};

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
  private readonly apiPrefix = buildApiPrefix(process.env.SUB_PATH).toLowerCase();
  private readonly asyncMode = isServerManagedMigrationMode(process.env);
  private lastRejectionLoggedAt = 0;

  constructor(
    private readonly logger: Logger,
    private readonly migrationRuns: MigrationRunsService
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
    // req.path is '/' under forRoutes('*') on Nest 11; originalUrl keeps the full path.
    // Lowercased: Express matches routes case-insensitively, so /API/apps reaches /api/apps.
    const path = req.originalUrl.split('?')[0].toLowerCase();
    if (!this.enabled || !this.shouldGate(path, req.method)) return next();
    const { state } = await this.migrationRuns.status();
    const refusal = REFUSALS[state];
    if (!refusal) return next();

    this.logRejection(req, state);
    res.setHeader('Retry-After', String(RETRY_AFTER_SECONDS));
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      ...refusal,
    });
  }

  private shouldGate(path: string, method: string): boolean {
    if (!path.startsWith(this.apiPrefix)) return false;
    const apiPath = path.slice(this.apiPrefix.length);
    if (UNGATED_API_PATHS.has(apiPath)) return false;
    if (!this.asyncMode) return true;
    return !SAFE_METHODS.has(method) && !ASYNC_MODE_WRITE_ALLOWLIST.some((pattern) => pattern.test(apiPath));
  }

  private logRejection(req: Request, state: MigrationState): void {
    const now = Date.now();
    if (now - this.lastRejectionLoggedAt < LOG_THROTTLE_MS) return;
    this.lastRejectionLoggedAt = now;
    this.logger.warn(
      `[migration-gate] Migration ${state}: answering API writes with 503 (most recent: ${req.method} ${req.originalUrl}).`
    );
  }
}
