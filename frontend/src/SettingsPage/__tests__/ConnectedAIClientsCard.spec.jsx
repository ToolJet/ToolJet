import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import '@/test/setupMsw';
import { server } from '@/test/msw/server';
import { authenticationService } from '@/_services';
import config from 'config';
import ConnectedAIClientsCard from '../ConnectedAIClientsCard';

jest.mock('@/_helpers', () => ({ authHeader: (_ignored, workspace) => ({ 'tj-workspace-id': workspace }) }));
jest.mock('@/_services', () => ({
  authenticationService: { currentSessionValue: { current_organization_id: 'garden-id' } },
}));
const connection = { id: 'garden-grant', client_name: 'Synthetic desktop client', scopes: ['apps'] };
const connectionsUrl = `${config.apiUrl}/mcp-oauth/connections`;
const revokeUrl = `${connectionsUrl}/${connection.id}/revoke`;
let listedWorkspaces;
beforeEach(() => {
  authenticationService.currentSessionValue = { current_organization_id: 'garden-id' };
  listedWorkspaces = [];
  server.use(
    http.get(connectionsUrl, ({ request }) => {
      const workspace = request.headers.get('tj-workspace-id');
      listedWorkspaces.push(workspace);
      return HttpResponse.json(workspace === 'garden-id' ? [connection] : []);
    })
  );
});

test('hides connections when OAuth is disabled', async () => {
  let loaded = false;
  server.use(
    http.get(connectionsUrl, () => {
      loaded = true;
      return HttpResponse.json({}, { status: 404 });
    })
  );
  const { container } = render(<ConnectedAIClientsCard />);
  await waitFor(() => expect(loaded).toBe(true));
  expect(container).toBeEmptyDOMElement();
});
test('disconnects in the selected workspace and removes the connection only after success', async () => {
  let completeRevoke;
  let revokeRequest;
  const pending = new Promise((resolve) => {
    completeRevoke = resolve;
  });
  server.use(
    http.post(revokeUrl, async ({ request }) => {
      revokeRequest = request;
      await pending;
      return new HttpResponse(null, { status: 204 });
    })
  );
  render(<ConnectedAIClientsCard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Disconnect Synthetic desktop client' }));
  await waitFor(() => expect(revokeRequest).toBeDefined());
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByText(connection.client_name)).toBeInTheDocument();
  expect(revokeRequest.credentials).toBe('include');
  expect(revokeRequest.headers.get('tj-workspace-id')).toBe('garden-id');
  expect(revokeRequest.headers.get('x-tooljet-oauth')).toBe('1');
  await act(async () => {
    completeRevoke();
  });
  expect(await screen.findByText('No connected AI clients.')).toBeInTheDocument();
});
test('keeps the connection visible and permits retry after revocation fails', async () => {
  server.use(http.post(revokeUrl, () => HttpResponse.json({}, { status: 500 })));
  render(<ConnectedAIClientsCard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Disconnect Synthetic desktop client' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to disconnect');
  expect(screen.getByRole('button')).toBeEnabled();
  expect(screen.getByText(connection.client_name)).toBeInTheDocument();
});
test('a late revocation failure from a previous workspace cannot overwrite the new workspace', async () => {
  let completeRevoke;
  let receivedRevoke = false;
  const pending = new Promise((resolve) => {
    completeRevoke = resolve;
  });
  server.use(
    http.post(revokeUrl, async () => {
      receivedRevoke = true;
      await pending;
      return HttpResponse.json({}, { status: 500 });
    })
  );
  const { rerender } = render(<ConnectedAIClientsCard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Disconnect Synthetic desktop client' }));
  await waitFor(() => expect(receivedRevoke).toBe(true));
  authenticationService.currentSessionValue = { current_organization_id: 'orchard-id' };
  rerender(<ConnectedAIClientsCard />);
  await screen.findByText('No connected AI clients.');
  await act(async () => {
    completeRevoke();
  });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(listedWorkspaces).toContain('orchard-id');
});
