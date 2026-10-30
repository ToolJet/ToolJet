import '@/test/setupMsw';
import { setImmediate } from 'timers';
import React from 'react';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';
import { Routes, Route, Link } from 'react-router-dom';
import { HomePage } from '@/HomePage/HomePage';
import QueryLibraryPage from '../../QueryLibraryPage';

jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
jest.setTimeout(30000);
const controls = createAppBuilderControls();
const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
afterEach(() => {
  controls.restore();
  if (scrollIntoViewDescriptor) Object.defineProperty(Element.prototype, 'scrollIntoView', scrollIntoViewDescriptor);
  else delete Element.prototype.scrollIntoView;
});
const state = () => useStore.getState();
const query = {
  id: 'q1',
  name: 'getCustomers',
  kind: 'restapi',
  options: {
    method: 'get',
    url: '',
    headers: [['', '']],
    cookies: [['', '']],
    url_params: [['', '']],
    body: [['', '']],
    retry_network_errors: false,
  },
  dataSourceId: null,
};
const requests = [];
beforeEach(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: jest.fn() });
  controls.observers.install();
  controls.geometry.textRange();
  requests.length = 0;
  authenticationService.updateCurrentSession({
    current_organization_id: 'workspace-a',
    current_organization_slug: 'workspace-a',
    group_permissions: [],
    load_app: true,
    role: { name: 'builder' },
    current_user: { id: 'user' },
  });
  server.use(
    http.get(`${config.apiUrl}/*`, ({ request }) => {
      const path = new URL(request.url).pathname;
      requests.push({ path, workspace: request.headers.get('tj-workspace-id') });
      if (path.endsWith('/query-library/static-data-sources')) return HttpResponse.json([]);
      if (path.endsWith('/query-library/queries')) return HttpResponse.json([query]);
      if (path.endsWith('/query-library/folders')) return HttpResponse.json([{ id: 'folder', name: 'Shared' }]);
      if (path.endsWith('/app-environments'))
        return HttpResponse.json({ environments: [{ id: 'development', name: 'development', priority: 1 }] });
      if (path.includes('/data-sources/')) return HttpResponse.json({ data_sources: [] });
      if (path.endsWith('/versions'))
        return HttpResponse.json({ draft: { createdFrom: null }, versions: [], nextVersionNumber: 1 });
      if (path.endsWith('/query-library/usage')) return HttpResponse.json({ apps: [], modules: [] });
      if (path.endsWith('/license/feature-access')) return HttpResponse.json({});
      return HttpResponse.json({});
    })
  );
});

it('loads a standalone page without app bootstrap or an app header', async () => {
  const view = render(<QueryLibraryPage darkMode={false} />);
  expect(await screen.findByText('getCustomers')).toBeInTheDocument();
  expect(view.container.querySelector('[data-cy="editor-header-section"]')).toBeNull();
  expect(requests.some(({ path }) => /\/apps(?:\/|$)|\/app-versions/.test(path))).toBe(false);
  expect(state().appStore.modules.canvas.app.appId).toBeUndefined();
  expect(state().queryLibrary.workspaceId).toBe('workspace-a');
  view.unmount();
  expect(state().queryPanel.selectedQuery).toBeNull();
  expect(state().dataQuery.queries.modules.canvas).toEqual([]);
  expect(state().queryFolders.folders).toEqual([]);
});

it('does not apply a deferred load after leaving or switching workspace', async () => {
  let finish;
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  server.use(
    http.get(`${config.apiUrl}/query-library/queries`, async () => {
      started();
      return new Promise((resolve) => {
        finish = () => resolve(HttpResponse.json([query]));
      });
    })
  );
  const view = render(<QueryLibraryPage darkMode={false} />);
  await ready;
  await act(async () => {
    await new Promise(setImmediate);
  });
  view.unmount();
  act(() => {
    state().queryLibrary.beginLibrarySession('workspace-b');
  });
  const responseCompleted = new Promise((resolve) => {
    const onResponse = ({ request }) => {
      if (!new URL(request.url).pathname.endsWith('/query-library/queries')) return;
      server.events.removeListener('response:mocked', onResponse);
      resolve();
    };
    server.events.on('response:mocked', onResponse);
  });
  await act(async () => {
    finish();
    await responseCompleted;
    await new Promise(setImmediate);
  });
  await waitFor(() => expect(state().queryLibrary.workspaceId).toBe('workspace-b'));
  expect(state().dataQuery.queries.modules.canvas).toEqual([]);
  expect(state().queryLibrary.versionsByQueryId).toEqual({});
});

it('shows draft save progress, failure and retry beside the version pill', async () => {
  let finish;
  let fail = true;
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1`, () =>
      fail
        ? HttpResponse.json({ error: 'Draft rejected' }, { status: 400 })
        : new Promise((resolve) => {
            finish = () => resolve(HttpResponse.json(query));
          })
    )
  );
  render(<QueryLibraryPage darkMode={false} />);
  await screen.findByText('getCustomers');
  act(() => {
    state().queryPanel.setSelectedQuery('q1');
  });
  await screen.findByRole('button', { name: /^v1/ });
  act(() => {
    state().dataQuery.updateDataQuery({ ...query.options, url: 'edited' });
  });
  expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  await screen.findByText('Could not save changes');
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
  await waitFor(() => expect(finish).toBeDefined());
  expect(screen.getByText('Saving...')).toBeInTheDocument();
  await act(async () => {
    finish();
  });
  expect(await screen.findByText('Saved')).toBeInTheDocument();
});

it('mounts the real dashboard library branch without app grid requests', async () => {
  render(<HomePage appType="query_library" darkMode={false} switchDarkMode={() => {}} />);
  expect(await screen.findByText('getCustomers')).toBeInTheDocument();
  expect(document.querySelector('.apps-modules-tabs')).toBeNull();
  expect(document.querySelector('.home-page-sidebar')).toBeNull();
  expect(document.querySelector('[data-cy="editor-header-section"]')).toBeNull();
  expect(requests.some(({ path }) => /\/apps(?:\/|$)|\/app-versions/.test(path))).toBe(false);
});

it('clears the selected query and folders when the workspace route changes', async () => {
  server.use(
    http.get(`${config.apiUrl}/query-library/queries`, ({ request }) =>
      HttpResponse.json(request.headers.get('tj-workspace-id') === 'workspace-a' ? [query] : [])
    )
  );
  render(
    <>
      <Link to="/workspace-b/query-library">Other workspace</Link>
      <Routes>
        <Route path="/:workspaceId/query-library" element={<QueryLibraryPage darkMode={false} />} />
      </Routes>
    </>,
    { route: '/workspace-a/query-library' }
  );
  await screen.findByText('getCustomers');
  act(() => {
    state().queryPanel.setSelectedQuery('q1');
  });
  await screen.findByRole('button', { name: /^v1/ });
  fireEvent.click(screen.getByRole('link', { name: 'Other workspace' }));
  await waitFor(() => expect(state().queryLibrary.workspaceId).toBeNull());
  expect(requests.filter(({ workspace }) => workspace === 'workspace-b')).toEqual([]);
  act(() =>
    authenticationService.updateCurrentSession({
      ...authenticationService.currentSessionValue,
      current_organization_id: 'workspace-b-id',
      current_organization_slug: 'workspace-b',
    })
  );
  await waitFor(() => expect(state().queryLibrary.workspaceId).toBe('workspace-b-id'));
  expect(state().queryPanel.selectedQuery).toBeNull();
  expect(state().queryLibrary.versionsByQueryId).toEqual({});
  expect(state().queryPanel.queryPreviewData).toBe('');
  await waitFor(() => expect(screen.queryByText('Loading query library…')).not.toBeInTheDocument());
  expect(screen.queryByText('getCustomers')).not.toBeInTheDocument();
});

it('creates a standalone query and displays it in the library list', async () => {
  let created;
  server.use(
    http.post(`${config.apiUrl}/query-library/queries`, async ({ request }) => {
      created = { body: await request.json(), workspace: request.headers.get('tj-workspace-id') };
      return HttpResponse.json({ ...created.body, id: 'created' });
    })
  );
  render(<QueryLibraryPage darkMode={false} />);
  await screen.findByText('getCustomers');
  await act(async () => {
    await state().dataQuery.createDataQuery(
      { id: 'null', kind: 'restapi', name: 'REST API' },
      false,
      query.options,
      'canvas',
      'newCustomerLookup'
    );
  });
  expect(screen.getByDisplayValue('newCustomerLookup')).toBeInTheDocument();
  expect(created.workspace).toBe('workspace-a');
  expect(created.body).toMatchObject({ name: 'newCustomerLookup', kind: 'restapi' });
  expect(created.body.appId).toBeUndefined();
  expect(created.body.appVersionId).toBeUndefined();
});

it('opens editable library drafts after leaving a read-only app', async () => {
  state().setIsEditorReadOnly(true);
  render(<QueryLibraryPage darkMode={false} />);
  await screen.findByText('getCustomers');
  act(() => {
    state().queryPanel.setSelectedQuery('q1');
  });
  await screen.findByRole('button', { name: /^v1/ });
  const renameButton = screen
    .getAllByRole('button', { name: /getCustomers/ })
    .find((element) => element.tagName === 'BUTTON');
  expect(renameButton).toBeEnabled();
});

it('keeps workspace creation enabled while a saved version editor is locked', async () => {
  server.use(
    http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
      HttpResponse.json({
        draft: null,
        versions: [
          {
            id: 'saved',
            name: 'v1',
            versionNumber: 1,
            kind: 'restapi',
            options: query.options,
            dataSourceId: null,
            environment: { id: 'development', name: 'development', priority: 1 },
          },
        ],
        nextVersionNumber: 2,
      })
    )
  );
  const view = render(<QueryLibraryPage darkMode={false} />);
  await screen.findByText('getCustomers');
  act(() => {
    state().queryPanel.setSelectedQuery('q1');
  });
  await screen.findByRole('button', { name: /^v1/ });
  expect(view.container.querySelector('[data-cy="show-ds-popover-button"]')).toBeEnabled();
  const renameButton = screen
    .getAllByRole('button', { name: /getCustomers/ })
    .find((element) => element.tagName === 'BUTTON');
  expect(renameButton).toBeDisabled();
});

const savedVersion = (extra = {}) => ({
  id: 'saved',
  name: 'v1',
  versionNumber: 1,
  kind: 'restapi',
  options: query.options,
  dataSourceId: null,
  environment: { id: 'development', name: 'development', priority: 1 },
  ...extra,
});
const selectQuery = async () => {
  fireEvent.click(await screen.findByText('getCustomers'));
  await screen.findByRole('button', { name: /^v\d/ });
};

// Break this catches: server hydration after discard queues an autosave into a closed draft.
it('discards an edited mounted draft without autosaving restored content and can create and save again', async () => {
  let draft = true;
  let row = query;
  let patches = 0;
  let creates = 0;
  const versions = () => ({
    draft: draft ? { createdFrom: 'v1' } : null,
    versions: [savedVersion()],
    nextVersionNumber: 2,
  });
  server.use(
    http.get(`${config.apiUrl}/query-library/queries`, () => HttpResponse.json([row])),
    http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () => HttpResponse.json(versions())),
    http.patch(`${config.apiUrl}/query-library/queries/q1`, async ({ request }) => {
      patches++;
      if (!draft) return HttpResponse.json({ error: 'No draft' }, { status: 400 });
      row = { ...row, ...(await request.json()) };
      return HttpResponse.json(row);
    }),
    http.delete(`${config.apiUrl}/query-library/queries/q1/versions/draft`, () => {
      draft = false;
      row = query;
      return HttpResponse.json({});
    }),
    http.post(`${config.apiUrl}/query-library/queries/q1/versions/draft`, () => {
      creates++;
      draft = true;
      return HttpResponse.json(versions());
    }),
    http.post(`${config.apiUrl}/query-library/queries/q1/versions/save`, () => {
      draft = false;
      return HttpResponse.json(savedVersion({ id: 'saved-again', name: 'v2', versionNumber: 2 }));
    })
  );
  render(<QueryLibraryPage darkMode={false} />);
  await selectQuery();
  act(() => state().dataQuery.updateDataQuery({ ...query.options, url: 'edited' }));
  await waitFor(() => expect(patches).toBe(1));
  act(() => state().dataQuery.updateDataQuery({ ...query.options, url: 'queued edit' }));
  await act(async () => {
    await state().queryLibrary.discardLibraryDraft('q1');
    state().dataQuery.saveData.flush();
    await new Promise(setImmediate);
  });
  expect(state().queryPanel.selectedQuery.options.url).toBe('');
  expect(patches).toBe(2);
  expect(state().dataQuery.failedSaves).toEqual({});
  expect(screen.queryByText('Could not save changes')).not.toBeInTheDocument();
  await act(async () => {
    await state().queryLibrary.createLibraryDraft('q1', { fromVersionId: 'saved' });
  });
  expect(creates).toBe(1);
  act(() => state().dataQuery.updateDataQuery({ ...query.options, url: 'new draft' }));
  await act(async () => {
    await state().queryLibrary.saveLibraryVersion('q1');
  });
  expect(patches).toBe(3);
});

// Break this catches: list double-click/menu rename bypasses the saved-version lock.
it.each([false, true])(
  'locks saved-version list rename with draft=%s while workspace creation stays enabled',
  async (hasDraft) => {
    let patches = 0;
    server.use(
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
        HttpResponse.json({
          draft: hasDraft ? { createdFrom: 'v1' } : null,
          versions: [savedVersion()],
          nextVersionNumber: 2,
        })
      ),
      http.patch(`${config.apiUrl}/query-library/queries/q1`, () => {
        patches++;
        return HttpResponse.json(query);
      })
    );
    const view = render(<QueryLibraryPage darkMode={false} />);
    await selectQuery();
    act(() => state().queryLibrary.viewLibraryVersion('q1', 'saved'));
    fireEvent.doubleClick(screen.getByText('getCustomers', { selector: '.query-row span.text-truncate' }));
    expect(view.container.querySelector('[data-cy="query-edit-input-field"]')).toBeNull();
    fireEvent.click(view.container.querySelector('[data-cy="query-handler-menu-getcustomers"]'));
    const rename = await screen.findByText('Rename', { selector: '.list-item-option-menu-label' });
    fireEvent.click(rename);
    expect(view.container.querySelector('[data-cy="query-edit-input-field"]')).toBeNull();
    await act(async () => {
      await state().dataQuery.renameQuery('q1', 'forbidden');
    });
    expect(patches).toBe(0);
    expect(view.container.querySelector('[data-cy="show-ds-popover-button"]')).toBeEnabled();
    expect(screen.getByText('Shared')).toBeInTheDocument();
  }
);

// Break this catches: denied optimistic rename leaves an unsaved name in the list.
it('restores a denied list rename and allows the next rename to succeed', async () => {
  let deny = true;
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1`, async ({ request }) =>
      deny
        ? HttpResponse.json({ error: 'Denied' }, { status: 400 })
        : HttpResponse.json({ ...query, ...(await request.json()) })
    )
  );
  const view = render(<QueryLibraryPage darkMode={false} />);
  await selectQuery();
  const rename = (value) => {
    fireEvent.doubleClick(screen.getByText('getCustomers', { selector: '.query-row span.text-truncate' }));
    const input = view.container.querySelector('[data-cy="query-edit-input-field"]');
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
  };
  rename('deniedName');
  await waitFor(() => expect(state().queryLibrary.isSaving).toBe(false));
  expect(screen.getByText('getCustomers', { selector: '.query-row span.text-truncate' })).toBeInTheDocument();
  expect(screen.queryByText('deniedName')).not.toBeInTheDocument();
  deny = false;
  rename('allowedName');
  await screen.findByText('allowedName', { selector: '.query-row span.text-truncate' });
  await waitFor(() => expect(state().queryPanel.selectedQuery.name).toBe('allowedName'));
});

// Break this catches: the saved editor still uses the draft source while its run targets the saved snapshot.
it.each([false, true])(
  'shows and runs the viewed source then returns to the untouched draft without a PATCH (plugin=%s)',
  async (plugin) => {
    authenticationService.updateCurrentSession({ ...authenticationService.currentSessionValue, admin: true });
    const sources = ['A', 'B'].map((name) => ({
      id: `source-${name}`,
      kind: 'restapi',
      name: `Source ${name}`,
      scope: 'global',
      type: 'global',
      ...(plugin
        ? {
            plugin_id: `plugin-${name}`,
            plugin: {
              operations_file: {
                data: {
                  properties: { payload: { type: 'text', label: `Schema ${name}`, key: 'payload' } },
                  defaults: {},
                },
              },
            },
          }
        : {}),
    }));
    let patches = 0;
    const runs = [];
    server.use(
      http.get(`${config.apiUrl}/data-sources/workspace-a`, () => HttpResponse.json({ data_sources: sources })),
      http.get(`${config.apiUrl}/query-library/queries`, () =>
        HttpResponse.json([
          {
            ...query,
            dataSourceId: 'source-B',
            options: { ...query.options, url: 'draft B', payload: { value: 'draft B' } },
          },
        ])
      ),
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
        HttpResponse.json({
          draft: { createdFrom: 'v1' },
          versions: [
            savedVersion({ dataSourceId: 'source-A', options: { ...query.options, payload: { value: 'saved A' } } }),
          ],
          nextVersionNumber: 2,
        })
      ),
      http.patch(`${config.apiUrl}/query-library/queries/q1`, () => {
        patches++;
        return HttpResponse.json(query);
      }),
      http.post(`${config.apiUrl}/query-library/queries/q1/run/development`, async ({ request }) => {
        runs.push(await request.json());
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    const opened = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<QueryLibraryPage darkMode={false} />);
    await selectQuery();
    expect(state().globalDataSources).toEqual(sources);
    expect(state().queryPanel.selectedQuery.data_source_id).toBe('source-B');
    expect(screen.getByText('Source B')).toBeInTheDocument();
    if (plugin) expect(screen.getByText('Schema B')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^v2/ }));
    fireEvent.click(screen.getByText('v1', { selector: '[data-cy$="-library-version-name"]' }));
    fireEvent.click(screen.getByRole('button', { name: /^v1/ }));
    expect(screen.getByText('Source A')).toBeInTheDocument();
    if (plugin) {
      expect(screen.getByText('Schema A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('saved A')).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Edit datasource' }));
    expect(opened).toHaveBeenLastCalledWith(
      expect.stringContaining('/data-sources/source-A'),
      '_blank',
      'noopener,noreferrer'
    );
    fireEvent.click(document.querySelector('[data-cy="query-run-button"]'));
    await waitFor(() => expect(runs).toEqual([{ libraryVersionId: 'saved' }]));
    await waitFor(() => expect(state().queryPanel.isPreviewQueryLoading).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /^v1/ }));
    fireEvent.click(screen.getByText('v2', { selector: '[data-cy$="-library-version-name"]' }));
    expect(screen.getByText('Source B')).toBeInTheDocument();
    if (plugin) {
      expect(screen.getByText('Schema B')).toBeInTheDocument();
      expect(screen.getByDisplayValue('draft B')).toBeInTheDocument();
    }
    expect(state().queryPanel.selectedQuery.options.url).toBe('draft B');
    expect(state().queryPanel.selectedQuery.data_source_id).toBe('source-B');
    await act(async () => {
      state().dataQuery.saveData.flush();
      await new Promise(setImmediate);
    });
    expect(patches).toBe(0);
    opened.mockRestore();
  }
);

// Break this catches: a route slug is sent as an API workspace id, causing unauthorized reloads.
it('resolves a workspace slug to the authorized session UUID before loading library APIs', async () => {
  authenticationService.updateCurrentSession({
    ...authenticationService.currentSessionValue,
    current_organization_id: '4ccb18ad-a487-45b8-bc8e-242dc0e8a391',
    current_organization_slug: 'ws-workspace',
  });
  render(
    <Routes>
      <Route path="/:workspaceId/query-library" element={<QueryLibraryPage darkMode={false} />} />
    </Routes>,
    { route: '/ws-workspace/query-library' }
  );
  await screen.findByText('getCustomers');
  expect(state().queryLibrary.workspaceId).toBe('4ccb18ad-a487-45b8-bc8e-242dc0e8a391');
  expect(
    requests
      .filter(
        ({ path }) =>
          path.includes('/query-library/') || path.includes('/data-sources/') || path.endsWith('/app-environments')
      )
      .every(({ workspace }) => workspace === '4ccb18ad-a487-45b8-bc8e-242dc0e8a391')
  ).toBe(true);
  expect(requests.some(({ path }) => path.endsWith('/data-sources/4ccb18ad-a487-45b8-bc8e-242dc0e8a391'))).toBe(true);
  expect(requests.some(({ path }) => path.includes('/data-sources/ws-workspace'))).toBe(false);
});

// Break this catches: a built-in tile posts its pseudo id instead of its workspace STATIC source UUID.
it.each([
  ['JavaScript', 'runjs', '462219ea-8bbd-42fc-a511-f19e7353d8b0'],
  ['REST API', 'restapi', '2ff100eb-3891-4cc3-bb58-b6ab211e41ea'],
  ['ToolJet DB', 'tooljetdb', '88af61e2-3a7f-46a3-915c-2b73fd835e7c'],
])('creates through the actual %s tile with its workspace static source UUID', async (label, kind, id) => {
  let created;
  let staticWorkspace;
  server.use(
    http.get(`${config.apiUrl}/query-library/static-data-sources`, ({ request }) => {
      staticWorkspace = request.headers.get('tj-workspace-id');
      return HttpResponse.json([{ id, kind, name: label, type: 'static' }]);
    }),
    http.patch(`${config.apiUrl}/query-library/queries/created-${kind}`, async ({ request }) =>
      HttpResponse.json({ ...created.body, ...(await request.json()), id: `created-${kind}` })
    ),
    http.post(`${config.apiUrl}/query-library/queries`, async ({ request }) => {
      created = { body: await request.json(), workspace: request.headers.get('tj-workspace-id') };
      return created.body.dataSourceId === id
        ? HttpResponse.json({ ...created.body, id: `created-${kind}` })
        : HttpResponse.json({ error: 'dataSourceId must be a UUID' }, { status: 400 });
    })
  );
  render(<QueryLibraryPage darkMode={false} />);
  fireEvent.click(await screen.findByRole('button', { name: label, exact: true }));
  await waitFor(() => expect(created).toBeDefined());
  expect(created).toMatchObject({ workspace: 'workspace-a', body: { kind, dataSourceId: id } });
  expect(staticWorkspace).toBe('workspace-a');
  await waitFor(() => expect(state().queryPanel.selectedQuery.id).toBe(`created-${kind}`));
  expect(state().queryPanel.selectedQuery.data_source_id).toBe(id);
  if (kind === 'restapi') {
    await waitFor(() => expect(state().queryPanel.selectedQuery.options.retry_network_errors).toBe(true), {
      timeout: 5000,
    });
  }
});
