import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { authenticationService } from '@/_services';
import ConnectedAIClientsCard from '../ConnectedAIClientsCard';

jest.mock('@/_helpers', () => ({
  authHeader: (_ignored, workspace) => ({ 'tj-workspace-id': workspace }),
}));
jest.mock('@/_services', () => ({
  authenticationService: {
    currentSessionValue: { current_organization_id: 'garden-id' },
  },
}));

const connection = {
  id: 'garden-grant',
  client_name: 'Synthetic desktop client',
  scopes: ['apps'],
};
const response = (data, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => data,
});
const originalFetch = global.fetch;
beforeEach(() => {
  authenticationService.currentSessionValue = {
    current_organization_id: 'garden-id',
  };
  global.fetch = jest.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
});

test('hides connections when OAuth is disabled', async () => {
  global.fetch.mockResolvedValue(response({}, 404));
  const { container } = render(<ConnectedAIClientsCard />);
  await act(async () => {});
  expect(container).toBeEmptyDOMElement();
});

test('disconnects the selected connection in its workspace and removes it only after server success', async () => {
  let completeRevoke;
  global.fetch.mockResolvedValueOnce(response([connection])).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        completeRevoke = resolve;
      })
  );
  render(<ConnectedAIClientsCard />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Disconnect Synthetic desktop client',
    })
  );
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByText(connection.client_name)).toBeInTheDocument();
  expect(global.fetch.mock.calls[1]).toEqual([
    expect.stringContaining(`/connections/${connection.id}/revoke`),
    expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: { 'tj-workspace-id': 'garden-id', 'x-tooljet-oauth': '1' },
    }),
  ]);
  await act(async () => {
    completeRevoke(response({}));
  });
  expect(await screen.findByText('No connected AI clients.')).toBeInTheDocument();
});

test('keeps the connection visible and permits retry when revocation fails', async () => {
  global.fetch.mockResolvedValueOnce(response([connection])).mockResolvedValueOnce(response({}, 500));
  render(<ConnectedAIClientsCard />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Disconnect Synthetic desktop client',
    })
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to disconnect');
  expect(screen.getByRole('button')).toBeEnabled();
  expect(screen.getByText(connection.client_name)).toBeInTheDocument();
});

test('a late revocation failure from a previous workspace cannot overwrite the new workspace', async () => {
  let completeRevoke;
  global.fetch
    .mockResolvedValueOnce(response([connection]))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeRevoke = resolve;
        })
    )
    .mockResolvedValueOnce(response([]));
  const { rerender } = render(<ConnectedAIClientsCard />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Disconnect Synthetic desktop client',
    })
  );
  authenticationService.currentSessionValue = {
    current_organization_id: 'orchard-id',
  };
  rerender(<ConnectedAIClientsCard />);
  await screen.findByText('No connected AI clients.');
  await act(async () => {
    completeRevoke(response({}, 500));
  });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(global.fetch.mock.calls[2][1].headers['tj-workspace-id']).toBe('orchard-id');
});
