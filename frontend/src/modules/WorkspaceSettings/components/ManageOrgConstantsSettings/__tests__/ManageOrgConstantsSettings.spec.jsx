import '@/test/setupMsw';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import ManageOrgConstantsSettings from '../ManageOrgConstantsSettings';
import { useConstantsListStore } from '../store/constantsListStore';

const API = 'http://localhost:3000/api';
const ENVIRONMENTS = [
  { id: 'env-dev', name: 'development', is_default: false, enabled: true, priority: 1 },
  { id: 'env-prod', name: 'production', is_default: true, enabled: true, priority: 3 },
];

const item = (id, type = 'Global') => ({
  kind: 'constant',
  id,
  name: id.toUpperCase(),
  type,
  source: 'workspace',
  value: type === 'Global' ? `value-of-${id}` : null,
  last_modified_at: '2026-11-04T10:00:00.000Z',
  owner: { id: 'u1', name: 'Asha Rao' },
  modified_by: { id: 'u1', name: 'Asha Rao' },
});
const page = (items, counts = { secrets: 0, globals: items.length }) => ({
  items,
  page: 1,
  page_size: 50,
  total: items.length,
  counts,
});

// Serves environments, and hands each list request to `onList` so a test can control timing and the response.
function mockApi(onList) {
  const requests = [];
  server.use(
    http.get(`${API}/app-environments`, () => HttpResponse.json({ environments: ENVIRONMENTS })),
    http.get(`${API}/v2/organization-constants`, ({ request }) => {
      const params = Object.fromEntries(new URL(request.url).searchParams);
      requests.push(params);
      return onList(params, requests.length);
    })
  );
  return requests;
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <ManageOrgConstantsSettings />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  useConstantsListStore.setState({
    query: { page: 1, searchKey: '' },
    root: { items: [], meta: null, status: 'idle' },
    rowSelection: {},
  });
});

describe('ManageOrgConstantsSettings', () => {
  it('shows skeleton rows, then the constants once the list loads', async () => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    const requests = mockApi(async () => {
      await gate;
      return HttpResponse.json(page([item('api_url'), item('base_url')]));
    });

    renderPage();
    expect(screen.getAllByTestId('constants-skeleton-row')).toHaveLength(8);

    await waitFor(() => expect(requests).toHaveLength(1));
    release();

    expect(await screen.findByText('API_URL')).toBeInTheDocument();
    expect(screen.getByText('BASE_URL')).toBeInTheDocument();
    expect(screen.queryAllByTestId('constants-skeleton-row')).toHaveLength(0);
    expect(screen.getByText('Showing 1-2 of 2 items')).toBeInTheDocument();
  });

  it('lists the default environment’s Global constants first', async () => {
    const requests = mockApi(() => HttpResponse.json(page([item('api_url')])));
    renderPage();
    await screen.findByText('API_URL');
    expect(requests[0]).toMatchObject({ environment_id: 'env-prod', type: 'Global' });
  });

  it('shows the Global empty state with the tab counts when nothing exists', async () => {
    mockApi(() => HttpResponse.json(page([], { secrets: 0, globals: 0 })));
    renderPage();
    expect(await screen.findByText('No global constants yet')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Secrets \(0\)/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Globals \(0\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader')).not.toBeInTheDocument();
  });

  it('switches to Secrets: loads that type and shows the Secrets empty state', async () => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    const requests = mockApi(async ({ type }) => {
      if (type === 'Secret') await gate;
      return HttpResponse.json(page(type === 'Secret' ? [] : [item('api_url')], { secrets: 0, globals: 1 }));
    });

    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('tab', { name: /Secrets/ }));
    expect(screen.getAllByTestId('constants-skeleton-row')).toHaveLength(8);
    expect(screen.queryByText('API_URL')).not.toBeInTheDocument();
    await waitFor(() => expect(requests.at(-1)).toMatchObject({ type: 'Secret', environment_id: 'env-prod' }));

    release();
    expect(await screen.findByText('No secrets yet')).toBeInTheDocument();
  });

  it('shows an error with a retry that loads the list again', async () => {
    const requests = mockApi((_, n) =>
      n === 1 ? HttpResponse.json({ message: 'boom' }, { status: 500 }) : HttpResponse.json(page([item('api_url')]))
    );

    renderPage();
    expect(await screen.findByText("Couldn't load constants")).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('API_URL')).toBeInTheDocument();
    expect(requests).toHaveLength(2);
  });

  it('opens the create modal from the header', async () => {
    mockApi(() => HttpResponse.json(page([item('api_url')])));
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Create constant' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('shows environment names capitalised in the create modal, whatever case the API uses', async () => {
    mockApi(() => HttpResponse.json(page([item('api_url')])));
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Create constant' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /^Development/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /^Production/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /^development/ })).not.toBeInTheDocument();
  });
});
