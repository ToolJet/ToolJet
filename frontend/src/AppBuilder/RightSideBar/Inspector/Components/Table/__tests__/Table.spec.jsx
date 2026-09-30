/**
 * Regression for the "Search, sort and filter" accordion section: whether the
 * displaySearchBox toggle is rendered at all is decided by the RAW,
 * unresolved property value (Table.jsx's `displaySearchBox` var), not a
 * resolved one. `??` only falls back on null/undefined, so a real boolean
 * `false` (as an AI-generated app definition would write) stays falsy and
 * drops the field from the accordion entirely, while the binding string
 * "{{false}}" stays truthy and keeps it - masking the bug in manual testing,
 * where the field is normally set via a toggle that always writes bindings.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Table } from '../Table';
import { renderElement } from '../../../Utils';

jest.mock('../../../Utils', () => ({
  // AccordionItem's removeEmptyItems() treats a bare `null` child as an
  // object and crashes on Object.keys(null), so the stub must return an
  // actual (if inert) element rather than null.
  renderElement: jest.fn((component, componentMeta, paramUpdated, dataQueries, param) => (
    <div data-testid={`element-${param}`} />
  )),
}));

jest.mock('../../../EventManager', () => ({
  EventManager: () => null,
}));

jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({ innerRef: () => {}, droppableProps: {}, placeholder: null }),
  Draggable: ({ children }) => children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {}),
}));

const buildComponent = (displaySearchBoxValue) => ({
  id: 'table1',
  component: {
    name: 'table1',
    component: 'Table',
    definition: {
      properties: {
        displaySearchBox: { value: displaySearchBoxValue },
      },
      events: [],
      general: {},
      generalStyles: {},
      others: {},
      styles: {},
    },
    properties: {},
  },
});

const renderTable = (displaySearchBoxValue) =>
  render(
    <Table
      component={buildComponent(displaySearchBoxValue)}
      componentMeta={{ properties: {}, others: {} }}
      paramUpdated={jest.fn()}
      dataQueries={[]}
      components={{}}
      currentState={{}}
      darkMode={false}
      eventsChanged={jest.fn()}
      apps={[]}
      pages={[]}
      layoutPropertyChanged={jest.fn()}
    />
  );

const wasDisplaySearchBoxRendered = () => renderElement.mock.calls.some((call) => call[4] === 'displaySearchBox');

describe('Table inspector: displaySearchBox visibility', () => {
  beforeEach(() => {
    renderElement.mockClear();
  });

  test('renders the search box toggle when the value is the raw boolean true', () => {
    renderTable(true);
    expect(wasDisplaySearchBoxRendered()).toBe(true);
  });

  test('renders the search box toggle when the value is the raw boolean false', () => {
    renderTable(false);
    expect(wasDisplaySearchBoxRendered()).toBe(true);
  });

  test('renders the search box toggle when the value is the binding string "{{false}}"', () => {
    renderTable('{{false}}');
    expect(wasDisplaySearchBoxRendered()).toBe(true);
  });
});
