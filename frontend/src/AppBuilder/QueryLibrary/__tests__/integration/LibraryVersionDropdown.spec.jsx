import '@/test/setupMsw';
import React from 'react';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { render } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { authenticationService } from '@/_services';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import LibraryVersionDropdown from '../../LibraryVersionDropdown';

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
