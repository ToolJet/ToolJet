import { authenticationService } from '@/_services/authentication.service';
import { authHeader, getCookie } from '@/_helpers';

jest.mock('@/_helpers', () => ({
  getCookie: jest.fn((name) => `stale-${name}`),
  setCookie: jest.fn(),
  eraseCookie: jest.fn(),
  authHeader: jest.fn((multipart, id) => ({ 'Content-Type': 'application/json', 'tj-workspace-id': id })),
  handleResponse: jest.fn(),
  handleResponseWithoutValidation: async (response) => response.json(),
}));
jest.mock('@/_helpers/routes', () => ({ getRedirectTo: jest.fn() }));
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ json: async () => ({}) });
});
afterEach(() => {
  global.fetch = originalFetch;
});

test('verified MCP login context replaces all stale login, signup, invite, and redirect cookies', async () => {
  const context = { organizationId: 'orchard-workspace', redirectTo: `/mcp/consent?request=${'W'.repeat(43)}` };
  await authenticationService.signInViaOAuth(undefined, 'git', { token: 'synthetic-code' }, context);
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toContain('/oauth/sign-in/common/git');
  expect(JSON.parse(options.body)).toEqual({ token: 'synthetic-code', ...context });
  expect(authHeader).toHaveBeenCalledWith(false, context.organizationId);
  expect(options.credentials).toBe('include');
  expect(getCookie).not.toHaveBeenCalled();
});

test('ordinary SSO requests retain their invitation and signup context', async () => {
  await authenticationService.signInViaOAuth('orchard-provider', 'google', { token: 'synthetic-id-token' });
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
    organizationId: 'stale-login-workspace',
    signupOrganizationId: 'stale-signup-workspace-id',
    invitationToken: 'stale-invite-flow-identifier',
    redirectTo: 'stale-redirectPath',
  });
});
