/**
 * What the query editors' autocomplete gets from QueryManager: `input.<name>` hints in a query library app only.
 * Real store; the header and body are stubbed, the stub body reads the same hint lookup the code editors use.
 */
import React from 'react';
import { render, screen } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import QueryManager from '../../QueryManager';

jest.mock('../../Components/QueryManagerHeader', () => ({ QueryManagerHeader: () => null }));
jest.mock('../../Components/QueryManagerBody', () => {
  const React = require('react');
  const { CodeHinterContext } = require('@/AppBuilder/CodeBuilder/CodeHinterContext');
  const { createReferencesLookup } = require('@/_stores/utils');
  return {
    __esModule: true,
    default: function HintsBody() {
      const context = React.useContext(CodeHinterContext);
      const hints = createReferencesLookup(context, true).suggestionList.map((h) => h.hint);
      return React.createElement('div', { 'data-testid': 'hints' }, hints.join(','));
    },
  };
});

const state = () => useStore.getState();
const query = {
  id: 'q1',
  name: 'getCustomer',
  kind: 'runjs',
  options: {
    code: '',
    inputs: [{ name: 'region', defaultValue: 'eu' }],
    parameters: [{ name: 'limit', defaultValue: '5' }],
  },
};

function seed(appType, selected = query) {
  state().setApp({ ...state().appStore.modules.canvas.app, appType }, 'canvas');
  useStore.setState((s) => ({ queryPanel: { ...s.queryPanel, selectedQuery: selected } }));
}

const hints = () => screen.getByTestId('hints').textContent.split(',').filter(Boolean);

describe('QueryManager code hints', () => {
  it('offers input.<name> in a query library app, next to parameters', () => {
    seed('query_library');
    render(<QueryManager mode="edit" darkMode={false} />);

    expect(hints()).toEqual(expect.arrayContaining(['input', 'input.region', 'parameters.limit']));
  });

  it('offers input.<name> even when the query has no parameters', () => {
    seed('query_library', { ...query, options: { ...query.options, parameters: [] } });
    render(<QueryManager mode="edit" darkMode={false} />);

    expect(hints()).toEqual(['input', 'input.region']);
  });

  it('offers parameters but no bare input when the library query has no inputs', () => {
    seed('query_library', { ...query, options: { ...query.options, inputs: [] } });
    render(<QueryManager mode="edit" darkMode={false} />);

    expect(hints()).toEqual(['parameters', 'parameters.limit']);
  });

  it('offers no input hints in a normal app', () => {
    seed('front-end');
    render(<QueryManager mode="edit" darkMode={false} />);

    expect(hints().some((hint) => hint.startsWith('input'))).toBe(false);
    expect(hints()).toContain('parameters.limit');
  });
});
