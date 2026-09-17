import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
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
 *
 * THREE session kinds, and the discriminator is the pair (patScope, patAppId) — NOT patAppId
 * alone. Keying on appId was safe only while the embed flow was the only thing that set it; once
 * a workspace token can pin a session to an app, "has an appId" stops meaning "is an embed
 * session" and starts meaning nothing at all.
 *
 *   patScope 'app'                  embed viewer      unrestricted (a shipped feature; it runs a
 *                                                     whole app viewer on a token bound to that
 *                                                     app row, so the app binding is the scope)
 *   patScope 'workspace' + appId    render check      PAT_APP_VIEWER_MODULES, pinned to that one
 *                                                     app, read-only
 *   patScope 'workspace', no appId  automation        PAT_ALLOWED_BUNDLES
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

    /* Browser sessions and SSO sessions are not our business. */
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

    /* TRANSITIONAL: sessions minted before patScope existed carry an appId and no patScope. Without
       this they would land in the app-pinned branch below and be capped mid-flight, breaking every
       live embed session the moment this deploys.
       
       Safe precisely because it is narrow: until this change ships, the ONLY thing that could put an
       appId on a JWT was the embed flow — a workspace token pinning a session to an app is what this
       change introduces. So "appId and no patScope" cannot mean anything else.
       
       Remove once every pre-deploy session has expired (PAT sessions idle out in 60 minutes; embed
       sessions follow the token's sessionExpiryMinutes). */
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
    request: { method?: string; originalUrl?: string; url?: string },
    module: MODULES | undefined,
    feature: string | undefined
  ): string | undefined {
    /* Read-only. A render check looks at an app; it never changes one. */
    if (request?.method && request.method !== 'GET' && !isViewerWriteException(request)) {
      return `This session is read-only. App-scoped render sessions may only issue GET requests.`;
    }

    /* Actually pin it to the app. Without this the session is merely narrow, not scoped — the
       reviewer's point. Covers /api/apps/<uuid>/... only; version- and query-keyed routes do not
       carry the app id, and their containment is the module list above plus CASL. */
    const requestedAppId = extractAppIdFromPath(request?.originalUrl || request?.url);
    if (requestedAppId && requestedAppId !== user.patAppId) {
      return `This session is scoped to a single app and cannot access ${requestedAppId}.`;
    }

    if (!patAppViewerCanAccess(module)) {
      return (
        `This app-scoped session cannot access ${feature ?? module ?? 'this resource'}. ` +
        `Render sessions are limited to: ${PAT_APP_VIEWER_MODULES.join(', ')}.`
      );
    }

    return undefined;
  }
}

/* Deliberately a local copy rather than an import of the identical helper in @otel/tracing:
   importing it pulls telemetry -> utils.helper -> data-sources/types -> the compiled plugin bundle
   -> thrift -> an ESM-only uuid, which Jest cannot parse, and this file's unit test is otherwise
   hermetic. A two-line regex is a smaller price than coupling an auth check to the telemetry
   module. Keep the two in step; the shape is fixed by ToolJet's own routing.
   App-scoped routes look like /api/apps/<uuid>/... — the uuid match avoids catching /apps/slugs. */
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
  /* BOTH run routes (data-queries/controller.ts): `:id/run` is the released-viewer path, and
     `:id/versions/:versionId/run/:environmentId` is the builder path — which is the one the render
     check actually uses, since an unreleased app can only be opened in the editor. Measured: the
     editor issued six of the latter on a single boot. Matching only the short form denied every
     query and the app rendered empty. */
  return /\/data-queries\/[^/]+\/run$/.test(path) || /\/data-queries\/[^/]+\/versions\/[^/]+\/run\/[^/]+$/.test(path);
}

/**
 * TEMPORARY, for deriving PAT_APP_VIEWER_MODULES from a real boot rather than from guesswork.
 *
 * With PAT_SCOPE_AUDIT=true an app-scoped session is never denied — every request is logged with
 * the verdict it WOULD have received. One boot of the player then yields the complete list of what
 * it touches, instead of one module per run: a denial redirects the SPA to login and stops the
 * boot, so collecting 403s the obvious way needs a run per module.
 *
 * Remove this, and the env var, once PAT_APP_VIEWER_MODULES is settled. It must never be set
 * anywhere but a developer's machine — it disables the limit it is measuring.
 */
function auditOnly(): boolean {
  return process.env.PAT_SCOPE_AUDIT === 'true';
}

function logAudit(
  verdict: 'ALLOW' | 'DENY',
  request: { method?: string; originalUrl?: string; url?: string },
  module: MODULES | undefined,
  feature: string | undefined,
  reason?: string
): void {
  console.log(
    `[PAT_SCOPE_AUDIT] ${verdict} ${request?.method ?? '?'} ${request?.originalUrl || request?.url || '?'} ` +
      `module=${module ?? 'NONE'} feature=${feature ?? 'NONE'}${reason ? ` reason=${reason}` : ''}`
  );
}
