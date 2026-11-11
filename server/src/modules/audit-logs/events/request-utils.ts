import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as requestIp from 'request-ip';
import { MODULE_INFO } from '@modules/app/constants/module-info';
import { FeatureConfig } from '@modules/app/types';
import { ActiveAuditRouteSpec, AuditableRequest, AuditActor, IdSource } from './types';

// Shown when a PAT was created without a name; the spec requires token.name.
export const UNNAMED_TOKEN_LABEL = 'api_key';

export function getAuditableRequest(context: ExecutionContext): AuditableRequest {
  return context.switchToHttp().getRequest<AuditableRequest>();
}

/** The route's audit spec, or null when the route isn't audited or is explicitly skipped. */
export function readAuditSpec(reflector: Reflector, context: ExecutionContext): ActiveAuditRouteSpec | null {
  const module = reflector.get<string>('tjModuleId', context.getClass());
  const features = reflector.get<string | string[]>('tjFeatureId', context.getHandler());
  const feature = Array.isArray(features) ? features[0] : features;
  if (!module || !feature) return null;

  const config = (MODULE_INFO as Record<string, Record<string, FeatureConfig>>)[module]?.[feature];
  const spec = config?.audit;
  if (!spec || 'skip' in spec) return null;
  return spec;
}

export function capturesBefore(spec: ActiveAuditRouteSpec): boolean {
  return spec.captureBefore ?? !spec.action.endsWith('.created');
}

/** Reads `params.x` from the request. Response sources are resolved by the adapter. */
export function readParamIdentifier(source: IdSource, request: AuditableRequest): string | null {
  if (!source.startsWith('params.')) return null;
  const value = request.params?.[source.slice('params.'.length)];
  return typeof value === 'string' && value.length ? value : null;
}

/** Null when nobody can be attributed (no user and no API key), in which case no event is written. */
export function buildActor(request: AuditableRequest): AuditActor | null {
  const ip_address = requestIp.getClientIp(request) ?? null;
  const userAgent = request.headers['user-agent'];
  const user_agent = typeof userAgent === 'string' ? userAgent : null;

  if (request.tj_auth === 'api_key') {
    return { type: 'api_key', user: null, token: null, ip_address, user_agent };
  }
  const user = request.user;
  if (!user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
  const pat = request.tj_auth === 'pat' ? request.personalAccessToken : undefined;
  return {
    type: pat ? 'pat' : 'user',
    user: { id: user.id, name, email: user.email },
    token: pat ? { id: pat.id, name: pat.name || UNNAMED_TOKEN_LABEL } : null,
    ip_address,
    user_agent,
  };
}
