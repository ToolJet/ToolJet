import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsentPage from '../ConsentPage';

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
const result = (data, status = 200) => Promise.resolve({ ok: status < 400, status, json: async () => data });
const originalFetch = global.fetch;
beforeEach(() => {
  window.history.replaceState({}, '', `/mcp/consent?request=${requestId}`);
  sessionStorage.clear();
  global.fetch = jest.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
});
test('shows the workspace, callback, approved scopes and signed-in user before consent', async () => {
  global.fetch
    .mockImplementationOnce(() => result(flow))
    .mockImplementationOnce(() => result({ email: 'builder@synthetic.example' }));
  render(<ConsentPage />);
  expect(await screen.findByText('builder@synthetic.example')).toBeInTheDocument();
  expect(screen.getByText('Garden operations')).toBeInTheDocument();
  expect(screen.getByText(flow.redirectUri)).toBeInTheDocument();
  expect(screen.getByText('Create, manage, and run workflows')).toBeInTheDocument();
  expect(screen.getByText('Manage workspace users and custom groups')).toBeInTheDocument();
  expect(screen.getByText(/including changes and deletions/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Allow access' })).toBeEnabled();
  expect(global.fetch.mock.calls[1][1].headers['tj-workspace-id']).toBe('garden-id');
});
test('sends a browser-bound cancellation and displays server failure without leaking details', async () => {
  global.fetch
    .mockImplementationOnce(() => result(flow))
    .mockImplementationOnce(() => result({ email: 'builder@synthetic.example' }))
    .mockImplementationOnce(() => result({}, 400));
  render(<ConsentPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
  await screen.findByRole('alert');
  const options = global.fetch.mock.calls[2][1];
  expect(JSON.parse(options.body)).toEqual({ allow: false });
  expect(options.headers['x-tooljet-oauth-csrf']).toBe('synthetic-csrf');
});
test('offers the correct workspace login after an unsuccessful login attempt', async () => {
  sessionStorage.setItem(`tj_mcp_login_${requestId}`, '1');
  global.fetch.mockImplementationOnce(() => result(flow)).mockImplementationOnce(() => result({}, 401));
  render(<ConsentPage />);
  const link = await screen.findByRole('link', {
    name: 'Sign in to this workspace',
  });
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(link).toHaveAttribute('href', flow.loginUrl);
  expect(screen.queryByRole('button', { name: 'Allow access' })).not.toBeInTheDocument();
});
test('an expired connection cannot be approved', async () => {
  global.fetch.mockImplementationOnce(() => result({}, 400));
  render(<ConsentPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('expired');
  expect(screen.queryByRole('button', { name: 'Allow access' })).not.toBeInTheDocument();
});
test('a disabled OAuth endpoint shows an unavailable message without sign-in or approval controls', async () => {
  global.fetch.mockImplementationOnce(() => result({}, 404));
  render(<ConsentPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('unavailable');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
test('does not present approval when the authenticated user lacks workspace access', async () => {
  global.fetch.mockImplementationOnce(() => result(flow)).mockImplementationOnce(() => result({}, 403));
  render(<ConsentPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('do not have access');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
test('invalid interaction IDs never request or approve a connection', async () => {
  window.history.replaceState({}, '', '/mcp/consent?request=invalid');
  render(<ConsentPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('invalid');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('approval preserves the server-bound workspace and CSRF token and requires login if the session expired', async () => {
  global.fetch
    .mockImplementationOnce(() => result(flow))
    .mockImplementationOnce(() => result({ email: 'builder@synthetic.example' }))
    .mockImplementationOnce(() => result({}, 401));
  render(<ConsentPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Allow access' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('sign-in has expired');
  expect(global.fetch.mock.calls[2]).toEqual([
    expect.stringContaining(`/interactions/${requestId}`),
    expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ allow: true }),
      headers: expect.objectContaining({
        'tj-workspace-id': 'garden-id',
        'x-tooljet-oauth-csrf': 'synthetic-csrf',
      }),
    }),
  ]);
  expect(screen.queryByRole('button', { name: 'Allow access' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in to this workspace' })).toHaveAttribute('href', flow.loginUrl);
});
test.each([
  ['Allow access', true],
  ['Cancel', false],
])('%s follows the callback returned by the server', async (buttonName, allow) => {
  // A same-document callback exercises browser navigation in jsdom. The server
  // owns callback validation and code/state values, never the consent page.
  const redirectUrl = `${window.location.href}#synthetic-callback`;
  global.fetch
    .mockImplementationOnce(() => result(flow))
    .mockImplementationOnce(() => result({ email: 'builder@synthetic.example' }))
    .mockImplementationOnce(() => result({ redirectUrl }));
  render(<ConsentPage />);
  fireEvent.click(await screen.findByRole('button', { name: buttonName }));
  await waitFor(() => expect(window.location.hash).toBe('#synthetic-callback'));
  expect(JSON.parse(global.fetch.mock.calls[2][1].body)).toEqual({ allow });
});
