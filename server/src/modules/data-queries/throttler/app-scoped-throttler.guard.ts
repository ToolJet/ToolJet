import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';

const FALSY = new Set(['false', '0', 'no', 'off', '']);

@Injectable()
export class AppScopedThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly config: ConfigService
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const raw = String(this.config.get('DATA_QUERY_RUN_THROTTLE_ENABLED') ?? 'true').toLowerCase();
    if (FALSY.has(raw)) return true;
    return super.canActivate(ctx);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // tj_app set upstream by QueryAuthGuard / ValidateQueryAppGuard.
    // No fallback to params.id — that's the data-query id, not the app id.
    const appId = req.tj_app?.id ?? 'no-app';
    const userId = req.user?.id;
    return userId ? `u:${userId}:a:${appId}` : `ip:${req.ip}:a:${appId}`;
  }
}
