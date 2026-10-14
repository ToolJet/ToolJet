/**
 * Query manager places code search opens inside the Setup tab: a request sub-tab (REST, GraphQL)
 * and a parameter's popover. Each marks what it opened with `data-reveal-root` so the highlight
 * searches there, not in a hidden pane.
 */
import React from 'react';
import { render, screen, act } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import RestTabs from '@/AppBuilder/QueryManager/QueryEditors/Restapi/Tabs';
import GraphqlKeyValueTabs from '@/AppBuilder/QueryManager/QueryEditors/Graphql/GraphqlKeyValueTabs';
import ParameterList from '@/AppBuilder/QueryManager/Components/ParameterList';
import { createAppBuilderControls } from '@/test/app-builder/controls';

// Icon adapter only (external package). The shared __mocks__/lucideDynamicIcon.jsx hands lucide's
// Icon a component where it expects an icon node, which crashes any ui/Button with an icon.
jest.mock('lucide-react/dynamic.mjs', () => ({ __esModule: true, DynamicIcon: () => null, iconNames: [] }));

const QUERY_ID = 'q1';
const state = () => useStore.getState();
const selectQuery = () => {
  state().dataQuery.setQueries([{ id: QUERY_ID, name: 'query1', kind: 'restapi', options: {} }], 'canvas');
  state().queryPanel.setSelectedQuery(QUERY_ID, 'canvas');
};
const reveal = (kind, itemId) => act(() => state().requestCodeSearchReveal({ kind, ownerId: QUERY_ID, itemId }));
const rootOf = (key) => document.querySelector(`[data-reveal-root="${key}"]`);

const controls = createAppBuilderControls();
beforeEach(() => {
  controls.observers.install();
  selectQuery();
});
afterEach(() => controls.restore());

test('REST: a restTab request activates that request tab', () => {
  const noop = () => {};
  render(
    <RestTabs
      options={{ headers: [['', '']], url_params: [['page', '1']], body: [['', '']], cookies: [['', '']] }}
      onChange={() => noop}
      removeKeyValuePair={noop}
      addNewKeyValuePair={noop}
      onInputChange={() => noop}
      setBodyToggle={noop}
      bodyToggle={false}
      componentName="restapi1"
    />
  );
  expect(rootOf('restTab:params')).not.toHaveClass('active');

  reveal('restTab', 'params');

  expect(rootOf('restTab:params')).toHaveClass('active');
  expect(rootOf('restTab:headers')).not.toHaveClass('active');
  expect(state().codeSearch.revealRequest).toBeNull();
});

test('GraphQL: a restTab request activates the tab keyed by the option name', () => {
  const tabs = [
    { label: 'Headers', key: 'headers' },
    { label: 'Params', key: 'url_params' },
  ];
  render(<GraphqlKeyValueTabs tabs={tabs} options={{ url_params: [['limit', '10']] }} optionchanged={() => {}} />);

  reveal('restTab', 'url_params');

  expect(rootOf('restTab:url_params')).toHaveClass('active');
  expect(state().codeSearch.revealRequest).toBeNull();
});

test('a queryParam request opens that parameter’s form', () => {
  render(
    <ParameterList
      parameters={[{ name: 'userId', defaultValue: '42' }]}
      handleAddParameter={() => {}}
      handleParameterChange={() => {}}
      handleParameterRemove={() => {}}
      containerRef={{ current: { offsetWidth: 2000 } }}
    />
  );
  expect(screen.getByText('userId')).toBeInTheDocument();
  expect(rootOf('queryParam:userId')).toBeNull();

  reveal('queryParam', 'userId');

  expect(rootOf('queryParam:userId')).toBeInTheDocument();
  expect(rootOf('queryParam:userId').querySelector('[data-param="name"] input')).toHaveValue('userId');
  expect(state().codeSearch.revealRequest).toBeNull();
});

test('a queryParam request opens a parameter hidden behind "+N"', () => {
  const parameters = Array.from({ length: 6 }, (_, i) => ({ name: `param${i}`, defaultValue: String(i) }));
  render(
    <ParameterList
      parameters={parameters}
      handleAddParameter={() => {}}
      handleParameterChange={() => {}}
      handleParameterRemove={() => {}}
      containerRef={{ current: { offsetWidth: 400 } }}
    />
  );
  expect(screen.queryByText('param5')).toBeNull();

  reveal('queryParam', 'param5');

  expect(rootOf('queryParam:param5')).toBeInTheDocument();
  expect(state().codeSearch.revealRequest).toBeNull();
});
