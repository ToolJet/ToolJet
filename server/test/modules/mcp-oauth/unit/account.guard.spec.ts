/**
 * @group working
 * @group security
 */
import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionAuthGuard } from '@modules/session/guards/session-auth-guard';
import { McpOAuthAccountGuard } from '@modules/mcp-oauth/account.guard';

describe('OAuth account discovery guard', () => {
  const jwt = new JwtService({ secret: 'synthetic-test-signing-key' });
  const guard = new McpOAuthAccountGuard(jwt);
  const request = (payload = {}, extras = {}) => ({
    cookies: { tj_auth_token: jwt.sign({ username: 'synthetic-user', isPasswordLogin: true, ...payload }) },
    headers: {},
    user: { id: 'synthetic-user' },
    ...extras,
  });
  const context = (req) => ({ switchToHttp: () => ({ getRequest: () => req }) }) as any;
  afterEach(() => jest.restoreAllMocks());
  test('requires the existing live-session verification before trusting a browser account', async () => {
    const verify = jest.spyOn(SessionAuthGuard.prototype, 'canActivate').mockResolvedValue(true);
    await expect(guard.canActivate(context(request()))).resolves.toBe(true);
    expect(verify).toHaveBeenCalledTimes(1);
    const signed = request({ workspaceAuthentication: { method: 'form' } });
    await guard.canActivate(context(signed));
    expect(signed.user).toMatchObject({ isPasswordLogin: true, workspaceAuthentication: { method: 'form' } });
    verify.mockResolvedValue(false);
    await expect(guard.canActivate(context(request()))).rejects.toBeInstanceOf(UnauthorizedException);
  });
  test.each([
    { username: 'different-account' },
    { isPATLogin: true },
    { oauthGrantId: 'synthetic-grant' },
    { aud: 'tooljet:mcp:viewer' },
    { isPasswordLogin: false },
  ])('does not turn restricted or anonymous credentials into account discovery: %j', async (payload) => {
    jest.spyOn(SessionAuthGuard.prototype, 'canActivate').mockResolvedValue(true);
    await expect(guard.canActivate(context(request(payload)))).rejects.toBeInstanceOf(UnauthorizedException);
  });
  test.each([
    { cookies: {} },
    { headers: { tj_auth_token: 'synthetic-pat' } },
    { headers: { 'x-tooljet-delegation': 'synthetic-delegation' } },
  ])('requires the browser cookie and refuses identity overrides: %j', async (extras) => {
    const verify = jest.spyOn(SessionAuthGuard.prototype, 'canActivate');
    await expect(guard.canActivate(context(request({}, extras)))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });
});
