/**
 * The Tabs inspector lists a UI 2.0 Tabs widget's style, alignment and wizard options under its static tabs. Each one
 * needs a React key: without them, selecting a UI 2.0 Tabs widget in the editor logged "Each child in a list should
 * have a unique key prop" from TabsLayout (editor drop suite, 2026-10-18). renderElement returns unkeyed elements, so
 * the list has to key them itself. The Additional actions list (shared by every widget's inspector) has the same gap in
 * core code; it is outside this check and noted for its owners.
 */
import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../EventManager', () => ({ EventManager: () => null }));
jest.mock('@/AppBuilder/CodeEditor', () => () => null);
jest.mock('../Utils', () => ({
  ...jest.requireActual('../Utils'),
  renderElement: (component, meta, updated, queries, param) => <div data-param={param}>{param}</div>,
}));
jest.mock('@/AppBuilder/RightSideBar/Inspector/InspectorAccordion', () => ({ items }) => (
  <div>
    {items.map((item) => (
      <section key={item.title}>{item.children}</section>
    ))}
  </div>
));
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }) => children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {}),
}));

import { TabsLayout } from '../Components/TabComponent';
import { shadTabsConfig } from '@/AppBuilder/WidgetManager/widgets/shadTabs';

const componentMeta = { properties: shadTabsConfig.properties, events: shadTabsConfig.events ?? {} };
const component = {
  id: 'tabs1',
  component: {
    component: 'ShadTabs',
    name: 'tabs1',
    properties: shadTabsConfig.properties,
    definition: {
      properties: {
        useDynamicOptions: { value: '{{false}}' },
        tabs: { value: "{{[{ id: 'a', title: 'One' }, { id: 'b', title: 'Two' }]}}" },
      },
      styles: {},
      events: [],
    },
  },
};

describe('Tabs inspector', () => {
  test("lists a UI 2.0 Tabs widget's extra options without a React key warning", () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <TabsLayout
          componentMeta={componentMeta}
          component={component}
          paramUpdated={() => {}}
          layoutPropertyChanged={() => {}}
          eventsChanged={() => {}}
          dataQueries={[]}
          currentState={{}}
          allComponents={{}}
          apps={[]}
          pages={[]}
        />
      );
      // Only the options list TabsLayout renders itself ("Check the render method of `TabsLayout`").
      const keyWarnings = errors.mock.calls.filter(
        (args) => String(args[0]).includes('unique "key"') && args.join(' ').includes('render method of `TabsLayout`')
      );
      expect(keyWarnings.map((args) => args.join(' | ').slice(0, 400))).toEqual([]);
    } finally {
      errors.mockRestore();
    }
  });
});
