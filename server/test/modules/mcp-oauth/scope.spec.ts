import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { of } from 'rxjs';
// Scope tests isolate the interceptor from the application's database/telemetry bootstrap.
jest.mock('@modules/app/guards/ability.guard', () => ({ AbilityGuard: class {} }));
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { McpOAuthScopeInterceptor } from '@modules/mcp-oauth/scope.interceptor';
import { MODULES } from '@modules/app/constants/modules';
import { sanitizeTraceObject, sanitizeOAuthRequest, sanitizeOAuthUrl } from '@otel/sanitize';

class CheckedPermissionGuard extends AbilityGuard {}
class Controller {}
function action() {}
const user = { oauthGrantId: 'synthetic-grant', organizationId: 'garden', oauthScopes: ['apps'] };
function context(request: any, module = MODULES.APP, guards: any[] = [CheckedPermissionGuard]) {
  Reflect.defineMetadata('tjModuleId', module, Controller);
  Reflect.defineMetadata('tjFeatureId', 'create', action);
  Reflect.defineMetadata(GUARDS_METADATA, guards, Controller);
  return {
    getType: () => 'http',
    getClass: () => Controller,
    getHandler: () => action,
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}
describe('OAuth delegated scope enforcement', () => {
  const interceptor = new McpOAuthScopeInterceptor(new Reflector());
  const next = { handle: jest.fn(() => of('allowed')) };
  beforeEach(() => next.handle.mockClear());
  test('preserves normal browser and PAT behavior', () => {
    for (const principal of [{}, { isPATLogin: true }])
      interceptor.intercept(context({ user: principal }), next);
    expect(next.handle).toHaveBeenCalledTimes(2);
  });
  test('permits only an approved module after the existing permission guard', () => {
    interceptor.intercept(context({ user }), next);
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(() => interceptor.intercept(context({ user }, MODULES.GLOBAL_DATA_SOURCE), next)).toThrow();
  });
  test.each([
    MODULES.AUTH,
    MODULES.SESSION,
    MODULES.PERSONAL_ACCESS_TOKENS,
    MODULES.AI,
    MODULES.INSTANCE_SETTINGS,
  ])('cannot reach credential/admin/spending module %s', (module) => {
    expect(() =>
      interceptor.intercept(
        context({ user: { ...user, oauthScopes: ['apps', 'data', 'workspace_users'] } }, module),
        next,
      ),
    ).toThrow();
  });
  test('matches the existing PAT contract for allowed routes with service-level authorization', () => {
    interceptor.intercept(context({ user }, MODULES.APP, []), next);
    expect(next.handle).toHaveBeenCalledTimes(1);
  });
  test('cannot switch workspace or bypass restrictions by replacing request.user', () => {
    expect(() =>
      interceptor.intercept(context({ user, tj_app: { organizationId: 'another-workspace' } }), next),
    ).toThrow();
    expect(() =>
      interceptor.intercept(
        context({ user: {}, oauthDelegatedUser: user }, MODULES.GLOBAL_DATA_SOURCE),
        next,
      ),
    ).toThrow();
  });
  test('data scope permits GET_SPEC only and cannot administer plugins', () => {
    const request = { user: { ...user, oauthScopes: ['data'] }, method: 'GET' };
    const ctx = context(request, MODULES.PLUGINS);
    Reflect.defineMetadata('tjFeatureId', 'get_spec', action);
    interceptor.intercept(ctx, next);
    expect(next.handle).toHaveBeenCalledTimes(1);
    for (const feature of ['install', 'reload', 'update', 'get']) {
      Reflect.defineMetadata('tjFeatureId', feature, action);
      expect(() => interceptor.intercept(ctx, next)).toThrow();
    }
    Reflect.defineMetadata('tjFeatureId', 'get_spec', action);
    request.method = 'POST';
    expect(() => interceptor.intercept(ctx, next)).toThrow();
  });
  test('workflows are available only when consented and administration remains excluded', () => {
    interceptor.intercept(context({ user: { ...user, oauthScopes: ['workflows'] } }, MODULES.WORKFLOWS), next);
    expect(() => interceptor.intercept(context({ user }, MODULES.WORKFLOWS), next)).toThrow();
    expect(() => interceptor.intercept(context({ user: { ...user, oauthScopes: ['workspace_admin'] } }, MODULES.ORGANIZATIONS), next)).toThrow();
  });
  test('viewer shares the PAT app pin, boot features and write ceiling', () => {
    const appId = '00000000-0000-4000-8000-000000000001';
    const request: any = { user: { ...user, oauthAppId: appId }, method: 'GET', tj_app: { id: appId, organizationId: 'garden' } };
    const ctx = context(request);
    Reflect.defineMetadata('tjFeatureId', 'get_one', action);
    interceptor.intercept(ctx, next);
    request.method = 'PUT';
    expect(() => interceptor.intercept(ctx, next)).toThrow();
    request.method = 'GET'; request.tj_app.id = 'another-app';
    expect(() => interceptor.intercept(ctx, next)).toThrow();
    delete request.tj_app;
    Reflect.defineMetadata('tjFeatureId', 'get', action); // Workspace-wide app listing.
    expect(() => interceptor.intercept(ctx, next)).toThrow();
    expect(() => interceptor.intercept(context(request, MODULES.PERSONAL_ACCESS_TOKENS), next)).toThrow();
  });
  test('viewer permits measured public config bootstrap but not config administration or widgets', () => {
    const request: any = { user: { ...user, oauthAppId: 'pinned-app' }, method: 'GET' };
    const ctx = context(request, MODULES.CONFIGS);
    Reflect.defineMetadata('tjFeatureId', 'GET_PUBLIC_CONFIGS', action);
    interceptor.intercept(ctx, next);
    Reflect.defineMetadata('tjFeatureId', 'GET_WIDGETS', action);
    expect(() => interceptor.intercept(ctx, next)).toThrow();
    Reflect.defineMetadata('tjFeatureId', 'GET_PUBLIC_CONFIGS', action);
    request.method = 'POST';
    expect(() => interceptor.intercept(ctx, next)).toThrow();
  });
  test('viewer session bootstrap never grants logout or invitation/session management', () => {
    const request: any = { user: { ...user, oauthAppId: 'pinned-app' }, method: 'GET' };
    const ctx = context(request, MODULES.SESSION);
    Reflect.defineMetadata('tjFeatureId', 'check_unique', action);
    interceptor.intercept(ctx, next);
    for (const feature of ['log_out', 'update']) {
      Reflect.defineMetadata('tjFeatureId', feature, action);
      expect(() => interceptor.intercept(ctx, next)).toThrow();
    }
    Reflect.defineMetadata('tjFeatureId', 'check_unique', action);
    request.method = 'POST';
    expect(() => interceptor.intercept(ctx, next)).toThrow();
  });
  test('HTTP telemetry removes OAuth URLs, interaction IDs and callback codes', () => {
    const result = sanitizeOAuthRequest({
      url: '/api/mcp-oauth/interactions/synthetic-handle/session?state=synthetic-state',
      params: { id: 'synthetic-handle' }, query: { state: 'synthetic-state' },
      headers: { referer: 'https://tooljet.example/mcp/consent?request=synthetic-handle' },
    });
    expect(JSON.stringify(result)).not.toContain('synthetic');
    expect(sanitizeOAuthUrl('http://127.0.0.1:1234/callback?code=synthetic-code&state=synthetic-state'))
      .toBe('http://127.0.0.1:1234/callback');
    expect(sanitizeOAuthUrl('/api/health')).toBe('/api/health');
  });
  test('redacts nested OAuth secrets in telemetry', () => {
    const value = sanitizeTraceObject({
      grant_type: 'authorization_code',
      code: 'synthetic-code',
      nested: [{ subject_token: 'synthetic-token', code_verifier: 'synthetic-verifier' }],
      'x-tooljet-delegation': 'synthetic-delegation',
      cookies: { tj_oauth_viewer: 'synthetic-viewer' },
    });
    expect(value.grant_type).toBe('authorization_code');
    expect(JSON.stringify(value)).not.toContain('synthetic');
  });
});
