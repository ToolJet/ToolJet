beforeEach(() => {
  useStore.setState((state) => ({
    license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
  }));
});
/**
 * Inputs list in place of Parameters in a query library app. Real store; ParameterList is stubbed to a
 * button per list (its popover form needs a code editor), so the handlers the body wires are what's under test.
 */
import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import { BaseQueryManagerBody } from '../../QueryManagerBody';

jest.mock('../../ParameterList', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ label = 'Parameters', handleAddParameter, idPrefix = '', noun }) =>
      React.createElement(
        'button',
        {
          type: 'button',
          'data-id-prefix': idPrefix,
          'data-noun': noun ?? '',
          onClick: () => handleAddParameter({ name: 'region', defaultValue: 'apac' }),
        },
        `add ${label}`
      ),
  };
});
// External icon package adapter: the shared lucide stub in __mocks__ can't render icons from this lucide version.
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
// The kind's own editor is a code editor that needs a browser; this suite is about the lists above it.
jest.mock('../../../QueryEditors', () => ({ allSources: {}, source: () => null }));
jest.mock('../../Preview', () => ({ __esModule: true, default: () => null }));

const state = () => useStore.getState();
const runjs = { id: 'q1', name: 'getCustomer', kind: 'runjs', options: { code: '', parameters: [{ name: 'limit' }] } };

function seed(appType) {
  if (appType === 'query_library') {
    state().queryLibrary.beginLibrarySession('workspace-a');
    useStore.setState((s) => ({
      queryLibrary: {
        ...s.queryLibrary,
        versionsByQueryId: { q1: { drafts: [{ ...runjs, id: 'draft-a', name: 'v1' }], versions: [] } },
        viewedVersionIdByQueryId: { q1: 'draft-a' },
      },
    }));
  } else state().queryLibrary.endLibrarySession();
  state().setApp({ ...state().appStore.modules.canvas.app, appType }, 'canvas');
  state().dataQuery.setQueries([runjs], 'canvas');
  useStore.setState((s) => ({
    queryPanel: { ...s.queryPanel, selectedQuery: runjs, selectedDataSource: { kind: 'runjs', id: 'runjs' } },
  }));
}

const selectedOptions = () => state().queryPanel.selectedQuery.options;

describe('QueryManagerBody inputs', () => {
  it('writes a new input to options.inputs', async () => {
    seed('query_library');
    render(<BaseQueryManagerBody darkMode={false} activeTab={1} />);

    await userEvent.click(screen.getByRole('button', { name: 'add Inputs' }));

    expect(selectedOptions().inputs).toEqual([{ name: 'region', defaultValue: 'apac' }]);
    expect(selectedOptions().parameters).toEqual([{ name: 'limit' }]);
  });

  it('gives the Inputs list its own id prefix and noun, and shows no Parameters list', () => {
    seed('query_library');
    render(<BaseQueryManagerBody darkMode={false} activeTab={1} />);

    const inputs = screen.getByRole('button', { name: 'add Inputs' });
    expect([inputs.dataset.idPrefix, inputs.dataset.noun]).toEqual(['inputs-', 'input']);
    expect(screen.queryByRole('button', { name: 'add Parameters' })).not.toBeInTheDocument();
  });

  it('has a Parameters list and no Inputs list in a normal app', async () => {
    seed('front-end');
    render(<BaseQueryManagerBody darkMode={false} activeTab={1} />);

    expect(screen.queryByRole('button', { name: 'add Inputs' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'add Parameters' }));
    expect(selectedOptions().parameters).toEqual([{ name: 'limit' }, { name: 'region', defaultValue: 'apac' }]);
  });

  it('shows neither list nor a docs link for a library query in an app', () => {
    const consumer = { id: 'q2', name: 'lib', kind: 'library', options: { parameters: [{ name: 'limit' }] } };
    state().setApp({ ...state().appStore.modules.canvas.app, appType: 'front-end' }, 'canvas');
    state().dataQuery.setQueries([consumer], 'canvas');
    useStore.setState((s) => ({
      queryPanel: { ...s.queryPanel, selectedQuery: consumer, selectedDataSource: { kind: 'library', id: 'null' } },
    }));
    render(<BaseQueryManagerBody darkMode={false} activeTab={1} />);

    expect(screen.queryByRole('button', { name: /^add / })).not.toBeInTheDocument();
    expect(screen.queryByText(/read documentation/i)).not.toBeInTheDocument();
  });
});

it('keeps the empty library source picker usable before any draft exists', () => {
  state().queryLibrary.beginLibrarySession('workspace-a');
  const { container } = render(<BaseQueryManagerBody darkMode={false} activeTab={1} />);
  expect(container.querySelector('.datasource-picker')).not.toHaveClass('disabled');
});
