import '@/test/setupMsw';
import React from 'react';
import { screen, waitFor, fireEvent, act, renderHook } from '@testing-library/react';
import { render } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { authenticationService } from '@/_services';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import LibraryVersionDropdown from '../../LibraryVersionDropdown';
import useLibraryVersionLifecycle from '../../useLibraryVersionLifecycle';

const controls = createAppBuilderControls();
const dev = { id: 'env-dev', name: 'development', priority: 1 };
const staging = { id: 'env-stg', name: 'staging', priority: 2 };
const prod = { id: 'env-prod', name: 'production', priority: 3 };
const draft = {
  id: 'draft-one',
  name: 'candidate.one',
  description: 'Change notes',
  dataSourceId: 'source1',
  kind: 'postgresql',
  options: {},
  createdFromVersionId: 'saved-one',
  createdFrom: 'stable/one',
};
const saved = { ...draft, id: 'saved-one', name: 'stable/one', environment: dev, isReleased: false };
const base = `${config.apiUrl}/query-library/queries/q1`;
const cy = (value) => document.querySelector(`[data-cy="${value}"]`);
let originalSession;
let view;
let writes;
let requests;
beforeEach(() => {
  originalSession = authenticationService.currentSessionValue;
  authenticationService.updateCurrentSession({
    ...originalSession,
    admin: false,
    super_admin: false,
    user_permissions: {},
    data_source_group_permissions: { usable_data_sources_id: ['source1'] },
    app_group_permissions: { environment_access: { development: true, staging: true, production: true } },
  });
  controls.observers.install();
  controls.geometry.textRange();
  writes = [];
  requests = [];
  const originalFetch = global.fetch;
  jest.spyOn(global, 'fetch').mockImplementation((url, options) => {
    requests.push(String(url));
    return originalFetch(url, options);
  });
  view = { drafts: [draft, { ...draft, id: 'draft-two', name: 'candidate.two' }], versions: [saved] };
  useStore.getState().queryLibrary.beginLibrarySession('workspace1');
  useStore.getState().queryLibrary.setLibraryEnvironments([dev, staging, prod]);
  useStore.setState((s) => ({ license: { ...s.license, featureAccess: { multiEnvironment: true } } }));
  server.use(
    http.get(`${base}/versions`, () => HttpResponse.json(view)),
    http.post(`${base}/drafts/:id/save`, async ({ request, params }) => {
      const body = await request.json();
      writes.push({ id: params.id, ...body });
      const row = { ...draft, ...body, environment: dev };
      view = { drafts: view.drafts.filter((v) => v.id !== params.id), versions: [row, saved] };
      return HttpResponse.json(row);
    })
  );
});
afterEach(() => {
  authenticationService.updateCurrentSession(originalSession);
  controls.restore();
  jest.restoreAllMocks();
});
async function open(darkMode = false) {
  render(<LibraryVersionDropdown queryId="q1" darkMode={darkMode} />);
  await waitFor(() => expect(cy('version-switcher-button')).toBeInTheDocument());
  await userEvent.click(cy('version-switcher-button'));
  await waitFor(() => expect(cy('candidate.one-version-name')).toBeInTheDocument());
}

it.each([false, true])(
  'uses the shared save form and preserves custom metadata after save (dark=%s)',
  async (darkMode) => {
    await open(darkMode);
    expect(cy('candidate.two-version-name')).toBeInTheDocument();
    await userEvent.click(screen.getAllByText('Save version')[0]);
    expect(cy('version-name-input-field')).toHaveValue('candidate.one');
    expect(screen.getByText('Name and description cannot be edited after saving')).toBeInTheDocument();
    fireEvent.change(cy('version-name-input-field'), { target: { value: 'release/one+!' } });
    fireEvent.submit(cy('version-name-input-field').closest('form'));
    await waitFor(() =>
      expect(writes).toEqual([{ id: 'draft-one', name: 'release/one+!', description: 'Change notes' }])
    );
    await userEvent.click(cy('version-switcher-button'));
    await waitFor(() => expect(cy('release/one+!-version-name')).toBeInTheDocument());
    expect(requests.every((url) => url.includes('/query-library/'))).toBe(true);
  }
);
it('cancel leaves the draft unsaved', async () => {
  await open();
  await userEvent.click(screen.getAllByText('Save version')[0]);
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(writes).toEqual([]);
});
it('browses environments without changing the editor selection', async () => {
  await open();
  await userEvent.click(screen.getByRole('button', { name: 'Staging' }));
  expect(screen.getByText('No versions available')).toBeInTheDocument();
  expect(useStore.getState().queryLibrary.runEnvironmentByQueryId.q1).toBeUndefined();
});
it('does not offer Edit details on a saved row', async () => {
  await open();
  await userEvent.click(cy('stable/one-version-more-menu-button'));
  expect(screen.queryByText('Edit details')).not.toBeInTheDocument();
});
it('uses source access even when app editing grants exist', async () => {
  authenticationService.updateCurrentSession({
    ...authenticationService.currentSessionValue,
    data_source_group_permissions: {},
    app_group_permissions: { is_all_editable: true, environment_access: { development: true } },
  });
  await open();
  expect(cy('candidate.one-save-version-button')).toBeDisabled();
});

it('waits for a pending draft write before saving the same real ID', async () => {
  await open();
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  useStore.getState().dataQuery.queueLibraryDraftOperation('q1', draft.id, () => pending);
  await userEvent.click(screen.getAllByText('Save version')[0]);
  fireEvent.submit(cy('version-name-input-field').closest('form'));
  expect(cy('version-name-input-field')).toBeDisabled();
  expect(writes).toEqual([]);
  await act(async () => {
    finish();
    await pending;
  });
  await waitFor(() => expect(writes[0]?.id).toBe(draft.id));
});
it('creates another named draft from a saved source while drafts already exist', async () => {
  server.use(
    http.post(`${base}/drafts`, async ({ request }) => {
      const body = await request.json();
      writes.push(body);
      const created = { ...draft, id: 'draft-three', name: body.name, createdFromVersionId: body.fromVersionId };
      view = { ...view, drafts: [...view.drafts, created] };
      return HttpResponse.json(created);
    })
  );
  await open();
  await userEvent.click(screen.getByText('Create draft version'));
  fireEvent.change(cy('version-name-input-field'), { target: { value: 'candidate/three' } });
  fireEvent.submit(cy('version-name-input-field').closest('form'));
  await waitFor(() => expect(writes).toEqual([{ name: 'candidate/three', fromVersionId: saved.id }]));
  await userEvent.click(cy('version-switcher-button'));
  await waitFor(() => expect(cy('candidate/three-version-name')).toBeInTheDocument());
  expect(requests.every((url) => url.includes('/query-library/'))).toBe(true);
});
it('edits the chosen draft metadata through the shared form', async () => {
  server.use(
    http.patch(`${base}/drafts/:id`, async ({ request, params }) => {
      const body = await request.json();
      writes.push({ id: params.id, ...body });
      const updated = { ...draft, ...body };
      view = { ...view, drafts: [updated, view.drafts[1]] };
      return HttpResponse.json(updated);
    })
  );
  await open();
  await userEvent.click(cy('candidate.one-version-more-menu-button'));
  await userEvent.click(screen.getByText('Edit details'));
  fireEvent.change(cy('edit-version-name-input-field'), { target: { value: 'patched+name' } });
  fireEvent.submit(cy('edit-version-name-input-field').closest('form'));
  await waitFor(() => expect(writes).toEqual([{ id: draft.id, name: 'patched+name', description: 'Change notes' }]));
  expect(requests.every((url) => url.includes('/query-library/'))).toBe(true);
});
it('shows resource load errors and retries without turning them into an empty state', async () => {
  server.use(
    http.get(`${base}/versions`, () => HttpResponse.json({ message: 'Library unavailable' }, { status: 500 }))
  );
  render(<LibraryVersionDropdown queryId="q1" />);
  await userEvent.click(cy('version-switcher-button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Library unavailable');
  expect(screen.queryByText('No versions available')).not.toBeInTheDocument();
  await userEvent.click(cy('version-switcher-button'));
  server.use(http.get(`${base}/versions`, () => HttpResponse.json(view)));
  await userEvent.click(cy('version-switcher-button'));
  await waitFor(() => expect(cy('candidate.one-version-name')).toBeInTheDocument());
});
it('does not use app-specific environment access and keeps unlicensed environments locked', async () => {
  authenticationService.updateCurrentSession({
    ...authenticationService.currentSessionValue,
    app_group_permissions: {
      is_all_editable: true,
      environment_access: { development: true, production: true },
      app_specific_environment_access: { unrelated: { staging: true } },
    },
  });
  await open();
  expect(screen.getByRole('button', { name: 'Staging' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Production' })).toBeEnabled();
});

it.each(['promote', 'release'])('calls only the library %s route for the selected saved ID', async (action) => {
  const environment = action === 'release' ? prod : dev;
  view = { drafts: view.drafts, versions: [{ ...saved, environment }] };
  await act(async () => {
    await useStore.getState().queryLibrary.loadLibraryVersions('q1');
    useStore.getState().queryLibrary.viewLibraryVersion('q1', saved.id);
  });
  server.use(
    http.post(`${base}/versions/${saved.id}/${action}`, () => {
      writes.push({ id: saved.id, action });
      const updated = {
        ...saved,
        environment: action === 'promote' ? staging : prod,
        isReleased: action === 'release',
      };
      view = { ...view, versions: [updated] };
      return HttpResponse.json(updated);
    })
  );
  render(<LibraryVersionDropdown queryId="q1" />);
  await userEvent.click(cy('version-switcher-button'));
  await waitFor(() => expect(cy(`${action}-version-button`)).toBeEnabled());
  await userEvent.click(cy(`${action}-version-button`));
  await userEvent.click(cy(action === 'release' ? 'yes-button' : 'promote-button'));
  await waitFor(() => expect(writes).toEqual([{ id: saved.id, action }]));
  expect(requests.every((url) => url.includes('/query-library/'))).toBe(true);
});

it('keeps a newer refresh success when the initial load rejects later', async () => {
  const responses = [];
  server.use(http.get(`${base}/versions`, () => new Promise((resolve) => responses.push(resolve))));
  const { result } = renderHook(() => useLibraryVersionLifecycle({ queryId: 'q1' }));
  await waitFor(() => expect(responses).toHaveLength(1));
  const initialRequest = global.fetch.mock.results[0].value;
  let refreshing;
  act(() => {
    refreshing = result.current.actions.refresh();
  });
  await waitFor(() => expect(responses).toHaveLength(2));
  await act(async () => {
    responses[1](HttpResponse.json(view));
    await refreshing;
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
  await act(async () => {
    responses[0](HttpResponse.json({ message: 'Obsolete failure' }, { status: 500 }));
    await initialRequest;
  });
  expect(result.current.error).toBeNull();
  expect(result.current.loading).toBe(false);
  expect(result.current.versions.map(({ id }) => id)).toEqual(['draft-one', 'draft-two', 'saved-one']);
});

it('keeps loading for the current refresh after an older success, then shows the current failure', async () => {
  const responses = [];
  server.use(http.get(`${base}/versions`, () => new Promise((resolve) => responses.push(resolve))));
  const { result } = renderHook(() => useLibraryVersionLifecycle({ queryId: 'q1' }));
  await waitFor(() => expect(responses).toHaveLength(1));
  const initialRequest = global.fetch.mock.results[0].value;
  let refreshing;
  act(() => {
    refreshing = result.current.actions.refresh();
  });
  await waitFor(() => expect(responses).toHaveLength(2));
  await act(async () => {
    responses[0](HttpResponse.json(view));
    await initialRequest;
  });
  expect(result.current.loading).toBe(true);
  await act(async () => {
    responses[1](HttpResponse.json({ message: 'Current failure' }, { status: 500 }));
    await refreshing;
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBe('Current failure');
});

it.each([
  ['drafts', draft],
  ['versions', saved],
])('shows the shared dependency warning for a pinned %s row without changing selection', async (route, row) => {
  server.use(
    http.delete(`${base}/${route}/${row.id}`, () =>
      HttpResponse.json({ statusCode: 409, code: 'LIBRARY_QUERY_IN_USE', message: 'Used by an app.' }, { status: 409 })
    )
  );
  await open();
  await act(async () => {
    useStore.getState().queryLibrary.viewLibraryVersion('q1', row.id);
  });
  const selection = useStore.getState().queryLibrary.viewedVersionIdByQueryId.q1;
  expect(selection).toBe(row.id);
  await userEvent.click(cy(`${row.name}-version-more-menu-button`));
  await userEvent.click(screen.getByText('Delete version'));
  await userEvent.click(screen.getByRole('button', { name: 'Delete version' }));
  const dialog = await screen.findByRole('dialog', { name: 'Dependent apps or modules found!' });
  expect(dialog).toHaveTextContent('apps or modules');
  await userEvent.click(screen.getByRole('button', { name: 'I understand' }));
  expect(screen.queryByRole('dialog', { name: 'Dependent apps or modules found!' })).not.toBeInTheDocument();
  expect(useStore.getState().queryLibrary.viewedVersionIdByQueryId.q1).toBe(selection);
});

it.each([
  { code: 'VERSION_RELEASED', message: 'Released version cannot be deleted' },
  { message: 'The last version cannot be deleted' },
  { code: 'OTHER_CONFLICT', message: 'Cannot delete this version.' },
])('does not show dependency warnings for other lifecycle errors: $message', async (error) => {
  let attempted = false;
  server.use(
    http.delete(`${base}/drafts/${draft.id}`, () => {
      attempted = true;
      return HttpResponse.json(error, { status: 409 });
    })
  );
  await open();
  await userEvent.click(cy(`${draft.name}-version-more-menu-button`));
  await userEvent.click(screen.getByText('Delete version'));
  await userEvent.click(screen.getByRole('button', { name: 'Delete version' }));
  await waitFor(() => expect(attempted).toBe(true));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete version' })).not.toBeInTheDocument());
  expect(screen.queryByText('I understand')).not.toBeInTheDocument();
});
