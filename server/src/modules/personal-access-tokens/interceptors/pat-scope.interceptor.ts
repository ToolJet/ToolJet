import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { MODULES } from '@modules/app/constants/modules';
import { User } from '@entities/user.entity';
import { PAT_ALLOWED_BUNDLES, patCanAccess } from '@modules/personal-access-tokens/constants/scopes';

/**
 * Confines workspace personal access tokens to the modules PAT_ALLOWED_BUNDLES permits.
 *
 * An INTERCEPTOR rather than a guard, deliberately. Global guards run BEFORE route-level guards,
 * so a global guard would execute before JwtAuthGuard has populated request.user and could never
 * tell whose session it was looking at. A global interceptor's pre-phase runs after every guard.
 *
 * Global rather than per-route because 36 routes across 19 controllers authenticate without any
 * ability guard — data-sources, workflows, app-git, ai, templates among them — so hanging the
 * check off the ability layer would leave real capability unscoped.
 *
 * This narrows only. A token still cannot exceed its owner's role; CASL runs as it always did.
 */
@Injectable()
export class PatScopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    /* Global interceptors also fire on the websocket gateways (yjs drives multiplayer editing),
       where switchToHttp() is meaningless. PATs are an HTTP-only credential. */
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const user: User | undefined = context.switchToHttp().getRequest()?.user;

    /* Browser sessions, SSO sessions, and the app-scoped embed flow pass straight through — the
       embed viewer legitimately needs far more surface than an automation client. */
    if (!user?.isPATLogin || user.patAppId) {
      return next.handle();
    }

    const module = this.reflector.get<MODULES>('tjModuleId', context.getClass());
    const feature = this.reflector.get<string>('tjFeatureId', context.getHandler());
    if (!patCanAccess(module, feature)) {
      throw new ForbiddenException(
        `This personal access token cannot access ${feature ?? module ?? 'this resource'}. ` +
          `Workspace tokens are limited to: ${PAT_ALLOWED_BUNDLES.join(', ')}.`
      );
    }

    return next.handle();
  }
}
