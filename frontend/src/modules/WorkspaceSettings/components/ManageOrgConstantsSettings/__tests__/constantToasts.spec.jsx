import '@/test/setupMsw';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import ManageOrgConstantsSettings from '../ManageOrgConstantsSettings';

const API = 'http://localhost:3000/api';
const ENVIRONMENTS = [
  { id: 'env-dev', name: 'development', is_default: false, enabled: true, priority: 1 },
  { id: 'env-prod', name: 'production', is_default: true, enabled: true, priority: 3 },
];

const row = (id) => ({
  kind: 'constant',
  id,
  name: id.toUpperCase(),
  type: 'Global',
  source: 'workspace',
  value: `value-of-${id}`,
  last_modified_at: '2026-11-04T10:00:00.000Z',
  owner: { id: 'u1', name: 'Asha Rao' },
  modified_by: { id: 'u1', name: 'Asha Rao' },
});

// The constant the API returns after a write; `valuedIn` lists the environments that hold a value.
const detail = (id, valuedIn) => ({
  id,
  name: id.toUpperCase(),
  type: 'Global',
  values: ENVIRONMENTS.map(({ id: environmentId, name }) => ({
    environment_id: environmentId,
    environment_name: name,
    has_value: valuedIn.includes(environmentId),
    value: valuedIn.includes(environmentId) ? 'v' : null,
  })),
});

function mockApi({ rows = [row('a')], create, update, bulkDelete } = {}) {
  server.use(
    http.get(`${API}/app-environments`, () => HttpResponse.json({ environments: ENVIRONMENTS })),
    http.get(`${API}/v2/organization-constants`, () =>
      HttpResponse.json({
        items: rows,
        page: 1,
        page_size: 50,
        total: rows.length,
        counts: { secrets: 0, globals: rows.length },
      })
    ),
    http.get(`${API}/v2/organization-constants/a`, () => HttpResponse.json(detail('a', ['env-prod']))),
    http.post(
      `${API}/v2/organization-constants`,
      () => create?.() ?? HttpResponse.json(detail('new', ['env-prod']), { status: 201 })
    ),
    http.patch(`${API}/v2/organization-constants/a`, () => update?.() ?? HttpResponse.json(detail('a', ['env-prod']))),
    http.post(`${API}/v2/organization-constants/bulk-delete`, async ({ request }) => {
      const { ids } = await request.json();
      return bulkDelete?.(ids) ?? HttpResponse.json({ deleted_ids: ids, skipped_ids: [] });
    })
  );
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/?tab=Global']}>
      <ManageOrgConstantsSettings />
    </MemoryRouter>
  );

let successToast;
beforeEach(() => {
  sessionStorage.clear();
  successToast = jest.spyOn(toast, 'success').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

// Fills and submits the create modal with a value in one environment.
async function createWithValueIn(environment) {
  await userEvent.click(screen.getByRole('button', { name: 'Create constant' }));
  const dialog = await screen.findByRole('dialog');
  await userEvent.type(within(dialog).getByLabelText('Name'), 'NEW');
  await userEvent.click(within(dialog).getByRole('button', { name: new RegExp(`^${environment}`) }));
  await userEvent.type(await within(dialog).findByRole('textbox', { name: `${environment} value` }), 'v');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Add constant' }));
}

async function editAndSave() {
  await userEvent.click(screen.getByRole('button', { name: 'Edit A' }));
  await userEvent.type(await screen.findByRole('textbox', { name: 'Production value' }), '2');
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
}

describe('success toasts', () => {
  it('confirms a created constant', async () => {
    mockApi();
    renderPage();
    await screen.findByText('A');

    await createWithValueIn('Production');

    await waitFor(() => expect(successToast).toHaveBeenCalledWith('Global constant created successfully!'));
  });

  it('confirms an updated constant', async () => {
    mockApi();
    renderPage();
    await screen.findByText('A');

    await editAndSave();

    await waitFor(() => expect(successToast).toHaveBeenCalledWith('Constant updated successfully'));
  });

  it('confirms a deleted constant', async () => {
    mockApi();
    renderPage();
    await screen.findByText('A');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete constant' }));

    await waitFor(() => expect(successToast).toHaveBeenCalledWith('Constant deleted successfully'));
  });

  it('counts the constants in a bulk delete', async () => {
    mockApi({ rows: [row('a'), row('b')] });
    renderPage();
    await screen.findByText('A');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select A' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select B' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete constants' }));

    await waitFor(() => expect(successToast).toHaveBeenCalledWith('2 constants deleted successfully'));
  });

  it('shows no success toast when the create fails', async () => {
    mockApi({ create: () => HttpResponse.json({ message: 'boom' }, { status: 500 }) });
    renderPage();
    await screen.findByText('A');

    await createWithValueIn('Production');

    await screen.findByRole('dialog');
    expect(successToast).not.toHaveBeenCalled();
  });
});
