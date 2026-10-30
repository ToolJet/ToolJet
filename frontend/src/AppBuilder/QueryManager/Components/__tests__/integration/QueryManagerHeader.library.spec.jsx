/**
 * Tabs and version dropdown of the query header in a query library app vs a normal app.
 * Real store; the version dropdown's versions call goes through MSW.
 */
import '@/test/setupMsw';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { QueryManagerHeader } from '../../QueryManagerHeader';

// External icon package adapter: the lucide dynamic icon loader needs a bundler.
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));

// jsdom has no ResizeObserver (the header measures its width with one).
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const state = () => useStore.getState();

function seed(appType) {
  state().queryLibrary.setLibraryMode(appType === 'query_library');
  state().setApp({ ...state().appStore.modules.canvas.app, appType }, 'canvas');
  useStore.setState((s) => ({
    currentVersionId: 'ver1',
    queryPanel: { ...s.queryPanel, selectedQuery: { id: 'q1', name: 'getCustomer', kind: 'restapi', options: {} } },
  }));
}

const renderHeader = () =>
  render(<QueryManagerHeader darkMode={false} activeTab={1} setActiveTab={jest.fn()} ref={React.createRef()} />);

const tabLabels = () => [...document.querySelectorAll('[data-cy^="query-tab-"]')].map((el) => el.textContent);

describe('QueryManagerHeader in a query library app', () => {
  beforeEach(() => {
    server.use(
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
        HttpResponse.json({ draft: { createdFrom: null, description: null }, versions: [], nextVersionNumber: 1 })
      )
    );
  });

  it('shows Setup and Transformation but no Settings tab', async () => {
    seed('query_library');
    renderHeader();

    expect(tabLabels()).toEqual(['Setup', 'Transformation']);
    expect(await screen.findByRole('button', { name: /^v1/ })).toBeInTheDocument();
  });

  it('keeps all three tabs and no version dropdown in a normal app', () => {
    seed('front-end');
    renderHeader();

    expect(tabLabels()).toEqual(['Setup', 'Transformation', 'Settings']);
    expect(document.querySelector('[data-cy="library-version-dropdown"]')).toBeNull();
  });

  it('disables renaming while no draft is open', async () => {
    server.use(
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
        HttpResponse.json({
          draft: null,
          nextVersionNumber: 2,
          versions: [{ id: 'lv1', name: 'v1', versionNumber: 1, environment: null, isReleased: false, options: {} }],
        })
      )
    );
    seed('query_library');
    renderHeader();

    await waitFor(() => expect(screen.getByRole('button', { name: /getCustomer/ })).toBeDisabled());
  });

  it('allows renaming the draft', async () => {
    seed('query_library');
    renderHeader();

    await screen.findByRole('button', { name: /^v1/ });
    expect(screen.getByRole('button', { name: /getCustomer/ })).toBeEnabled();
  });
});

it('allows preview of an accessible saved source when the draft source is inaccessible', async () => {
  const { authenticationService } = require('@/_services');
  const original = authenticationService.currentSessionValue;
  authenticationService.updateCurrentSession({
    ...original,
    admin: false,
    super_admin: false,
    user_permissions: {},
    data_source_group_permissions: { usable_data_sources_id: ['source-A'] },
  });
  try {
    state().queryLibrary.beginLibrarySession('workspace-a');
    useStore.setState((s) => ({
      queryPanel: {
        ...s.queryPanel,
        selectedQuery: { id: 'q1', name: 'savedSource', kind: 'restapi', data_source_id: 'source-B', options: {} },
        selectedDataSource: { id: 'source-A', kind: 'restapi', scope: 'global', type: 'default' },
      },
    }));
    server.use(
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
        HttpResponse.json({
          draft: { createdFrom: null },
          nextVersionNumber: 2,
          versions: [
            { id: 'saved', name: 'v1', versionNumber: 1, kind: 'restapi', dataSourceId: 'source-A', options: {} },
          ],
        })
      )
    );
    state().queryLibrary.viewLibraryVersion('q1', 'saved');
    renderHeader();
    await screen.findByRole('button', { name: /^v1/ });
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
    expect(state().queryPanel.selectedQuery.data_source_id).toBe('source-B');
  } finally {
    authenticationService.updateCurrentSession(original);
  }
});
