/**
 * Per-query version dropdown of the library editor: environment tabs, Save version / Promote / Release /
 * Create draft version, the read-only view of a saved version, and the run environment.
 * Real store + MSW at the HTTP boundary.
 */
import '@/test/setupMsw';
import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { authenticationService } from '@/_services';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { BaseQueryManagerBody } from '@/AppBuilder/QueryManager/Components/QueryManagerBody';
import {
  LIBRARY_DRAFT,
  isLibraryQueryLocked,
  libraryRunEnvironment,
  viewedLibraryVersionId,
} from '@/AppBuilder/_stores/slices/queryLibrarySlice';
import LibraryVersionDropdown from '../../LibraryVersionDropdown';

// External icon package adapter: the lucide dynamic icon loader needs a bundler.
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
// Supply the actual schema to the existing external plugins-package test adapter.
jest.mock('@tooljet/plugins/client', () => ({
  allManifests: {},
  allSvgs: {},
  allOperations: { Postgresql: require('../../../../../../plugins/packages/postgresql/lib/operations.json') },
}));
const controls = createAppBuilderControls();
let originalSession;
beforeEach(() => {
  originalSession = authenticationService.currentSessionValue;
  authenticationService.updateCurrentSession({
    ...originalSession,
    data_source_group_permissions: { usable_data_sources_id: ['source1'] },
    app_group_permissions: {
      environment_access: { development: true, staging: true, production: true },
    },
  });
  controls.observers.install();
  controls.geometry.textRange();
});
afterEach(() => {
  authenticationService.updateCurrentSession(originalSession);
  controls.restore();
});

const base = `${config.apiUrl}/query-library/queries/q1/versions`;
const dev = { id: 'env-dev', name: 'development', priority: 1 };
const staging = { id: 'env-stg', name: 'staging', priority: 2 };
const production = { id: 'env-prod', name: 'production', priority: 3 };

const version = (n, extra = {}) => ({
  id: `lv${n}`,
  name: `v${n}`,
  versionNumber: n,
  description: null,
  createdFrom: null,
  environment: dev,
  isReleased: false,
  createdAt: '2026-10-01',
  kind: 'postgresql',
  dataSourceId: 'source1',
  options: { mode: 'sql', query: `select v${n}` },
  ...extra,
});

const draftSource = { kind: 'postgresql', id: 'source1', scope: 'global', type: 'default' };
const draftQuery = {
  id: 'q1',
  name: 'getCustomer',
  kind: 'postgresql',
  data_source_id: 'source1',
  options: { mode: 'sql', query: 'select draft' },
};
const state = () => useStore.getState();

function seed({ multiEnvironment = true } = {}) {
  state().queryLibrary.setLibraryMode(true);
  state().dataQuery.setQueries([draftQuery], 'canvas');
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(['q1'], 'canvas');
  state().setCurrentMode('edit', 'canvas');
  seedApp({});
  state().setApp({ ...state().appStore.modules.canvas.app, appType: 'query_library' }, 'canvas');
  useStore.setState((s) => ({
    currentVersionId: 'ver1',
    globalDataSources: [draftSource],
    environments: [dev, staging, production],
    selectedEnvironment: dev,
    license: { ...s.license, featureAccess: { ...s.license?.featureAccess, multiEnvironment } },
    queryPanel: {
      ...s.queryPanel,
      selectedQuery: draftQuery,
      selectedDataSource: draftSource,
    },
  }));
}

// The server sends nextVersionNumber; by default the next number after the newest listed version.
const withNext = (view) => ({ nextVersionNumber: (view.versions[0]?.versionNumber ?? 0) + 1, ...view });
const listVersions = (view) =>
  server.use(http.get(base, () => HttpResponse.json(withNext(typeof view === 'function' ? view() : view))));

const renderDropdown = () => render(<LibraryVersionDropdown queryId="q1" darkMode={false} />);
const sqlEditor = () => document.querySelector('[role="textbox"][data-language="sql"]');

const pill = () => screen.findByRole('button', { name: /^v\d/ });
const openDropdown = async () => userEvent.click(await pill());
const versionNames = () =>
  [...document.querySelectorAll('[data-cy$="-library-version-name"]')].map((el) => el.textContent);
const openMenu = async (name) => userEvent.click(screen.getByRole('button', { name: `More actions for ${name}` }));
const tab = (name) => screen.getByRole('button', { name });

describe('LibraryVersionDropdown', () => {
  // Break this catches: hiding every environment tab when multi-environment access is unavailable.
  it('keeps Development available and shows locked Staging and Production without multi-environment access', async () => {
    seed({ multiEnvironment: false });
    listVersions({ draft: {}, versions: [] });
    renderDropdown();
    await openDropdown();

    expect(tab('Development')).toBeEnabled();
    expect(tab('Staging')).toBeDisabled();
    expect(tab('Production')).toBeDisabled();
    await userEvent.click(tab('Staging'));
    expect(libraryRunEnvironment(state(), 'q1')).toEqual(dev);
    expect(screen.getByRole('button', { name: 'Save version' })).toBeEnabled();
  });

  // Break this catches: a separate library toggle bypassing the shared environment permission checks.
  it('disables environments the workspace member cannot access', async () => {
    seed();
    authenticationService.updateCurrentSession({
      ...authenticationService.currentSessionValue,
      app_group_permissions: { environment_access: { development: true, staging: false, production: true } },
    });
    listVersions({ draft: null, versions: [version(1)] });
    renderDropdown();
    await openDropdown();

    expect(tab('Staging')).toBeDisabled();
    expect(tab('Production')).toBeEnabled();
    await userEvent.click(tab('Staging'));
    expect(libraryRunEnvironment(state(), 'q1')).toEqual(dev);
  });

  it('shows v1 · Development and lists v1 under the Development tab only', async () => {
    seed();
    listVersions({ draft: null, versions: [version(1)] });
    renderDropdown();

    const button = await pill();
    expect(within(button).getByText('v1')).toBeInTheDocument();
    expect(within(button).getByText('Development')).toBeInTheDocument();

    await openDropdown();
    expect(versionNames()).toEqual(['v1']);
    await userEvent.click(tab('Staging'));
    expect(versionNames()).toEqual([]);
    await userEvent.click(tab('Production'));
    expect(versionNames()).toEqual([]);
  });

  it('saves the draft as v2 and then lists v2 created from v1', async () => {
    seed();
    let saved = false;
    let body;
    listVersions(() =>
      saved
        ? { draft: null, versions: [version(2, { createdFrom: 'v1' }), version(1)] }
        : { draft: { createdFrom: 'v1', description: null }, versions: [version(1)] }
    );
    server.use(
      http.post(`${base}/save`, async ({ request }) => {
        body = await request.json();
        saved = true;
        return HttpResponse.json(version(2, { createdFrom: 'v1' }));
      })
    );
    renderDropdown();
    await openDropdown();

    await userEvent.click(screen.getByRole('button', { name: 'Save version' }));

    await waitFor(() => expect(versionNames()).toEqual(['v2', 'v1']));
    expect(body).toEqual({});
    expect(screen.getByText('created from v1')).toBeInTheDocument();
  });

  it('promotes v1 and it moves to the Staging tab', async () => {
    seed();
    let promoted = false;
    listVersions(() => ({ draft: null, versions: [version(1, promoted ? { environment: staging } : {})] }));
    server.use(
      http.post(`${base}/lv1/promote`, () => {
        promoted = true;
        return HttpResponse.json(version(1, { environment: staging }));
      })
    );
    renderDropdown();
    await openDropdown();

    await openMenu('v1');
    await userEvent.click(screen.getByRole('button', { name: 'Promote' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Promote to staging' }));

    await waitFor(() => expect(promoted).toBe(true));
    expect(await screen.findByRole('button', { name: /^v1\s*Staging/ })).toBeInTheDocument();
    await openDropdown();
    expect(versionNames()).toEqual(['v1']);
    await userEvent.click(tab('Development'));
    expect(versionNames()).toEqual([]);
  });

  it('does not offer Release for a development version with the multi-environment licence', async () => {
    seed({ multiEnvironment: true });
    listVersions({ draft: null, versions: [version(1)] });
    renderDropdown();
    await openDropdown();

    await openMenu('v1');

    expect(screen.getByRole('button', { name: 'Promote' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Release' })).not.toBeInTheDocument();
  });

  it('disables Create draft version while a draft exists', async () => {
    seed();
    listVersions({ draft: { createdFrom: 'v1', description: null }, versions: [version(1)] });
    renderDropdown();
    await openDropdown();

    expect(screen.getByRole('button', { name: /Create draft version/ })).toBeDisabled();
  });

  it('shows a viewed saved version read-only, and the draft editable again', async () => {
    seed();
    listVersions({ draft: { createdFrom: 'v1', description: null }, versions: [version(1)] });
    render(
      <>
        <LibraryVersionDropdown queryId="q1" darkMode={false} />
        <BaseQueryManagerBody darkMode={false} activeTab={1} />
      </>
    );
    await waitFor(() => expect(sqlEditor()).toBeInTheDocument());
    expect(sqlEditor().closest('.disabled')).toBeNull();
    expect(sqlEditor()).toHaveTextContent('select draft');

    await openDropdown();
    await userEvent.click(screen.getByText('v1', { selector: '[data-cy="v1-library-version-name"]' }));

    await waitFor(() => expect(sqlEditor()).toHaveTextContent('select v1'));
    expect(sqlEditor().closest('.disabled')).not.toBeNull();
    // Edits are dropped while a saved version is shown, so the draft is never overwritten with it.
    state().dataQuery.updateDataQuery({ query: 'select v1' });
    expect(state().queryPanel.selectedQuery.options.query).toBe('select draft');

    await userEvent.click(screen.getByText('v2', { selector: '[data-cy="v2-library-version-name"]' }));
    await waitFor(() => expect(sqlEditor()).toHaveTextContent('select draft'));
    await waitFor(() => expect(sqlEditor()).toBeInTheDocument());
    expect(sqlEditor().closest('.disabled')).toBeNull();
    expect(sqlEditor()).toHaveTextContent('select draft');
  });

  it('runs the newest version of the selected tab on that environment', async () => {
    seed();
    let environmentId;
    let previewBody;
    listVersions({
      draft: { createdFrom: 'v1', description: null },
      versions: [version(2, { environment: staging }), version(1)],
    });
    server.use(
      http.post(`${config.apiUrl}/query-library/queries/q1/run/:environmentId`, async ({ request, params }) => {
        environmentId = params.environmentId;
        previewBody = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    renderDropdown();
    await openDropdown();

    await userEvent.click(tab('Staging'));
    await state().queryPanel.runQuery('q1', 'getCustomer');

    expect(environmentId).toBe('env-stg');
    expect(previewBody).toEqual({ libraryVersionId: 'lv2' });
  });

  it('locks the editor on the Production tab with a draft open, and never runs the draft there', async () => {
    seed();
    let calls = 0;
    listVersions({ draft: { createdFrom: 'v1', description: null }, versions: [version(1)] });
    server.use(
      http.post(`${config.apiUrl}/query-library/queries/q1/run/:environmentId`, () => {
        calls += 1;
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    renderDropdown();
    await openDropdown();

    await userEvent.click(tab('Production'));

    expect(versionNames()).toEqual([]);
    expect(viewedLibraryVersionId(state(), 'q1')).not.toBe(LIBRARY_DRAFT);
    expect(isLibraryQueryLocked(state(), 'q1')).toBe(true);
    await state().queryPanel.runQuery('q1', 'getCustomer');
    expect(calls).toBe(0);

    await userEvent.click(tab('Development'));
    expect(viewedLibraryVersionId(state(), 'q1')).toBe(LIBRARY_DRAFT);
    expect(isLibraryQueryLocked(state(), 'q1')).toBe(false);
  });

  it('keeps the picked tab per query, so another query opens on its own default', async () => {
    seed();
    listVersions({ draft: { createdFrom: 'v1', description: null }, versions: [version(1)] });
    renderDropdown();
    await openDropdown();

    await userEvent.click(tab('Staging'));

    expect(libraryRunEnvironment(state(), 'q1')).toEqual(staging);
    expect(libraryRunEnvironment(state(), 'q2')).toEqual(dev);
  });

  it('runs a saved version on another data source by its version id without draft options', async () => {
    seed();
    let body;
    listVersions({ draft: {}, versions: [version(1, { dataSourceId: 'source-other' })] });
    server.use(
      http.post(`${config.apiUrl}/query-library/queries/q1/run/:environmentId`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    renderDropdown();
    await openDropdown();
    await userEvent.click(screen.getByText('v1', { selector: '[data-cy="v1-library-version-name"]' }));
    await state().queryPanel.runQuery('q1', 'getCustomer');
    expect(body).toEqual({ libraryVersionId: 'lv1' });
  });

  it('labels the draft with the server next number, so a deleted v3 is not reused', async () => {
    seed();
    listVersions({
      draft: { createdFrom: 'v2', description: null },
      versions: [version(2), version(1)],
      nextVersionNumber: 4,
    });
    renderDropdown();

    expect(within(await pill()).getByText('v4')).toBeInTheDocument();
    await openDropdown();
    expect(versionNames()).toEqual(['v4', 'v2', 'v1']);
  });

  it('runs a promoted version on its environment before any tab is picked', async () => {
    seed();
    let promoted = false;
    let environmentId;
    listVersions(() => ({ draft: null, versions: [version(1, promoted ? { environment: staging } : {})] }));
    server.use(
      http.post(`${base}/lv1/promote`, () => {
        promoted = true;
        return HttpResponse.json(version(1, { environment: staging }));
      }),
      http.post(`${config.apiUrl}/query-library/queries/q1/run/:environmentId`, ({ params }) => {
        environmentId = params.environmentId;
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    renderDropdown();
    await openDropdown();
    await openMenu('v1');
    await userEvent.click(screen.getByRole('button', { name: 'Promote' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Promote to staging' }));
    expect(await screen.findByRole('button', { name: /^v1\s*Staging/ })).toBeInTheDocument();

    await state().queryPanel.runQuery('q1', 'getCustomer');

    expect(environmentId).toBe('env-stg');
  });

  it("moves the editor to the source version's data source and kind when a draft is created from it", async () => {
    seed();
    useStore.setState({
      dataSources: [
        { id: 'ds1', kind: 'postgresql', name: 'pg' },
        { id: 'ds2', kind: 'restapi', name: 'api' },
      ],
    });
    let drafted = false;
    const v1 = version(1, { kind: 'restapi', dataSourceId: 'ds2', options: { url: 'http://x' } });
    listVersions(() => ({ draft: drafted ? { createdFrom: 'v1', description: null } : null, versions: [v1] }));
    server.use(
      http.post(`${base}/draft`, () => {
        drafted = true;
        return HttpResponse.json(withNext({ draft: { createdFrom: 'v1', description: null }, versions: [v1] }));
      })
    );
    renderDropdown();
    await openDropdown();
    await openMenu('v1');
    await userEvent.click(screen.getByRole('button', { name: 'Create draft version from this' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Create draft version' })
    );

    await waitFor(() => expect(state().queryPanel.selectedDataSource?.id).toBe('ds2'));
    expect(state().queryPanel.selectedQuery).toMatchObject({
      kind: 'restapi',
      data_source_id: 'ds2',
      options: { url: 'http://x' },
    });
    expect(state().dataQuery.queries.modules.canvas[0]).toMatchObject({ kind: 'restapi', data_source_id: 'ds2' });
  });
});
