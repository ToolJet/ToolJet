/**
 * Decisions that decide what may ship stay in the browser: a token (PAT, or an AI connection over OAuth) cannot release
 * past a failed security gate, approve a review, or release without one. Everything else in those modules stays
 * reachable.
 *
 * @group security
 */
import { ForbiddenException } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY as APP_SECURITY_FEATURE } from '@modules/app-security/constants';
import { FEATURE_KEY as VERSION_FEATURE } from '@modules/versions/constants';
import { PAT_DENIED_FEATURES, patCanAccess } from '@modules/personal-access-tokens/constants/scopes';
import { PatScopeInterceptor } from '@modules/personal-access-tokens/interceptors/pat-scope.interceptor';
import { McpOAuthScopeInterceptor } from '@modules/mcp-oauth/scope.interceptor';

const BROWSER_ONLY: [MODULES, string][] = [
  [MODULES.APP_SECURITY, APP_SECURITY_FEATURE.OVERRIDE_GATE],
  [MODULES.VERSION, VERSION_FEATURE.REVIEW_APPROVE],
  [MODULES.VERSION, VERSION_FEATURE.REVIEW_OVERRIDE],
];

const stillReachable = (module: MODULES, features: Record<string, string>) =>
  Object.values(features).filter((feature) => !BROWSER_ONLY.some(([m, f]) => m === module && f === feature));

const contextFor = (user: any, module: MODULES, feature: string) =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ user, method: 'POST', originalUrl: '/api/apps/x' }) }),
    getClass: () => class {},
    getHandler: () => () => undefined,
  }) as any;

const reflectorFor = (module: MODULES, feature: string) =>
  ({ get: (key: string) => (key === 'tjModuleId' ? module : key === 'tjFeatureId' ? feature : undefined) }) as any;

const next = { handle: () => 'HANDLED' } as any;

describe('Token scope for release decisions', () => {
  describe('patCanAccess', () => {
    it.each(BROWSER_ONLY)('refuses %s %s', (module, feature) => {
      expect(patCanAccess(module, feature)).toBe(false);
    });

    it('lists exactly those features in the deny set', () => {
      const listed = Object.entries(PAT_DENIED_FEATURES).flatMap(([module, features]) =>
        [...features].map((feature) => [module, feature])
      );
      expect(listed).toEqual(expect.arrayContaining(BROWSER_ONLY));
      expect(listed).toHaveLength(BROWSER_ONLY.length);
    });

    it.each(stillReachable(MODULES.APP_SECURITY, APP_SECURITY_FEATURE))(
      'still allows security feature %s',
      (feature) => {
        expect(patCanAccess(MODULES.APP_SECURITY, feature)).toBe(true);
      }
    );

    it.each(stillReachable(MODULES.VERSION, VERSION_FEATURE))('still allows version feature %s', (feature) => {
      expect(patCanAccess(MODULES.VERSION, feature)).toBe(true);
    });
  });

  describe('PatScopeInterceptor', () => {
    const patSession = { isPATLogin: true, patScope: 'workspace', organizationId: 'ws-1' };

    it.each(BROWSER_ONLY)('refuses a workspace token on %s %s', (module, feature) => {
      const interceptor = new PatScopeInterceptor(reflectorFor(module, feature));
      expect(() => interceptor.intercept(contextFor(patSession, module, feature), next)).toThrow(ForbiddenException);
    });

    it('still lets a workspace token read the gate, comment on a review and compare versions', () => {
      for (const [module, feature] of [
        [MODULES.APP_SECURITY, APP_SECURITY_FEATURE.GET_SCANS],
        [MODULES.VERSION, VERSION_FEATURE.COMPARE],
        [MODULES.VERSION, VERSION_FEATURE.GET_ONE],
      ] as [MODULES, string][]) {
        const interceptor = new PatScopeInterceptor(reflectorFor(module, feature));
        expect(interceptor.intercept(contextFor(patSession, module, feature), next)).toBe('HANDLED');
      }
    });

    it('leaves browser sessions alone', () => {
      const interceptor = new PatScopeInterceptor(reflectorFor(MODULES.VERSION, VERSION_FEATURE.REVIEW_APPROVE));
      expect(interceptor.intercept(contextFor({ id: 'u-1' }, MODULES.VERSION, 'x'), next)).toBe('HANDLED');
    });
  });

  describe('McpOAuthScopeInterceptor', () => {
    const aiConnection = { oauthGrantId: 'grant-1', organizationId: 'ws-1', oauthScopes: ['apps'] };

    it.each(BROWSER_ONLY)('refuses an AI connection with the apps scope on %s %s', (module, feature) => {
      const interceptor = new McpOAuthScopeInterceptor(reflectorFor(module, feature));
      expect(() => interceptor.intercept(contextFor(aiConnection, module, feature), next)).toThrow(ForbiddenException);
    });

    it('still lets it read the gate and the reviews', () => {
      for (const [module, feature] of [
        [MODULES.APP_SECURITY, APP_SECURITY_FEATURE.GET_SCANS],
        [MODULES.VERSION, VERSION_FEATURE.COMPARE],
      ] as [MODULES, string][]) {
        const interceptor = new McpOAuthScopeInterceptor(reflectorFor(module, feature));
        expect(interceptor.intercept(contextFor(aiConnection, module, feature), next)).toBe('HANDLED');
      }
    });
  });
});
