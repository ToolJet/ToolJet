import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import '@/test/setupMsw';
import { server } from '@/test/msw/server';
import BaseLoginPage from '@/modules/auth/pages/LoginPage/components/BaseLoginPage/BaseLoginPage';
import config from 'config';
import { getCookie } from '@/_helpers/cookie';

jest.mock('@/_services', () => ({
  authenticationService: {
    saveLoginOrganizationId: jest.fn(),
    saveLoginOrganizationSlug: jest.fn(),
  },
}));
jest.mock('@/_helpers/platform/utils/auth.utils', () => ({
  onLoginSuccess: jest.fn(),
}));
jest.mock('@/_helpers/authorizeWorkspace', () => ({
  updateCurrentSession: jest.fn(),
}));
jest.mock('@white-label/whiteLabelling', () => ({
  retrieveWhiteLabelText: () => 'ToolJet',
}));
jest.mock('@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel', () => ({
  FeatureGraphicRightPanel: () => <div>Existing artwork</div>,
}));
jest.mock('@/modules/onboarding/components/OnboardingBackgroundWrapper', () => ({
  __esModule: true,
  default: ({ LeftSideComponent, RightSideComponent }) => (
    <>
      <LeftSideComponent />
      <RightSideComponent />
    </>
  ),
}));
jest.mock('@/modules/onboarding/components', () => ({
  OnboardingUIWrapper: ({ children }) => <div>{children}</div>,
  OnboardingFormInsideWrapper: ({ children }) => <div>{children}</div>,
}));
jest.mock('@/modules/auth/pages/LoginPage/components', () => ({
  LoginForm: jest.requireActual('@/modules/auth/pages/LoginPage/components/LoginForm/LoginForm').default,
  MfaVerifyForm: () => null,
}));
jest.mock('@/modules/common/components', () => ({
  FormTextInput: jest.requireActual('@/modules/common/components/FormTextInput/FormTextInput').default,
  FormHeader: jest.requireActual('@/modules/common/components/FormHeader/FormHeader').default,
  PasswordInput: () => <input aria-label="Password" type="password" />,
  SubmitButton: ({ buttonText, disabled }) => <button disabled={disabled}>{buttonText}</button>,
  SSOAuthModule: () => <button>Sign in with Google</button>,
}));
const requestId = 'W'.repeat(43);
const returnTo = `/mcp/consent?request=${requestId}`;
const entry = `/login?oauth_reauthenticate=1&redirectTo=${encodeURIComponent(returnTo)}`;
const endpoint = () => new URL(`${config.apiUrl}/mcp-oauth/interactions/${requestId}`, window.location.origin).href;
let previewRequests, navigate;
const Harness = (props) => {
  navigate = useNavigate();
  return <BaseLoginPage configs={{ form: { enabled: true }, google: { enabled: true } }} {...props} />;
};
const mount = (route = entry, props = {}) => {
  window.history.replaceState({}, '', route);
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Harness {...props} />
    </MemoryRouter>
  );
};
const noEntry = () => {
  expect(screen.queryByRole('button', { name: /Select a workspace to sign in/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Workspace URL/ })).not.toBeInTheDocument();
};
beforeEach(() => {
  window.public_config = { MCP_OAUTH_ENABLED: 'true' };
  previewRequests = 0;
  sessionStorage.clear();
  document.cookie = `redirectPath=${encodeURIComponent(returnTo)}; path=/`;
  server.use(
    http.get(endpoint(), () => {
      previewRequests++;
      return HttpResponse.json({
        organizationId: null,
        csrfToken: 'synthetic-entry-csrf',
      });
    })
  );
});
test.each([
  '/login',
  '/login/river',
  '/signup',
  '/login?redirectTo=%2Fhome',
  '/login?redirectTo=%2Fmcp%2Fconsent%3Frequest%3Dbad',
  '/login?oauth_reauthenticate=1',
])('normal route %s has no MCP controls despite stale cookies and storage', async (route) => {
  sessionStorage.setItem(`tj_mcp_login_${requestId}`, '1');
  mount(route);
  await act(async () => {});
  noEntry();
  expect(previewRequests).toBe(0);
  expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
test.each([
  ['disabled', {}, 200, null],
  ['expired', { MCP_OAUTH_ENABLED: 'true' }, 400, null],
  ['bound', { MCP_OAUTH_ENABLED: 'true' }, 200, 'river-id'],
])('%s interaction does not add workspace entry', async (_, publicConfig, status, organizationId) => {
  window.public_config = publicConfig;
  server.use(http.get(endpoint(), () => HttpResponse.json({ organizationId }, { status })));
  mount();
  await act(async () => {});
  noEntry();
});
test('a verified shared connection replaces the form and Back restores existing login controls', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /Select a workspace to sign in/ }));
  expect(screen.getByRole('textbox', { name: /Workspace URL/ })).toHaveAttribute(
    'placeholder',
    'acme.tooljet.com/workspace-name'
  );
  expect(screen.queryByRole('textbox', { name: /Email/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Sign in with Google' })).not.toBeInTheDocument();
  expect(screen.getByText('Existing artwork')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
  expect(screen.getByRole('textbox', { name: /Email/ })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
test('leaving MCP login removes both entry and form, including same-component navigation', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /Select a workspace to sign in/ }));
  act(() => navigate('/login'));
  noEntry();
  expect(getCookie('redirectPath')).toBe('/home');
  act(() => navigate(entry));
  await screen.findByRole('button', { name: /Select a workspace to sign in/ });
  expect(screen.queryByRole('textbox', { name: /Workspace URL/ })).not.toBeInTheDocument();
});
test('a delayed preview cannot expose MCP controls after ordinary login navigation', async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  server.use(
    http.get(endpoint(), async () => {
      previewRequests++;
      await pending;
      return HttpResponse.json({ organizationId: null });
    })
  );
  mount();
  await waitFor(() => expect(previewRequests).toBe(1));
  act(() => navigate('/login'));
  await act(async () => resolve());
  noEntry();
});
test('empty and missing workspace errors stay inline and requests preserve the URL and browser binding', async () => {
  let submitted;
  server.use(
    http.post(`${endpoint()}/workspace`, async ({ request }) => {
      submitted = {
        body: await request.json(),
        csrf: request.headers.get('x-tooljet-oauth-csrf'),
        credentials: request.credentials,
      };
      return HttpResponse.json({}, { status: 400 });
    })
  );
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /Select a workspace to sign in/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter your workspace URL');
  const value = 'https://tooljet.synthetic.example/login/river';
  fireEvent.change(screen.getByRole('textbox', { name: /Workspace URL/ }), {
    target: { value },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('workspace or connection link is unavailable');
  expect(submitted).toEqual({
    body: { workspace: value },
    csrf: 'synthetic-entry-csrf',
    credentials: 'include',
  });
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
});

test('waits for a slow context lookup before making credential fields interactive', async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  server.use(
    http.get(endpoint(), async () => {
      previewRequests++;
      await pending;
      return HttpResponse.json({ organizationId: null, csrfToken: 'synthetic-csrf' });
    })
  );
  mount();
  await waitFor(() => expect(previewRequests).toBe(1));
  expect(screen.queryByRole('textbox', { name: /Email/ })).not.toBeInTheDocument();
  await act(async () => resolve());
  const email = await screen.findByRole('textbox', { name: /Email/ });
  fireEvent.change(email, { target: { value: 'operator@synthetic.example' } });
  await screen.findByRole('button', { name: /Select a workspace to sign in/ });
  expect(screen.getByRole('textbox', { name: /Email/ })).toHaveValue('operator@synthetic.example');
});

test('a trailing-slash shared login retains the verified workspace-entry path', async () => {
  mount(entry.replace('/login?', '/login/?'));
  fireEvent.click(await screen.findByRole('button', { name: /Select a workspace to sign in/ }));
  expect(screen.getByRole('textbox', { name: /Workspace URL/ })).toBeVisible();
});
