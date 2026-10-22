import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Authorize } from '../../Oauth/Authorize';
import { aiOnboardingService, authenticationService } from '@/_services';
import { getCookie } from '@/_helpers';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { Navigate } from 'react-router-dom';
import config from 'config';
import { http, HttpResponse } from 'msw';
import '@/test/setupMsw';
import { server } from '@/test/msw/server';

let mockQuery;
jest.mock('@/_hooks/use-router', () => ({ __esModule: true, default: () => ({ query: mockQuery }) }));
jest.mock('@/_services', () => ({
  aiOnboardingService: { signInViaOAuth: jest.fn() },
  appService: {},
  authenticationService: {
    getLoginOrganizationId: jest.fn(),
    getLoginOrganizationSlug: jest.fn(),
    getSignupOrganizationSlug: jest.fn(),
    getInviteFlowIndetifier: jest.fn(),
    signInViaOAuth: jest.fn(),
    deleteAllSSOCookies: jest.fn(),
  },
}));
jest.mock('@/_helpers', () => ({ getCookie: jest.fn(), eraseCookie: jest.fn() }));
jest.mock('@/_helpers/utils', () => ({ stripTrailingSlash: (value) => value.replace(/\/$/, '') }));
jest.mock('@/_services/authentication.service', () => ({ authenticationService: {} }));
jest.mock('@/_helpers/platform/utils/auth.utils', () => ({
  onLoginSuccess: jest.fn(),
  onInvitedUserSignUpSuccess: jest.fn(),
}));
jest.mock('@/_helpers/authorizeWorkspace', () => ({ updateCurrentSession: jest.fn() }));
jest.mock('@/modules/common/helpers/utils', () => ({ fetchEdition: () => 'cloud' }));
jest.mock('@/_ui/TJLoader/TJLoader', () => ({ TJLoader: () => null }));
jest.mock('react-router-dom', () => ({ Navigate: jest.fn(() => null) }));

const requestId = 'P'.repeat(43);
const consentPath = `/mcp/consent?request=${requestId}`;
let interactionRequests;
const interactionUrl = `http://localhost/tools/api/mcp-oauth/interactions/${requestId}`;
const originalApiUrl = config.apiUrl;
beforeEach(() => {
  jest.clearAllMocks();
  config.apiUrl = '/tools/api';
  window.public_config = {};
  getCookie.mockReturnValue('/stale-dashboard');
  authenticationService.getLoginOrganizationId.mockReturnValue('stale-workspace');
  authenticationService.getSignupOrganizationSlug.mockReturnValue('stale-signup');
  authenticationService.getInviteFlowIndetifier.mockReturnValue('stale-invite');
  authenticationService.signInViaOAuth.mockResolvedValue({ current_organization_id: 'orchard-workspace' });
  interactionRequests = [];
  server.use(http.get(interactionUrl, ({ request }) => {
    interactionRequests.push(request);
    return HttpResponse.json({ organizationId: 'orchard-workspace' });
  }));
});
afterEach(() => {
  config.apiUrl = originalApiUrl;
});

test.each(['google', 'git'])(
  '%s recovers the server-bound workspace despite stale canonical cookies',
  async (provider) => {
    const state = encodeURIComponent(
      JSON.stringify({ redirectTo: consentPath, organizationId: 'untrusted-workspace' })
    );
    mockQuery = { origin: provider, ...(provider === 'git' ? { state, code: 'synthetic-code' } : {}) };
    const fragment = provider === 'google' ? `#${new URLSearchParams({ state, id_token: 'synthetic-id-token' })}` : '';
    window.history.replaceState({}, '', `/tools/sso/${provider}${fragment}`);
    const navigate = jest.fn();
    render(<Authorize navigate={navigate} />);
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(expect.anything(), navigate, consentPath));
    expect(interactionRequests).toHaveLength(1);
    expect(interactionRequests[0].credentials).toBe('include');
    expect(interactionRequests[0].headers.get('x-tooljet-oauth-origin')).toBe(window.location.origin);
    expect(authenticationService.signInViaOAuth).toHaveBeenCalledWith(undefined, provider, expect.anything(), {
      organizationId: 'orchard-workspace',
      redirectTo: consentPath,
    });
    expect(aiOnboardingService.signInViaOAuth).not.toHaveBeenCalled();
  }
);

test('an expired or wrong-browser interaction never reaches SSO sign-in or onboarding', async () => {
  mockQuery = {
    origin: 'git',
    code: 'synthetic-code',
    state: encodeURIComponent(JSON.stringify({ redirectTo: consentPath })),
  };
  window.history.replaceState({}, '', '/tools/sso/git');
  server.use(http.get(interactionUrl, () => HttpResponse.json({}, { status: 400 })));
  render(<Authorize navigate={jest.fn()} />);
  await waitFor(() => expect(Navigate).toHaveBeenCalled());
  expect(authenticationService.signInViaOAuth).not.toHaveBeenCalled();
  expect(aiOnboardingService.signInViaOAuth).not.toHaveBeenCalled();
});

test.each(['openid', 'saml'])('%s uses its same-origin consent return cookie', async (provider) => {
  mockQuery = {
    origin: provider,
    configId: 'orchard-provider',
    code: 'synthetic-code',
    state: 'synthetic-provider-state',
  };
  window.history.replaceState({}, '', `/tools/sso/${provider}/orchard-provider`);
  getCookie.mockReturnValue(consentPath);
  render(<Authorize navigate={jest.fn()} />);
  await waitFor(() =>
    expect(authenticationService.signInViaOAuth).toHaveBeenCalledWith('orchard-provider', provider, expect.anything(), {
      organizationId: 'orchard-workspace',
      redirectTo: consentPath,
    })
  );
  expect(aiOnboardingService.signInViaOAuth).not.toHaveBeenCalled();
});

test('ordinary cloud onboarding retains its existing route without an interaction lookup', async () => {
  mockQuery = { origin: 'git', code: 'synthetic-code', state: 'tj_api_source=ai_onboarding' };
  window.history.replaceState({}, '', '/tools/sso/git');
  authenticationService.getLoginOrganizationId.mockReturnValue(null);
  authenticationService.getSignupOrganizationSlug.mockReturnValue(null);
  authenticationService.getInviteFlowIndetifier.mockReturnValue(null);
  aiOnboardingService.signInViaOAuth.mockResolvedValue({});
  render(<Authorize navigate={jest.fn()} />);
  await waitFor(() => expect(aiOnboardingService.signInViaOAuth).toHaveBeenCalled());
  expect(interactionRequests).toHaveLength(0);
  expect(authenticationService.signInViaOAuth).not.toHaveBeenCalled();
});
