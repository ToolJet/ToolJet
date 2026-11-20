/** @group security */
jest.mock('@modules/mcp-oauth/service', () => ({ McpOAuthService: class {} }));
jest.mock('@modules/mcp-oauth/identity.service', () => ({ McpOAuthIdentityService: class {} }));
const manager = {};
jest.mock('@helpers/database.helper', () => ({ dbTransactionWrap: (operation) => operation(manager) }));
jest.mock('src/helpers/database.helper', () => ({ dbTransactionWrap: (operation) => operation(manager) }));
jest.mock('@modules/request-context/service', () => ({ RequestContext: { currentContext: undefined } }));
jest.mock('@otel/tracing', () => ({ trackUserActivity: jest.fn(), extractAppIdFromPath: jest.fn() }));
import 'reflect-metadata';
import { of } from 'rxjs';
import { ForbiddenException } from '@nestjs/common';
import { browserSsoUserInfo, isEmbedSession, withholdsUpstreamSso } from '@modules/session/sso-exposure';
import { AuthService } from '@modules/auth/service';
import { JwtStrategy } from '@modules/session/jwt/jwt.strategy';
import { PatScopeInterceptor } from '@modules/personal-access-tokens/interceptors/pat-scope.interceptor';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY as SESSION_FEATURE } from '@modules/session/constants';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';
import { FEATURE_KEY as ONBOARDING_FEATURE } from '@modules/onboarding/constants';

const storedSso = { email: 'owner@orchard.test', access_token: 'idp-access', refresh_token: 'idp-refresh' };

const browser = { id: 'owner', organizationId: 'org-orchard' };
const workspaceToken = { ...browser, isPATLogin: true, patScope: PersonalAccessTokenScope.WORKSPACE };
const renderSession = { ...workspaceToken, patAppId: 'app-harvest' };
// The external API mints an app token for the person who views the embed.
const embedSession = { ...browser, isPATLogin: true, patScope: PersonalAccessTokenScope.APP, patAppId: 'app-harvest' };
const legacyEmbedSession = { ...browser, isPATLogin: true, patAppId: 'app-harvest' };
const oauthViewer = { ...browser, oauthGrantId: 'grant', oauthAppId: 'app-harvest' };

describe('upstream SSO data in responses', () => {
  describe('browserSsoUserInfo()', () => {
    it('should keep the stored SSO data for an ordinary browser session', () => {
      expect(withholdsUpstreamSso(browser)).toBe(false);
      expect(browserSsoUserInfo(storedSso, browser)).toBe(storedSso);
    });

    it("should keep an embed viewer's own SSO data", () => {
      for (const principal of [embedSession, legacyEmbedSession]) {
        expect(isEmbedSession(principal)).toBe(true);
        expect(withholdsUpstreamSso(principal)).toBe(false);
        expect(browserSsoUserInfo(storedSso, principal)).toBe(storedSso);
      }
    });

    it('should leave it out for workspace token, render and OAuth sessions', () => {
      for (const principal of [workspaceToken, renderSession, oauthViewer]) {
        expect(isEmbedSession(principal)).toBe(false);
        expect(withholdsUpstreamSso(principal)).toBe(true);
        expect(browserSsoUserInfo(storedSso, principal)).toEqual({});
      }
    });
  });

  describe('AuthService.authorizeOrganization()', () => {
    const authorize = async (user: any) => {
      const service: any = Object.create(AuthService.prototype);
      service.userRepository = { updateOne: jest.fn() };
      service.organizationRepository = {
        get: jest.fn(async () => ({ id: 'org-orchard', slug: 'orchard', name: 'Orchard' })),
      };
      service.sessionUtilService = {
        getPermissionDataToAuthorize: jest.fn(async () => ({ ssoUserInfo: storedSso, metadata: {}, admin: false })),
      };
      return { body: await service.authorizeOrganization({ defaultOrganizationId: 'org-vineyard', ...user }), service };
    };

    it('should return the stored SSO data to an ordinary browser session', async () => {
      const { body, service } = await authorize(browser);

      expect(body.sso_user_info).toEqual(storedSso);
      expect(body.current_user.sso_user_info).toEqual(storedSso);
      expect(service.userRepository.updateOne).toHaveBeenCalled();
    });

    it('should leave it out for a workspace token session', async () => {
      const { body } = await authorize(workspaceToken);

      expect(body).toMatchObject({ sso_user_info: {}, current_user: { sso_user_info: {} } });
    });

    it("should return an embed viewer's own SSO data", async () => {
      const { body } = await authorize(embedSession);

      expect(body).toMatchObject({ sso_user_info: storedSso, current_user: { sso_user_info: storedSso } });
    });

    it('should leave it out for a render session and not move the default workspace', async () => {
      const { body, service } = await authorize(renderSession);

      expect(body).toMatchObject({ sso_user_info: {}, current_user: { sso_user_info: {} } });
      expect(service.userRepository.updateOne).not.toHaveBeenCalled();
    });
  });
});

describe('JwtStrategy.validate() | session bootstrap', () => {
  const strategy = () => {
    const instance: any = Object.create(JwtStrategy.prototype);
    instance.transactionLogger = { log: jest.fn() };
    instance.sessionUtilService = {
      validateUserSession: jest.fn(async () => undefined),
      getDefaultBranchId: jest.fn(async () => null),
    };
    instance.userRepository = { findByEmail: jest.fn(async () => ({ id: 'owner', email: 'owner@orchard.test' })) };
    return instance;
  };
  const bootstrapRequest = () => ({ isGetUserSession: true, headers: {}, cookies: {}, query: {} });

  it('should keep the signed token scope on the bootstrap principal', async () => {
    const user = await strategy().validate(bootstrapRequest(), {
      sub: 'owner@orchard.test',
      username: 'owner',
      sessionId: 'session-1',
      organizationIds: ['org-orchard'],
      isPATLogin: true,
      patScope: PersonalAccessTokenScope.WORKSPACE,
      appId: 'app-harvest',
      fixedExpiry: true,
    });

    expect(user).toMatchObject({
      isPATLogin: true,
      patScope: PersonalAccessTokenScope.WORKSPACE,
      patAppId: 'app-harvest',
      organizationId: 'org-orchard',
    });
  });

  it('should keep the embed claims on the principal that logout and bootstrap see', async () => {
    const user = await strategy().validate(bootstrapRequest(), {
      sub: 'owner@orchard.test',
      username: 'owner',
      sessionId: 'session-1',
      organizationIds: ['org-orchard'],
      isPATLogin: true,
      patScope: PersonalAccessTokenScope.APP,
      appId: 'app-harvest',
    });

    expect(user).toMatchObject({ isPATLogin: true, patScope: PersonalAccessTokenScope.APP, patAppId: 'app-harvest' });
    expect(isEmbedSession(user)).toBe(true);
  });

  it('should leave an ordinary browser bootstrap principal unscoped', async () => {
    const user = await strategy().validate(bootstrapRequest(), {
      sub: 'owner@orchard.test',
      username: 'owner',
      sessionId: 'session-1',
      organizationIds: ['org-orchard', 'org-vineyard'],
      isSSOLogin: true,
    });

    expect(user).toMatchObject({ isPATLogin: false });
    expect(user.patScope).toBeUndefined();
    expect(user.patAppId).toBeUndefined();
    expect(user.isSSOLogin).toBeUndefined();
  });
});

describe('PatScopeInterceptor | session bootstrap', () => {
  const run = (user: any, module: MODULES, feature: string, method = 'GET') => {
    const reflector: any = {
      get: (key: string) => (key === 'tjModuleId' ? module : feature),
    };
    const context: any = {
      getType: () => 'http',
      getClass: () => ({}),
      getHandler: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user, method, originalUrl: '/api/session', headers: {} }) }),
    };
    return new PatScopeInterceptor(reflector).intercept(context, { handle: () => of('HANDLED') });
  };

  it('should let a render session read its own session bootstrap', () => {
    expect(() => run(renderSession, MODULES.SESSION, SESSION_FEATURE.GET_USER_SESSION)).not.toThrow();
  });

  it('should still refuse the rest of the session module to a render session', () => {
    expect(() => run(renderSession, MODULES.SESSION, SESSION_FEATURE.LOG_OUT)).toThrow(ForbiddenException);
  });

  it('should let an embed session log out and reach the other session routes it used before', () => {
    expect(() => run(embedSession, MODULES.SESSION, SESSION_FEATURE.LOG_OUT)).not.toThrow();
    expect(() => run(embedSession, MODULES.SESSION, SESSION_FEATURE.GET_USER_SESSION)).not.toThrow();
    expect(() => run(embedSession, MODULES.ONBOARDING, ONBOARDING_FEATURE.GET_ONBOARDING_SESSION)).not.toThrow();
  });

  it('should still refuse logout and the onboarding session to a workspace token session', () => {
    expect(() => run(workspaceToken, MODULES.SESSION, SESSION_FEATURE.LOG_OUT)).toThrow(ForbiddenException);
    expect(() => run(workspaceToken, MODULES.ONBOARDING, ONBOARDING_FEATURE.GET_ONBOARDING_SESSION)).toThrow(
      ForbiddenException
    );
  });

  it('should still apply the workspace token ceiling to other routes', () => {
    expect(() => run(workspaceToken, MODULES.ORGANIZATIONS, 'anything')).toThrow(ForbiddenException);
  });
});
