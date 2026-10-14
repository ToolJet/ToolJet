/**
 * Query manager places code search on the Setup tab: a request sub-tab (REST, GraphQL).
 * A parameter is a popover, so search flashes its pill and does not open the form.
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

test('a parameter pill is marked so search can flash it, and a reveal request does not open the form', () => {
  render(
    <ParameterList
      parameters={[{ name: 'userId', defaultValue: '42' }]}
      handleAddParameter={() => {}}
      handleParameterChange={() => {}}
      handleParameterRemove={() => {}}
      containerRef={{ current: { offsetWidth: 2000 } }}
    />
  );
  expect(document.querySelector('[data-list-item-id="userId"]')).toBeInTheDocument();

  reveal('queryParam', 'userId');

  expect(rootOf('queryParam:userId')).toBeNull();
});
