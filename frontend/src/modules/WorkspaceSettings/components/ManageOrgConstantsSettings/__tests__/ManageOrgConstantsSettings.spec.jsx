import '@/test/setupMsw';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import ManageOrgConstantsSettings from '../ManageOrgConstantsSettings';
import { useConstantsListStore } from '../store/constantsListStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useSearchStore } from '@/_stores/searchStore';
import { fetchEdition } from '@/modules/common/helpers/utils';

jest.mock('@/modules/common/helpers/utils', () => ({
  ...jest.requireActual('@/modules/common/helpers/utils'),
  fetchEdition: jest.fn(),
}));

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

const LocationProbe = () => <output data-testid="url-search">{useLocation().search}</output>;

const renderPage = (route = '/?tab=Global') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ManageOrgConstantsSettings />
      <LocationProbe />
    </MemoryRouter>
  );

beforeEach(() => {
  fetchEdition.mockReturnValue('ee');
  useLicenseStore.setState({ featureAccess: {} });
  sessionStorage.clear();
  useConstantsListStore.setState({
    query: { page: 1, searchKey: '' },
    root: { items: [], meta: null, status: 'idle' },
    rowSelection: {},
  });
  act(() => useSearchStore.getState().clearSearch());
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

  it('opens on Secrets when the URL names no tab', async () => {
    const requests = mockApi(() => HttpResponse.json(page([item('api_key', 'Secret')])));
    renderPage('/');
    await screen.findByText('API_KEY');
    expect(requests[0]).toMatchObject({ environment_id: 'env-prod', type: 'Secret' });
    expect(screen.getByRole('tab', { name: /Secrets/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('lists the default environment’s Global constants when the URL asks for them', async () => {
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

describe('ManageOrgConstantsSettings without per-environment values', () => {
  beforeEach(() => fetchEdition.mockReturnValue('ce'));

  it('lets the create modal add one value only', async () => {
    mockApi(() => HttpResponse.json(page([item('api_url')])));
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Create constant' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^Development/ }));

    expect(within(dialog).getByRole('textbox', { name: 'Development value' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Add environment/ })).toBeDisabled();
  });

  const mockStoredInEveryEnvironment = () => {
    const patches = [];
    mockApi(() => HttpResponse.json(page([item('api_url')])));
    server.use(
      http.get(`${API}/v2/organization-constants/api_url`, () =>
        HttpResponse.json({
          id: 'api_url',
          name: 'API_URL',
          type: 'Global',
          values: ENVIRONMENTS.map((env) => ({
            environment_id: env.id,
            environment_name: env.name,
            has_value: true,
            value: 'same',
          })),
        })
      ),
      http.patch(`${API}/v2/organization-constants/api_url`, async ({ request }) => {
        patches.push(await request.json());
        return HttpResponse.json({ id: 'api_url', name: 'API_URL', type: 'Global', values: [] });
      })
    );
    return patches;
  };
  const valueBoxes = (dialog) => within(dialog).queryAllByRole('textbox', { name: /value$/ });

  it('shows one value box when editing a constant stored in every environment', async () => {
    mockStoredInEveryEnvironment();
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Edit API_URL' }));
    const dialog = await screen.findByRole('dialog');

    expect(valueBoxes(dialog)).toHaveLength(1);
    expect(valueBoxes(dialog)[0]).toHaveValue('same');
  });

  it('saves an edit as exactly one value', async () => {
    const patches = mockStoredInEveryEnvironment();
    renderPage();
    await screen.findByText('API_URL');
    await userEvent.click(screen.getByRole('button', { name: 'Edit API_URL' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.type(valueBoxes(dialog)[0], '!');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(patches).toHaveLength(1));
    expect(patches[0].values).toHaveLength(1);
    expect(patches[0].values[0]).toMatchObject({ value: 'same!' });
  });
});

describe('ManageOrgConstantsSettings with per-environment values', () => {
  it('shows one value box per environment when editing', async () => {
    mockApi(() => HttpResponse.json(page([item('api_url')])));
    server.use(
      http.get(`${API}/v2/organization-constants/api_url`, () =>
        HttpResponse.json({
          id: 'api_url',
          name: 'API_URL',
          type: 'Global',
          values: ENVIRONMENTS.map((env) => ({
            environment_id: env.id,
            environment_name: env.name,
            has_value: true,
            value: `value-${env.name}`,
          })),
        })
      )
    );
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Edit API_URL' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('textbox', { name: 'Development value' })).toHaveValue('value-development');
    expect(within(dialog).getByRole('textbox', { name: 'Production value' })).toHaveValue('value-production');
  });
});

describe('ManageOrgConstantsSettings header controls', () => {
  const respond = () => mockApi(() => HttpResponse.json(page([item('api_url')])));

  it('loads the chosen environment', async () => {
    const requests = respond();
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Environment' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Development' }));

    await waitFor(() => expect(requests.at(-1)).toMatchObject({ environment_id: 'env-dev' }));
    expect(screen.getByRole('button', { name: 'Environment' })).toHaveTextContent('Development');
  });

  it('lists the most recently modified first until another sort is chosen', async () => {
    const requests = respond();
    renderPage();
    await screen.findByText('API_URL');
    expect(requests[0]).toMatchObject({ sort: 'modified_desc' });
    expect(requests.every((request) => request.sort === 'modified_desc')).toBe(true);
  });

  it('loads the chosen sort', async () => {
    const requests = respond();
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Z → A' }));

    await waitFor(() => expect(requests.at(-1)).toMatchObject({ sort: 'name_desc' }));
  });

  it('loads only the sources that stay checked', async () => {
    const requests = respond();
    renderPage();
    await screen.findByText('API_URL');

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: '.env variables' }));

    await waitFor(() => expect(requests.at(-1)).toMatchObject({ source: 'workspace' }));
  });

  it.each([
    ['in the community edition', () => fetchEdition.mockReturnValue('ce')],
    [
      'when the license has no multi-environment',
      () => useLicenseStore.setState({ featureAccess: { multiEnvironment: false } }),
    ],
  ])('hides the environment select and ignores ?env= %s', async (_, restrict) => {
    restrict();
    const requests = respond();
    renderPage('/?env=env-dev');
    await screen.findByText('API_URL');

    expect(screen.queryByRole('button', { name: 'Environment' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(requests.every((request) => request.environment_id === 'env-prod')).toBe(true);
  });

  it('removes an ?env= the workspace does not have from the URL', async () => {
    const requests = respond();
    renderPage('/?tab=Global&env=not-a-uuid');
    await screen.findByText('API_URL');

    await waitFor(() => expect(screen.getByTestId('url-search')).toHaveTextContent(/^\?tab=Global$/));
    expect(requests.every((request) => request.environment_id === 'env-prod')).toBe(true);
  });

  it('keeps an ?env= the workspace has', async () => {
    respond();
    renderPage('/?tab=Global&env=env-dev');
    await screen.findByText('API_URL');

    expect(screen.getByTestId('url-search')).toHaveTextContent('env=env-dev');
  });
});

describe('ManageOrgConstantsSettings header search', () => {
  // Three pages in total, so a remembered page 2 is a real page.
  const respond = () => mockApi(() => HttpResponse.json({ ...page([item('api_url')]), total: 120 }));
  // The header owns the input and debounces it; the page only sees the debounced value.
  const typeInHeader = (value) =>
    act(() => useSearchStore.setState({ searchQuery: value, debouncedSearchQuery: value }));

  it('sends the typed term as the search and goes back to page 1', async () => {
    useConstantsListStore.setState({ query: { page: 2, searchKey: '' } });
    const requests = respond();
    renderPage();
    await screen.findByText('API_URL');
    expect(requests[0]).toMatchObject({ page: '2' });

    typeInHeader('api');

    await waitFor(() => expect(requests.at(-1)).toMatchObject({ search: 'api', page: '1' }));
  });

  it('clamps a term longer than the API accepts, so the request still succeeds', async () => {
    const requests = respond();
    renderPage();
    await screen.findByText('API_URL');

    typeInHeader('x'.repeat(51));

    await waitFor(() => expect(requests.at(-1)).toMatchObject({ search: 'x'.repeat(50) }));
    expect(screen.queryByText("Couldn't load constants")).not.toBeInTheDocument();
  });

  it('does not refetch or reset the page when the header term already matches', async () => {
    useConstantsListStore.setState({ query: { page: 2, searchKey: '' } });
    const requests = respond();
    renderPage();
    await screen.findByText('API_URL');

    typeInHeader('');

    expect(useConstantsListStore.getState().query.page).toBe(2);
    expect(requests).toHaveLength(1);
  });

  it('keeps the page number when the user leaves and comes back', async () => {
    useConstantsListStore.setState({ query: { page: 2, searchKey: '' } });
    const requests = respond();
    const { unmount } = renderPage();
    await screen.findByText('API_URL');
    unmount();

    renderPage();
    await waitFor(() => expect(requests.at(-1)).toMatchObject({ page: '2' }));
    expect(useConstantsListStore.getState().query.page).toBe(2);
  });

  it('clears the search in the header and the list when the page unmounts', async () => {
    respond();
    const { unmount } = renderPage();
    await screen.findByText('API_URL');
    typeInHeader('api');
    await waitFor(() => expect(useConstantsListStore.getState().query.searchKey).toBe('api'));

    unmount();

    expect(useConstantsListStore.getState().query.searchKey).toBe('');
    expect(useSearchStore.getState().searchQuery).toBe('');
    expect(useSearchStore.getState().debouncedSearchQuery).toBe('');
  });

  it('asks the header for a constants placeholder, and restores the default on unmount', async () => {
    respond();
    const { unmount } = renderPage();
    await screen.findByText('API_URL');
    expect(useSearchStore.getState().searchConfig.placeholder).toBe('Search constants');

    unmount();
    expect(useSearchStore.getState().searchConfig.placeholder).toBe('Search');
  });

  it('shows the no-results state when the search matches nothing', async () => {
    mockApi(({ search }) => HttpResponse.json(page(search ? [] : [item('api_url')])));
    renderPage();
    await screen.findByText('API_URL');

    typeInHeader('zzz');

    expect(await screen.findByText('No constants found')).toBeInTheDocument();
  });
});

describe('ManageOrgConstantsSettings pagination', () => {
  // 120 rows in total: three pages of 50. The response echoes the requested page.
  const respond = () =>
    mockApi(({ page: requested }) =>
      HttpResponse.json({ ...page([item(`row_${requested}`)]), page: Number(requested), total: 120 })
    );

  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  it('shows the pages and loads the one that is clicked', async () => {
    const requests = respond();
    renderPage();
    await screen.findByText('ROW_1');
    expect(screen.getByText('Showing 1-1 of 120 items')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Go to next page' }));

    expect(await screen.findByText('ROW_2')).toBeInTheDocument();
    expect(requests.at(-1)).toMatchObject({ page: '2' });
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('clears the selection when the page changes', async () => {
    respond();
    renderPage();
    await screen.findByText('ROW_1');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select ROW_1' }));
    expect(useConstantsListStore.getState().rowSelection).toEqual({ row_1: true });

    await userEvent.click(screen.getByRole('link', { name: '3' }));

    await screen.findByText('ROW_3');
    expect(useConstantsListStore.getState().rowSelection).toEqual({});
  });

  it('scrolls back to the top of the new page', async () => {
    respond();
    renderPage();
    await screen.findByText('ROW_1');
    const list = screen.getByTestId('constants-list-scroll');
    list.scrollTop = 200;

    await userEvent.click(screen.getByRole('link', { name: '2' }));

    expect(list.scrollTop).toBe(0);
  });

  it('offers no pages when everything fits on one', async () => {
    mockApi(() => HttpResponse.json(page([item('api_url')])));
    renderPage();
    await screen.findByText('API_URL');
    expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument();
  });

  it('stays on the same page while a modal opens and closes, without another request', async () => {
    useConstantsListStore.setState({ query: { page: 2, searchKey: '' } });
    const requests = respond();
    renderPage();
    await screen.findByText('ROW_2');
    const requestCount = requests.length;

    await userEvent.click(screen.getByRole('button', { name: 'Create constant' }));
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(useConstantsListStore.getState().query.page).toBe(2);
    expect(requests).toHaveLength(requestCount);
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('lands on the last page when the remembered page no longer exists', async () => {
    useConstantsListStore.setState({ query: { page: 9, searchKey: '' } });
    const requests = respond();
    renderPage();

    expect(await screen.findByText('ROW_3')).toBeInTheDocument();
    expect(useConstantsListStore.getState().query.page).toBe(3);
    expect(requests.map((request) => request.page)).toContain('9');
  });
});
