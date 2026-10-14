import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('@modules/mcp-oauth/service', () => ({ McpOAuthService: class {} }));
jest.mock('@modules/auth/util.service', () => ({ AuthUtilService: class {} }));
jest.mock('@modules/setup-organization/util.service', () => ({ SetupOrganizationsUtilService: class {} }));
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: (operation, manager) => operation(manager || { update: async () => ({ affected: 1 }) }),
}));
jest.mock('@helpers/utils.helper', () => ({
  isHttpsEnabled: () => false,
  decamelizeKeysExcept: (value) => value,
  isSuperAdmin: () => false,
  validatePasswordDomain: async () => true,
  applyCustomDomainCookieOptions: jest.fn(),
}));
jest.mock('@modules/request-context/service', () => ({ RequestContext: { currentContext: undefined, setLocals: jest.fn() } }));
jest.mock('@otel/tracing', () => ({ trackUserActivity: jest.fn(), extractAppIdFromPath: jest.fn() }));
import { AuthService } from '@modules/auth/service';
import { SessionUtilService } from '@modules/session/util.service';

/** Runs real AuthService.login and SessionUtilService.generateLoginResultPayload together. */
describe('Invitation login cannot mint OAuth authentication evidence', () => {
  const password = 'Synthetic-Orchard-Password-123';
  const workspace = { id: 'active-workspace', name: 'Orchard', slug: 'orchard', status: 'active', ssoConfigs: [{ sso: 'form', enabled: true }] };
  const evidence = { organizationId: workspace.id, method: 'form', providerId: null, verifiedAt: 123, policyFingerprint: 'synthetic-fingerprint' };
  let passwordHash: string;
  let auth: any;
  let sessions: any;
  let owner: any;
  let response: any;
  let signed: any;
  beforeAll(async () => { passwordHash = await bcrypt.hash(password, 4); });
  beforeEach(() => {
    owner = { id: 'synthetic-user', email: 'orchard@synthetic.example', password: passwordHash, defaultOrganizationId: workspace.id };
    response = { cookie: jest.fn() };
    sessions = Object.create(SessionUtilService.prototype);
    sessions.configService = new ConfigService({});
    sessions.mcpOAuthService = { captureAuthentication: jest.fn().mockResolvedValue(evidence) };
    sessions.createSession = jest.fn().mockResolvedValue({ id: 'synthetic-session' });
    sessions.getPermissionDataToAuthorize = jest.fn().mockResolvedValue({ id: owner.id });
    sessions.checkUserWorkspaceStatus = jest.fn().mockResolvedValue(false);
    sessions.sign = jest.fn((payload) => { signed = payload; return 'synthetic-signed-session'; });
    auth = Object.create(AuthService.prototype);
    auth.userRepository = { findByEmail: jest.fn().mockResolvedValue(owner), updateOne: jest.fn().mockResolvedValue(undefined) };
    auth.authUtilService = { validateLoginUser: jest.fn().mockResolvedValue(owner) };
    auth.organizationRepository = { get: jest.fn().mockResolvedValue(workspace), findOrganizationWithLoginSupport: jest.fn().mockResolvedValue([workspace]) };
    auth.instanceSettingsUtilService = { getSettings: jest.fn().mockResolvedValue('false') };
    auth.sessionUtilService = sessions;
    auth.maybeRequireMfa = jest.fn().mockResolvedValue(null);
    signed = undefined;
  });

  test.each(['/invitations/synthetic-invite', '/organization-invitations/synthetic-invite'])('invitation route %s keeps browser login but clears even previously signed OAuth evidence', async (redirectTo) => {
    const previous = { ...owner, sessionId: 'previous-session', organizationIds: [workspace.id], isPasswordLogin: true, workspaceAuthentication: evidence };
    const result = await auth.login(response, { email: owner.email, password, redirectTo }, 'invited-workspace', previous);
    expect(auth.maybeRequireMfa).not.toHaveBeenCalled(); // Existing invitation behavior stays intact.
    expect(response.cookie).toHaveBeenCalled();
    expect(signed.isPasswordLogin).toBe(true);
    expect(signed.workspaceAuthentication).toBeUndefined();
    expect(sessions.mcpOAuthService.captureAuthentication).not.toHaveBeenCalled();
    expect(result.oauth_authentication_reset).toBeUndefined();
  });

  test('regular completed workspace login still mints proof after the MFA gate', async () => {
    await auth.login(response, { email: owner.email, password, redirectTo: '/mcp/consent?request=synthetic' }, workspace.id);
    expect(auth.maybeRequireMfa).toHaveBeenCalledWith(owner);
    expect(signed.workspaceAuthentication).toEqual(evidence);
    expect(sessions.mcpOAuthService.captureAuthentication).toHaveBeenCalledWith(workspace.id, 'form', undefined);
  });

  test('a pending MFA challenge issues neither a session nor OAuth evidence', async () => {
    const challenge = { mfa_required: true, mfa_token: 'synthetic-pending-challenge' };
    auth.maybeRequireMfa.mockResolvedValue(challenge);
    expect(await auth.login(response, { email: owner.email, password }, workspace.id)).toEqual(challenge);
    expect(signed).toBeUndefined();
    expect(response.cookie).not.toHaveBeenCalled();
    expect(sessions.mcpOAuthService.captureAuthentication).not.toHaveBeenCalled();
  });

  test.each([true, false])('workspace authorization never changes preferences for viewer=%s', async (viewer) => {
    const principal = { ...owner, organizationId: workspace.id, defaultOrganizationId: 'different-default',
      ...(viewer ? { oauthGrantId: 'synthetic-grant', oauthAppId: 'synthetic-app' } : {}) };
    await auth.authorizeOrganization(principal);
    if (viewer) expect(auth.userRepository.updateOne).not.toHaveBeenCalled();
    else expect(auth.userRepository.updateOne).toHaveBeenCalledWith(owner.id, { defaultOrganizationId: workspace.id }, expect.anything());
  });
  test('an explicit reset also clears SSO proof and cannot be overridden by a method marker', async () => {
    const previous = { ...owner, sessionId: 'previous-session', organizationIds: [workspace.id], isSSOLogin: true, workspaceAuthentication: { ...evidence, method: 'openid' } };
    await sessions.generateLoginResultPayload(response, owner, workspace, true, false, previous,
      { update: jest.fn() }, 'invited-workspace', { oauthAuthenticationReset: true, oauthAuthenticationMethod: 'openid', redirectTo: '/invitations/synthetic' });
    expect(signed.workspaceAuthentication).toBeUndefined();
    expect(sessions.mcpOAuthService.captureAuthentication).not.toHaveBeenCalled();
    expect(response.cookie).toHaveBeenCalled();
  });
});
