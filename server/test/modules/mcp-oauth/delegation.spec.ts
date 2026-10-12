import 'reflect-metadata';
jest.mock('@modules/mcp-oauth/service', () => ({ McpOAuthService: class {} }));
jest.mock('@modules/users/repositories/repository', () => ({ UserRepository: class {} }));
jest.mock('@modules/session/util.service', () => ({ SessionUtilService: class {} }));
jest.mock('@modules/session/repository', () => ({ UserSessionRepository: class {} }));
jest.mock('@modules/logging/service', () => ({ TransactionLogger: class {} }));
jest.mock('@otel/tracing', () => ({ trackUserActivity: jest.fn(), extractAppIdFromPath: jest.fn() }));
import { JwtStrategy } from '@modules/session/jwt/jwt.strategy';
import { McpDelegationGuard } from '@modules/mcp-oauth/delegation.guard';

const user = { id: 'synthetic-user', organizationId: 'garden', oauthGrantId: 'synthetic-grant' };
const payload: any = { oauthGrantId: user.oauthGrantId, aud: 'tooljet:mcp:delegation' };
const headers = { 'x-tooljet-delegation': 'synthetic-credential', 'tj-workspace-id': 'garden' };
const context = (request) =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => request }),
  }) as any;
describe('OAuth delegation boundary', () => {
  test('the global guard authenticates and retains the identity before route guards', async () => {
    const oauth = { authenticateDelegation: jest.fn().mockResolvedValue(user) };
    const request: any = { headers };
    expect(await new McpDelegationGuard(oauth as any).canActivate(context(request))).toBe(true);
    expect(oauth.authenticateDelegation).toHaveBeenCalledWith('synthetic-credential', 'garden');
    expect(request.user).toBe(user);
    expect(request.oauthDelegatedUser).toBe(user);
  });
  test('malformed headers and invalid delegation cannot fall through to anonymous routes', async () => {
    const oauth = { authenticateDelegation: jest.fn().mockRejectedValue(new Error('invalid')) };
    const guard = new McpDelegationGuard(oauth as any);
    await expect(guard.canActivate(context({ headers }))).rejects.toThrow();
    for (const invalid of [
      { 'x-tooljet-delegation': ['one', 'two'], 'tj-workspace-id': 'garden' },
      { 'x-tooljet-delegation': 'synthetic-credential' },
    ])
      await expect(guard.canActivate(context({ headers: invalid }))).rejects.toThrow();
  });
  test('only the distinct viewer cookie authenticates a browser render credential', async () => {
    const viewerUser = { ...user, oauthAppId: 'synthetic-app' };
    const oauth = { authenticateViewer: jest.fn().mockResolvedValue(viewerUser), authenticateDelegation: jest.fn() };
    const request: any = { headers: {}, cookies: { tj_oauth_viewer: 'synthetic-viewer' } };
    await new McpDelegationGuard(oauth as any).canActivate(context(request));
    expect(oauth.authenticateViewer).toHaveBeenCalledWith('synthetic-viewer', undefined);
    expect(request.oauthDelegatedUser).toBe(viewerUser);
    expect(oauth.authenticateDelegation).not.toHaveBeenCalled();
  });
  test('normal browser and PAT requests do not invoke OAuth validation', async () => {
    const oauth = { authenticateDelegation: jest.fn() };
    const request = { headers: { cookie: 'synthetic-browser-cookie' } };
    expect(await new McpDelegationGuard(oauth as any).canActivate(context(request))).toBe(true);
    expect(oauth.authenticateDelegation).not.toHaveBeenCalled();
  });
  test('a delegation is not accepted as a browser-cookie or PAT credential', async () => {
    const strategy: any = Object.create(JwtStrategy.prototype);
    strategy.mcpOAuthService = { validateDelegation: jest.fn() };
    for (const carrier of [
      { tj_auth_token: 'synthetic-credential', 'tj-workspace-id': 'garden' },
      { cookie: 'tj_auth_token=synthetic-credential', 'tj-workspace-id': 'garden' },
      { 'x-tooljet-delegation': 'synthetic-credential' },
    ])
      expect(await strategy.validate({ headers: carrier }, payload)).toBe(false);
    expect(strategy.mcpOAuthService.validateDelegation).not.toHaveBeenCalled();
  });
  test('the JWT strategy reuses the globally validated principal only for its workspace', async () => {
    const strategy: any = Object.create(JwtStrategy.prototype);
    strategy.mcpOAuthService = { validateDelegation: jest.fn() };
    expect(await strategy.validate({ headers, oauthDelegatedUser: user }, payload)).toBe(user);
    expect(
      await strategy.validate(
        {
          headers: { ...headers, 'tj-workspace-id': 'another-workspace' },
          oauthDelegatedUser: user,
        },
        payload,
      ),
    ).toBe(false);
    expect(strategy.mcpOAuthService.validateDelegation).not.toHaveBeenCalled();
  });
});
