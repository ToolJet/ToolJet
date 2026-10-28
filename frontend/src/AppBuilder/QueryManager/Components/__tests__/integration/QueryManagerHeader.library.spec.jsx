/**
 * Tabs and version bar of the query header in a query library app vs a normal app.
 * Real store; the version bar's catalog call goes through MSW.
 */
import '@/test/setupMsw';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
      http.get(`${config.apiUrl}/data-queries/ver1/library-catalog`, () =>
        HttpResponse.json({
          queries: [
            {
              id: 'q1',
              name: 'getCustomer',
              folder: null,
              nextVersionNumber: 1,
              draft: { matchesLatestVersion: false },
              versions: [],
            },
          ],
        })
      )
    );
  });

  it('shows Setup and Transformation but no Settings tab', async () => {
    seed('query_library');
    renderHeader();

    expect(tabLabels()).toEqual(['Setup', 'Transformation']);
    expect(await screen.findByRole('button', { name: 'Release v1' })).toBeInTheDocument();
  });

  it('keeps all three tabs and no version bar in a normal app', () => {
    seed('front-end');
    renderHeader();

    expect(tabLabels()).toEqual(['Setup', 'Transformation', 'Settings']);
    expect(screen.queryByRole('button', { name: /^Release v/ })).not.toBeInTheDocument();
  });
});
