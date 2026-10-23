import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { appViewerDenial } from '@modules/personal-access-tokens/interceptors/pat-scope.interceptor';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY as PLUGIN_FEATURE } from '@modules/plugins/constants';
import { FEATURE_KEY as SESSION_FEATURE } from '@modules/session/constants';
import { FEATURE_KEY as CONFIG_FEATURE } from '@modules/configs/constants';
import { patBundleOf, patCanAccess } from '@modules/personal-access-tokens/constants/scopes';

@Injectable()
export class McpOAuthScopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest();
    const user = request.oauthDelegatedUser || request.user;
    if (!user?.oauthGrantId) return next.handle();
    if (this.reflector.get('mcpOAuthViewerMint', context.getHandler()) && !user.oauthAppId) return next.handle();
    const module = this.reflector.get<MODULES>('tjModuleId', context.getClass());
    const feature = this.reflector.get<string | string[]>('tjFeatureId', context.getHandler());
    const features = Array.isArray(feature) ? feature : [feature];
    if (user.oauthAppId) {
      // The real browser bootstrap reads the explicitly public configuration before session setup.
      if (request.method === 'GET' && module === MODULES.CONFIGS &&
          features.length === 1 && features[0] === CONFIG_FEATURE.GET_PUBLIC_CONFIGS) return next.handle();
      // SessionService handles this one bootstrap read without creating or changing sessions.
      if (request.method === 'GET' && module === MODULES.SESSION &&
          features.length === 1 && features[0] === SESSION_FEATURE.GET_USER_SESSION) return next.handle();
      const denial = features.map((item) => appViewerDenial(user.oauthAppId, request, module, item)).find(Boolean);
      if (denial) throw new ForbiddenException(denial);
      if (request.tj_app && request.tj_app.organizationId !== user.organizationId)
        throw new ForbiddenException('The app belongs to another workspace');
      return next.handle();
    }
    // Installed API contracts contain shared datasource metadata, not plugin administration.
    const readPluginSpec = module === MODULES.PLUGINS && request.method === 'GET' &&
      features.length === 1 && features[0] === PLUGIN_FEATURE.GET_SPEC;
    const bundle = readPluginSpec ? 'data' : patBundleOf(module);
    if (
      !bundle ||
      !user.oauthScopes?.includes(bundle) ||
      !features.every((item) => patCanAccess(module, item))
    ) {
      throw new ForbiddenException('The AI connection was not authorized for this operation');
    }
    if (request.tj_app && request.tj_app.organizationId !== user.organizationId) {
      throw new ForbiddenException('The app belongs to another workspace');
    }
    // Match the workspace PAT contract. Existing route guards and service-level permissions
    // remain authoritative; requiring one particular guard class broke legitimate PAT routes.
    return next.handle();
  }
}
