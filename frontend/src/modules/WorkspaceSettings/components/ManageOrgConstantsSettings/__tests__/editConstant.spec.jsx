import '@/test/setupMsw';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import ManageOrgConstantsSettings from '../ManageOrgConstantsSettings';

const API = 'http://localhost:3000/api';
const ENVIRONMENTS = [{ id: 'env-prod', name: 'production', is_default: true, enabled: true, priority: 3 }];
const ROW = {
  kind: 'constant',
  id: 'a',
  name: 'ALPHA',
  type: 'Global',
  source: 'workspace',
  value: 'v1',
  last_modified_at: '2026-11-04T10:00:00.000Z',
  owner: { id: 'u1', name: 'Asha Rao' },
  modified_by: { id: 'u1', name: 'Asha Rao' },
};
const DETAIL = {
  id: 'a',
  name: 'ALPHA',
  type: 'Global',
  values: [{ environment_id: 'env-prod', environment_name: 'production', has_value: true, value: 'v1' }],
};

// Serves the environments and a one-row list, and records every request the page makes.
function mockApi(detail = () => HttpResponse.json(DETAIL)) {
  const calls = { list: 0, detail: 0, patch: [] };
  server.use(
    http.get(`${API}/app-environments`, () => HttpResponse.json({ environments: ENVIRONMENTS })),
    http.get(`${API}/v2/organization-constants`, () => {
      calls.list += 1;
      return HttpResponse.json({
        items: [ROW],
        page: 1,
        page_size: 50,
        total: 1,
        counts: { secrets: 0, globals: 1 },
      });
    }),
    http.get(`${API}/v2/organization-constants/a`, () => {
      calls.detail += 1;
      return detail();
    }),
    http.patch(`${API}/v2/organization-constants/a`, async ({ request }) => {
      calls.patch.push(await request.json());
      return HttpResponse.json(DETAIL);
    })
  );
  return calls;
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <ManageOrgConstantsSettings />
    </MemoryRouter>
  );

beforeEach(() => localStorage.clear());

describe('editing a constant from the list', () => {
  it('loads the constant and opens the edit modal with its name and values', async () => {
    const calls = mockApi();
    renderPage();
    await screen.findByText('ALPHA');

    await userEvent.click(screen.getByRole('button', { name: 'Edit ALPHA' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit constant' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('ALPHA');
    expect(screen.getByRole('textbox', { name: 'Production value' })).toHaveValue('v1');
    expect(calls.detail).toBe(1);
  });

  it('saves with a PATCH and reloads the list', async () => {
    const calls = mockApi();
    renderPage();
    await screen.findByText('ALPHA');
    await userEvent.click(screen.getByRole('button', { name: 'Edit ALPHA' }));
    await userEvent.type(await screen.findByRole('textbox', { name: 'Production value' }), '2');
    const listCallsBeforeSave = calls.list;

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(calls.patch).toEqual([{ values: [{ environment_id: 'env-prod', value: 'v12' }] }]));
    await waitFor(() => expect(calls.list).toBeGreaterThan(listCallsBeforeSave));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows an error toast, and no modal, when the constant cannot be loaded', async () => {
    const errorToast = jest.spyOn(toast, 'error').mockImplementation(() => {});
    mockApi(() => HttpResponse.json({ message: 'boom' }, { status: 500 }));
    renderPage();
    await screen.findByText('ALPHA');

    await userEvent.click(screen.getByRole('button', { name: 'Edit ALPHA' }));

    await waitFor(() => expect(errorToast).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit ALPHA' })).toBeEnabled();
    errorToast.mockRestore();
  });
});
