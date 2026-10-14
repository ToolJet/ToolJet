import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

jest.mock('@modules/mcp-oauth/service', () => ({ McpOAuthService: class {} }));
jest.mock('@helpers/database.helper', () => ({ dbTransactionWrap: (operation, manager) => operation(manager) }));
jest.mock('@helpers/utils.helper', () => ({
  isHttpsEnabled: () => false,
  isSuperAdmin: () => false,
  applyCustomDomainCookieOptions: jest.fn(),
}));
jest.mock('@modules/request-context/service', () => ({ RequestContext: { currentContext: undefined } }));
jest.mock('@otel/tracing', () => ({ trackUserActivity: jest.fn(), extractAppIdFromPath: jest.fn() }));
import { SessionUtilService } from '@modules/session/util.service';
import { JwtStrategy } from '@modules/session/jwt/jwt.strategy';

/** Exercise the actual edited methods; only external repositories and side effects are mocked. */
describe('Existing browser and PAT session compatibility', () => {
  const owner = { id: 'synthetic-owner', email: 'operator@synthetic.example', sessionId: 'synthetic-pat-session' };
  const organization = { id: 'synthetic-workspace', name: 'Garden operations', slug: 'garden', status: 'active' };
  const evidence = { organizationId: organization.id, method: 'form', providerId: null, verifiedAt: 123, policyFingerprint: 'synthetic-fingerprint' };
  let util: any;
  let response: any;
  let manager: any;
  let signed: any;
  beforeEach(() => {
    response = { cookie: jest.fn() };
    manager = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
    util = Object.create(SessionUtilService.prototype);
    util.configService = new ConfigService({});
    util.mcpOAuthService = { captureAuthentication: jest.fn().mockResolvedValue(evidence) };
    util.createSession = jest.fn().mockResolvedValue({ id: 'synthetic-browser-session' });
    util.getPermissionDataToAuthorize = jest.fn().mockResolvedValue({ id: owner.id });
    util.checkUserWorkspaceStatus = jest.fn().mockResolvedValue(false);
    const jwt = new JwtService({ secret: 'synthetic-local-signing-secret' });
    util.sign = jest.fn((payload) => { signed = payload; return jwt.sign(payload); });
  });

  test('workspace PAT keeps its one-workspace JWT, scope and attribution without a browser cookie', async () => {
    const result = await util.generateLoginResultPayload(response, { ...owner }, organization, false, false,
      null, manager, undefined, { token: 'synthetic-pat-hash', patScope: 'workspace', tj_api_source: 'personal_access_token' }, true);
    expect(signed).toMatchObject({ isPATLogin: true, isPasswordLogin: false, isSSOLogin: false,
      organizationIds: [organization.id], sessionId: owner.sessionId, token: 'synthetic-pat-hash', patScope: 'workspace', tj_api_source: 'personal_access_token' });
    expect(signed.workspaceAuthentication).toBeUndefined();
    expect(signed.oauthGrantId).toBeUndefined();
    expect(signed.appId).toBeUndefined();
    expect(typeof result.signed_pat).toBe('string');
    expect(response.cookie).not.toHaveBeenCalled();
    expect(util.createSession).not.toHaveBeenCalled();
    expect(util.mcpOAuthService.captureAuthentication).not.toHaveBeenCalled();
  });

  test.each(['workspace', 'app'])('app-pinned PAT preserves its existing %s scope discriminator', async (patScope) => {
    await util.generateLoginResultPayload(response, { ...owner }, organization, false, false,
      null, manager, undefined, { token: 'synthetic-pat-hash', appId: 'synthetic-app', patScope }, true);
    expect(signed).toMatchObject({ isPATLogin: true, appId: 'synthetic-app', scope: 'App', patScope, organizationIds: [organization.id] });
    expect(response.cookie).not.toHaveBeenCalled();
  });

  test('a normal completed password login sets the browser cookie and keeps internal proof markers out of its response', async () => {
    const result = await util.generateLoginResultPayload(response, { ...owner }, organization, false, true,
      null, manager, undefined, { oauthAuthenticationMethod: 'form', redirectUrl: '/home' });
    expect(signed).toMatchObject({ isPasswordLogin: true, isSSOLogin: false, workspaceAuthentication: evidence });
    expect(signed.isPATLogin).toBeUndefined();
    expect(response.cookie).toHaveBeenCalledWith('tj_auth_token', expect.any(String), expect.objectContaining({ httpOnly: true }));
    expect(result.signed_pat).toBeUndefined();
    expect(result.redirect_url).toBe('/home');
    expect(result.oauth_authentication_method).toBeUndefined();
  });

  test('an OAuth-proof capture failure does not break the existing browser login', async () => {
    util.mcpOAuthService.captureAuthentication.mockRejectedValue(new Error('Synthetic policy lookup failure'));
    await util.generateLoginResultPayload(response, { ...owner }, organization, false, true,
      null, manager, undefined, { oauthAuthenticationMethod: 'form' });
    expect(signed.workspaceAuthentication).toBeUndefined();
    expect(response.cookie).toHaveBeenCalled();
  });

  test('workspace switching preserves signed evidence without pretending a new authentication occurred', async () => {
    const previous = { ...owner, organizationIds: [organization.id], isPasswordLogin: true, workspaceAuthentication: evidence };
    await util.generateLoginResultPayload(response, { ...owner }, { ...organization, id: 'other-workspace' }, false, false,
      previous, manager);
    expect(signed.organizationIds).toEqual([organization.id, 'other-workspace']);
    expect(signed.workspaceAuthentication).toEqual(evidence);
    expect(util.mcpOAuthService.captureAuthentication).not.toHaveBeenCalled();
  });

  function strategy() {
    const instance: any = Object.create(JwtStrategy.prototype);
    instance.transactionLogger = { log: jest.fn() };
    instance.sessionUtilService = {
      validateUserSession: jest.fn().mockResolvedValue(undefined),
      findOrganization: jest.fn().mockResolvedValue(organization),
      handleUnauthorizedUser: jest.fn(),
    };
    instance.userRepository = { findByEmail: jest.fn().mockImplementation(async () => ({ ...owner })) };
    instance.mcpOAuthService = { validateDelegation: jest.fn() };
    return instance;
  }
  const pat = { username: owner.id, sub: owner.email, sessionId: owner.sessionId, organizationIds: [organization.id],
    isPATLogin: true, isSSOLogin: false, isPasswordLogin: false, patScope: 'workspace', tj_api_source: 'personal_access_token' };

  test('PAT JWT still infers its sole workspace without a workspace header', async () => {
    const instance = strategy();
    const user = await instance.validate({ headers: {}, url: '/api/apps' }, pat);
    expect(user).toMatchObject({ organizationId: organization.id, isPATLogin: true, patScope: 'workspace', tjApiSource: 'personal_access_token' });
    expect(instance.sessionUtilService.validateUserSession).toHaveBeenCalledWith(owner.id, owner.sessionId, organization.id);
    expect(instance.mcpOAuthService.validateDelegation).not.toHaveBeenCalled();
  });

  test('PAT JWT cannot select a workspace outside its signed grant', async () => {
    expect(await strategy().validate({ headers: { 'tj-workspace-id': 'other-workspace' } }, pat)).toBe(false);
  });

  test('revoked legacy/PAT sessions still fail through the existing session validation', async () => {
    const instance = strategy();
    instance.sessionUtilService.validateUserSession.mockRejectedValue(new Error('Synthetic revoked session'));
    await expect(instance.validate({ headers: {} }, pat)).rejects.toThrow('revoked session');
  });

  test('an old browser JWT still authenticates ordinary requests without new OAuth evidence', async () => {
    const instance = strategy();
    const user = await instance.validate({ headers: { 'tj-workspace-id': organization.id } }, { ...pat, isPATLogin: false, isPasswordLogin: true });
    expect(user.isPasswordLogin).toBe(true);
    expect(user.isPATLogin).toBe(false);
    expect(user.workspaceAuthentication).toBeUndefined();
    expect(instance.mcpOAuthService.validateDelegation).not.toHaveBeenCalled();
  });
});
