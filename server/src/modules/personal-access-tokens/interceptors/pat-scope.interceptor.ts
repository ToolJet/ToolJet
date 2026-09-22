import { CallHandler, ExecutionContext, ForbiddenException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { MODULES } from '@modules/app/constants/modules';
import { User } from '@entities/user.entity';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';
import {
  PAT_ALLOWED_BUNDLES,
  PAT_APP_VIEWER_MODULES,
  patAppViewerCanAccess,
  patCanAccess,
} from '@modules/personal-access-tokens/constants/scopes';

/**
 * Confines personal-access-token sessions to what their KIND is entitled to.
 * Session kinds and the rules behind them: see this module's AGENTS.md.
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

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request?.user;

    if (!user?.isPATLogin) {
      return next.handle();
    }

    const module = this.reflector.get<MODULES>('tjModuleId', context.getClass());
    const feature = this.reflector.get<string>('tjFeatureId', context.getHandler());

    /* The embed flow. Its token is bound to an app row, so the binding IS the scope. Restricting
       it would regress a shipped feature. */
    if (user.patScope === PersonalAccessTokenScope.APP) {
      return next.handle();
    }

    // TRANSITIONAL: pre-patScope embed JWTs; drop once sessions minted before deploy expire.
    if (!user.patScope && user.patAppId) {
      return next.handle();
    }

    if (user.patAppId) {
      const denial = this.denyViewer(user, request, module, feature);
      if (denial) {
        if (auditOnly()) {
          logAudit('DENY', request, module, feature, denial);
        } else {
          throw new ForbiddenException(denial);
        }
      } else if (auditOnly()) {
        logAudit('ALLOW', request, module, feature);
      }
      return next.handle();
    }

    if (!patCanAccess(module, feature)) {
      throw new ForbiddenException(
        `This personal access token cannot access ${feature ?? module ?? 'this resource'}. ` +
          `Workspace tokens are limited to: ${PAT_ALLOWED_BUNDLES.join(', ')}.`
      );
    }

    return next.handle();
  }

  /**
   * Returns the denial message, or undefined if the request is allowed. Three narrowings, and all
   * three matter — the module list alone would leave the session free to roam the workspace and
   * to write.
   */
  private denyViewer(
    user: User,
    request: { method?: string; originalUrl?: string; url?: string; tj_app?: { id: string } },
    module: MODULES | undefined,
    feature: string | undefined
  ): string | undefined {
    if (request?.method && request.method !== 'GET' && !isViewerWriteException(request)) {
      return `This session is read-only. App-scoped render sessions may only issue GET requests.`;
    }

    /* Pin to the app. Guards resolved it already (slug routes and query runs never carry the uuid
       in the path); the regex is the fallback for routes with no app guard. */
    const requestedAppId: string | undefined =
      request?.tj_app?.id ?? extractAppIdFromPath(request?.originalUrl || request?.url);
    if (requestedAppId && requestedAppId !== user.patAppId) {
      return `This session is scoped to a single app and cannot access ${requestedAppId}.`;
    }

    if (!patAppViewerCanAccess(module, feature)) {
      return (
        `This app-scoped session cannot access ${feature ?? module ?? 'this resource'}. ` +
        `Render sessions are limited to: ${PAT_APP_VIEWER_MODULES.join(', ')}.`
      );
    }

    return undefined;
  }
}

// Local copy of the @otel/tracing helper: importing it drags an ESM-only uuid into Jest.
const APP_ID_IN_PATH = /\/apps\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#]|$)/i;

function extractAppIdFromPath(path?: string): string | undefined {
  if (!path) return undefined;
  return APP_ID_IN_PATH.exec(path)?.[1];
}

/**
 * The player has to execute the app's queries to render anything, and that is a POST. Nothing else
 * is exempt from the read-only rule.
 */
function isViewerWriteException(request: { originalUrl?: string; url?: string }): boolean {
  const path = (request?.originalUrl || request?.url || '').split('?')[0];
  /* BOTH run routes: `:id/run` is the released-viewer path, and `:id/versions/:versionId/run/:envId`
     is the builder path — the one the render check uses, since an unreleased app can only be opened
     in the editor. */
  return /\/data-queries\/[^/]+\/run$/.test(path) || /\/data-queries\/[^/]+\/versions\/[^/]+\/run\/[^/]+$/.test(path);
}

const auditLogger = new Logger('PatScopeAudit');

// TEMPORARY dev-only audit: logs verdicts instead of denying; never set in prod; remove once
// PAT_APP_VIEWER_MODULES settles.
function auditOnly(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.PAT_SCOPE_AUDIT === 'true';
}

function logAudit(
  verdict: 'ALLOW' | 'DENY',
  request: { method?: string; originalUrl?: string; url?: string },
  module: MODULES | undefined,
  feature: string | undefined,
  reason?: string
): void {
  auditLogger.log(
    `${verdict} ${request?.method ?? '?'} ${request?.originalUrl || request?.url || '?'} ` +
      `module=${module ?? 'NONE'} feature=${feature ?? 'NONE'}${reason ? ` reason=${reason}` : ''}`
  );
}
