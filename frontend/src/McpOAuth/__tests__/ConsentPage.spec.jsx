import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import '@/test/setupMsw';
import { server } from '@/test/msw/server';
import ConsentPage from '../ConsentPage';
import config from 'config';

const requestId = 'A'.repeat(43);
const flow = {
  clientName: 'Synthetic desktop client',
  organizationName: 'Garden operations',
  organizationId: 'garden-id',
  scopes: ['apps', 'data', 'workflows', 'workspace_users'],
  redirectUri: 'http://127.0.0.1:54321/callback',
  csrfToken: 'synthetic-csrf',
  loginUrl: 'https://tooljet.synthetic.example/login/garden?redirectTo=consent',
};
const consentTitle = `Connect ${flow.clientName} to ToolJet`;
const originalApiUrl = config.apiUrl;
const interactionUrl = () =>
  new URL(`${config.apiUrl}/mcp-oauth/interactions/${requestId}`, window.location.origin).href;
let requests;
const preview = (data = flow, status = 200) =>
  server.use(
    http.get(interactionUrl(), ({ request }) => {
      requests.preview.push(request);
      return HttpResponse.json(data, { status });
    })
  );
const session = (status = 200) =>
  server.use(
    http.get(`${interactionUrl()}/session`, ({ request }) => {
      requests.session.push(request);
      return HttpResponse.json({ email: 'builder@synthetic.example' }, { status });
    })
  );
const decision = (data = {}, status = 200) =>
  server.use(
    http.post(interactionUrl(), async ({ request }) => {
      requests.decision.push({ request, body: await request.json() });
      return HttpResponse.json(data, { status });
    })
  );
const expectHiddenConsent = () => {
  expect(screen.queryByRole('heading', { name: consentTitle })).not.toBeInTheDocument();
  expect(screen.queryByText(flow.clientName)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Allow access' })).not.toBeInTheDocument();
};
beforeEach(() => {
  window.history.replaceState({}, '', `/mcp/consent?request=${requestId}`);
  sessionStorage.clear();
  localStorage.removeItem('darkMode');
  requests = { preview: [], session: [], decision: [] };
  preview();
  session();
});
afterEach(() => {
  config.apiUrl = originalApiUrl;
  localStorage.removeItem('darkMode');
  jest.restoreAllMocks();
});

test('keeps consent hidden until the workspace session has been verified', async () => {
  let resolveSession;
  const pending = new Promise((resolve) => {
    resolveSession = resolve;
  });
  server.use(
    http.get(`${interactionUrl()}/session`, async ({ request }) => {
      requests.session.push(request);
      await pending;
      return HttpResponse.json({ email: 'builder@synthetic.example' });
    })
  );
  render(<ConsentPage />);
  await waitFor(() => expect(requests.session).toHaveLength(1));
  expect(screen.getByRole('status')).toHaveTextContent('Connecting to ToolJet');
  expectHiddenConsent();
  await act(async () => {
    resolveSession();
  });
  expect(await screen.findByRole('heading', { name: consentTitle })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Allow access' })).toBeEnabled();
});
test('redirects a signed-out browser without displaying consent', async () => {
  preview({ ...flow, loginUrl: `${window.location.href}#workspace-login` });
  session(401);
  render(<ConsentPage />);
  await waitFor(() => expect(window.location.hash).toBe('#workspace-login'));
  expect(sessionStorage.getItem(`tj_mcp_login_${requestId}`)).toBe('1');
  expect(screen.getByRole('status')).toHaveTextContent('Connecting to ToolJet');
  expectHiddenConsent();
});
test('offers manual sign-in when browser storage is unavailable', async () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage unavailable');
  });
  session(401);
  render(<ConsentPage />);
  expect(await screen.findByRole('link', { name: 'Sign in to this workspace' })).toHaveAttribute('href', flow.loginUrl);
  expectHiddenConsent();
});
test('scrubs and exchanges custom-domain bootstrap before loading consent', async () => {
  window.history.replaceState({}, '', `/mcp/consent?request=${requestId}#bootstrap=${'B'.repeat(43)}`);
  let bootstrap;
  server.use(
    http.post(`${interactionUrl()}/bootstrap`, async ({ request }) => {
      bootstrap = await request.json();
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(interactionUrl(), ({ request }) => {
      expect(bootstrap).toBeDefined();
      requests.preview.push(request);
      return HttpResponse.json(flow);
    })
  );
  render(<ConsentPage />);
  expect(await screen.findByText('builder@synthetic.example')).toBeInTheDocument();
  expect(window.location.hash).toBe('');
  expect(bootstrap.ticket).toBe('B'.repeat(43));
  expect(bootstrap.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(requests.preview[0].headers.get('x-tooljet-oauth-origin')).toBe(window.location.origin);
});
test('reads the runtime API URL after custom-domain configuration changes', async () => {
  config.apiUrl = '/installation/api';
  preview();
  session();
  render(<ConsentPage />);
  expect(await screen.findByText('builder@synthetic.example')).toBeInTheDocument();
  expect(new URL(requests.preview[0].url).pathname).toBe(`/installation/api/mcp-oauth/interactions/${requestId}`);
});
test('shows requested permissions and the verified workspace', async () => {
  render(<ConsentPage />);
  expect(await screen.findByText('builder@synthetic.example')).toBeInTheDocument();
  expect(screen.getByText('Garden operations')).toBeInTheDocument();
  expect(screen.getByText(flow.redirectUri)).toBeInTheDocument();
  expect(screen.queryByText('Callback address')).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Access requested in Garden operations' })).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(flow.scopes.length);
  expect(screen.getByText('Create, manage, and run workflows.')).toBeInTheDocument();
  expect(screen.getByText('Manage workspace users and custom groups.')).toBeInTheDocument();
  expect(screen.getByText(/changes and deletions only within your existing workspace permissions/)).toBeInTheDocument();
  expect(requests.session[0].headers.get('tj-workspace-id')).toBe('garden-id');
  expect(screen.getByRole('link', { name: 'Profile settings' })).toHaveAttribute('href', '/garden-id/profile-settings');
});
test('shows only the permissions requested by the client', async () => {
  preview({ ...flow, scopes: ['apps'] });
  render(<ConsentPage />);
  await screen.findByRole('button', { name: 'Allow access' });
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Apps' })).toBeInTheDocument();
  for (const name of ['Data sources & database', 'Workflows', 'Users & access control']) {
    expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument();
  }
});
test.each([
  ['  orchard assistant  ', 'O'],
  ['Aster ChatGPT integration', 'A'],
  ['🪴 garden helper', '🪴'],
])('uses the first character for unknown client %s', async (clientName, initial) => {
  preview({ ...flow, clientName });
  const { container } = render(<ConsentPage />);
  await screen.findByRole('button', { name: 'Allow access' });
  const badge = container.querySelector('.mcp-oauth-client-logo');
  expect(badge).toHaveTextContent(initial);
  expect(badge.querySelector('svg')).toBeNull();
});
test.each(['Cancel', 'Allow access'])('disables both actions while %s is being submitted', async (buttonName) => {
  let resolveDecision;
  const pending = new Promise((resolve) => {
    resolveDecision = resolve;
  });
  server.use(
    http.post(interactionUrl(), async ({ request }) => {
      requests.decision.push({ request, body: await request.json() });
      await pending;
      return HttpResponse.json({}, { status: 400 });
    })
  );
  render(<ConsentPage />);
  fireEvent.click(await screen.findByRole('button', { name: buttonName }));
  await waitFor(() => expect(requests.decision).toHaveLength(1));
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
  await act(async () => {
    resolveDecision();
  });
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to complete');
  expect(screen.getByRole('button', { name: 'Allow access' })).toBeEnabled();
});
test('sends browser-bound cancellation and displays a safe failure', async () => {
  decision({ error_description: 'synthetic-private-diagnostic' }, 400);
  render(<ConsentPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to complete');
  expect(screen.queryByText('synthetic-private-diagnostic')).not.toBeInTheDocument();
  expect(requests.decision[0].body).toEqual({ allow: false });
  expect(requests.decision[0].request.headers.get('x-tooljet-oauth-csrf')).toBe('synthetic-csrf');
});
test('offers the correct workspace login after an unsuccessful login attempt', async () => {
  sessionStorage.setItem(`tj_mcp_login_${requestId}`, '1');
  session(401);
  render(<ConsentPage />);
  expect(await screen.findByRole('link', { name: 'Sign in to this workspace' })).toHaveAttribute('href', flow.loginUrl);
  expectHiddenConsent();
});
test.each([
  [400, 'expired'],
  [404, 'unavailable'],
])('blocks approval for preview failure %s', async (status, message) => {
  preview({}, status);
  render(<ConsentPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expectHiddenConsent();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(requests.session).toHaveLength(0);
});
test('does not offer approval when the user lacks workspace access', async () => {
  session(403);
  render(<ConsentPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('do not have access');
  expectHiddenConsent();
});
test('invalid interaction IDs never request or approve a connection', async () => {
  window.history.replaceState({}, '', '/mcp/consent?request=invalid');
  render(<ConsentPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('invalid');
  expect(requests.preview).toHaveLength(0);
  expect(requests.session).toHaveLength(0);
});
test('approval preserves workspace and CSRF binding, and requires login after session expiry', async () => {
  decision({}, 401);
  render(<ConsentPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Allow access' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('sign-in has expired');
  const { request, body } = requests.decision[0];
  expect(body).toEqual({ allow: true });
  expect(request.credentials).toBe('include');
  expect(request.headers.get('tj-workspace-id')).toBe('garden-id');
  expect(request.headers.get('x-tooljet-oauth-csrf')).toBe('synthetic-csrf');
  expectHiddenConsent();
  expect(screen.getByRole('link', { name: 'Sign in to this workspace' })).toHaveAttribute('href', flow.loginUrl);
});
test.each([
  ['Allow access', true],
  ['Cancel', false],
])('%s follows the server callback', async (buttonName, allow) => {
  decision({ redirectUrl: `${window.location.href}#synthetic-callback` });
  render(<ConsentPage />);
  fireEvent.click(await screen.findByRole('button', { name: buttonName }));
  await waitFor(() => expect(window.location.hash).toBe('#synthetic-callback'));
  expect(requests.decision[0].body).toEqual({ allow });
});
test.each(['true', 'false'])('applies saved darkMode=%s before and after session verification', async (preference) => {
  localStorage.setItem('darkMode', preference);
  render(<ConsentPage />);
  const assertTheme = () =>
    expect(screen.getByRole('main').classList.contains('dark-theme')).toBe(preference === 'true');
  assertTheme();
  await screen.findByRole('heading', { name: consentTitle });
  assertTheme();
});
test('unavailable theme storage does not prevent consent', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Storage unavailable');
  });
  render(<ConsentPage />);
  expect(await screen.findByRole('button', { name: 'Allow access' })).toBeEnabled();
});

test.each([
  'https://untrusted.synthetic.example/receive?client=desktop',
  'cursor://anysphere.cursor-mcp/oauth/callback',
  'http://[::1]:45678/callback',
])('shows the exact callback %s even when a client supplies a familiar name', async (redirectUri) => {
  preview({ ...flow, clientName: '  cLaUdE   Code  ', redirectUri });
  const { container } = render(<ConsentPage />);
  expect(await screen.findByText('builder@synthetic.example')).toBeInTheDocument();
  expect(container.querySelector('.mcp-oauth-client-logo svg')).toBeInTheDocument();
  expect(container.querySelector('.mcp-oauth-client-monogram')).toBeNull();
  const callback = screen.getByText(redirectUri);
  expect(callback.tagName).toBe('CODE');
  expect(screen.getByText(/ToolJet has not verified the client name/)).toBeInTheDocument();
});
