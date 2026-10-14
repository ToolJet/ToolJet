import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getRedirectTo, getRedirectURL, isMcpOAuthConsentPath } from '@/_helpers/routes';
import { AuthRoute } from '../../Routes/AuthRoute';

const mockNavigate = jest.fn();
const mockSetLoading = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
jest.mock('@/_helpers/utils', () => ({
  getWorkspaceId: () => 'garden',
  stripTrailingSlash: (value) => value.replace(/\/$/, ''),
}));
jest.mock('@/_helpers', () => ({
  getCookie: jest.fn(),
  eraseCookie: jest.fn(),
}));
jest.mock('@/modules/common/helpers/utils', () => ({
  fetchEdition: () => 'ce',
}));
jest.mock('@/_helpers/white-label/whiteLabelling', () => ({
  setFaviconAndTitle: jest.fn(),
}));
jest.mock('@/_services/authentication.service', () => ({
  authenticationService: {},
}));
jest.mock('@/_services/custom-domain.service', () => ({
  customDomainService: {},
}));
jest.mock('@/_services', () => ({
  authenticationService: { deleteAllAuthCookies: jest.fn() },
  loginConfigsService: {
    getOrganizationConfigs: async () => ({
      id: 'garden-id',
      form: { enabled: true },
    }),
  },
  sessionService: {},
}));
jest.mock('@/_hooks/useSessionManagement', () => ({
  useSessionManagement: () => ({
    session: {
      id: 'synthetic-user',
      current_organization_id: 'garden-id',
      current_organization_name: 'Garden operations',
      authentication_status: true,
    },
    isLoading: false,
    isValidSession: true,
    setLoading: mockSetLoading,
  }),
}));
jest.mock('../../Routes/RouteLoader', () => ({
  RouteLoader: ({ children }) => children,
}));

const consentPath = `/mcp/consent?request=${'Q'.repeat(43)}`;
const LoginContent = () => <div>Sign in</div>;
beforeEach(() => {
  window.public_config = {};
  mockNavigate.mockClear();
});
test('password/SSO login return paths preserve the consent request without a workspace prefix', () => {
  expect(getRedirectURL(consentPath, true)).toBe(consentPath);
  window.history.replaceState({}, '', `/login/garden?redirectTo=${encodeURIComponent(consentPath)}`);
  expect(getRedirectURL()).toBe(consentPath);
  // Router basename adds the installation subpath; the return path remains relative to it.
  window.public_config.SUB_PATH = '/tools/';
  expect(getRedirectURL(consentPath, true)).toBe(consentPath);
  expect(getRedirectURL('/apps/greenhouse', true)).toBe('/garden/apps/greenhouse');
});
test('fresh-login control parameters do not leak into the password or SSO return path', () => {
  const params = new URLSearchParams({
    oauth_reauthenticate: '1',
    redirectTo: consentPath,
  });
  expect(getRedirectTo(params)).toBe(consentPath);
  window.history.replaceState({}, '', `/login/garden?${params}`);
  expect(getRedirectURL()).toBe(consentPath);
});
test.each([
  'https://attacker.example/mcp/consent',
  '//attacker.example/mcp/consent',
  '/mcp/consent?request=short',
  `${consentPath}&redirect=https://attacker.example`,
])('does not allow an unrelated return URL: %s', (path) => {
  expect(isMcpOAuthConsentPath(path)).toBe(false);
});
test.each([
  [consentPath, consentPath],
  ['https://attacker.example', '/garden'],
])('an already signed-in workspace returns only to a valid OAuth request', async (returnTo, expected) => {
  render(
    <MemoryRouter
      initialEntries={[`/login/garden?redirectTo=${encodeURIComponent(returnTo)}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/login/:organizationId"
          element={
            <AuthRoute>
              <LoginContent />
            </AuthRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(expected));
});
test.each([
  [consentPath, true],
  ['https://attacker.example', false],
  [`${consentPath}&extra=1`, false],
])(
  'fresh workspace login bypasses the existing session only for a strict OAuth return: %s',
  async (returnTo, freshLogin) => {
    render(
      <MemoryRouter
        initialEntries={[`/login/garden?redirectTo=${encodeURIComponent(returnTo)}&oauth_reauthenticate=1`]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/login/:organizationId"
            element={
              <AuthRoute>
                <LoginContent />
              </AuthRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(mockSetLoading).toHaveBeenCalledWith(false));
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    if (freshLogin) expect(mockNavigate).not.toHaveBeenCalled();
    else expect(mockNavigate).toHaveBeenCalledWith('/garden');
  }
);
