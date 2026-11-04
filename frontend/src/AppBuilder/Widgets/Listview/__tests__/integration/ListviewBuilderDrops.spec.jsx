/**
 * Listview 2.0 builder: a drop on a read-only record is refused (tj-ee#5559 AC1-AC3), for a component dragged
 * from the panel and for a component moved on the canvas. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
 * (Listview-BLD-001..003). Runs the real DragLayer `end` and the real drag context; jsdom has no hit testing,
 * so `elementsFromPoint` answers with the record canvas under test.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { DragLayer } from '@/AppBuilder/RightSideBar/ComponentManagerTab/DragLayer';
import { dragContextBuilder } from '@/AppBuilder/AppCanvas/Grid/helpers/dragEnd';

const mockHandleDrop = jest.fn();
let mockDragSpec;
jest.mock('react-dnd', () => {
  const actual = jest.requireActual('react-dnd');
  return {
    ...actual,
    useDrag: (factory) => {
      mockDragSpec = factory();
      return [{ isDragging: false }, jest.fn(), jest.fn()];
    },
  };
});
jest.mock('@/AppBuilder/AppCanvas/Hooks/useCanvasDropHandler', () => ({
  useCanvasDropHandler: () => ({ handleDrop: mockHandleDrop }),
}));
jest.mock('@/AppBuilder/RightSideBar/WidgetBox', () => ({ WidgetBox: () => null }));
jest.mock('@/modules/Modules/components', () => ({ ModuleWidgetBox: () => null }));

const ID = 'lv1';
const records = `{{${JSON.stringify(Array.from({ length: 7 }, (_, index) => ({ name: `r${index}` })))}}}`;
const txt = () => {
  const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return definition;
};
const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: 'listview1',
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(records),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    rowsPerPage: binding('{{3}}'),
    enablePagination: binding('{{true}}'),
    visibility: binding('{{true}}'),
  },
  defaultStyles: {},
  defaultExtraComponents: { txt1: txt() },
  capabilities: { dnd: true },
  widgetHeight: 600,
  widgetWidth: 600,
});

const rows = () => [...document.querySelectorAll('.list-item')];
const canvasOf = (row) => row.querySelector('.real-canvas');
const pointerOver = (element) => {
  document.elementsFromPoint = () => [element];
  document.elementFromPoint = () => element;
};
const releaseOn = (element) => {
  pointerOver(element);
  mockDragSpec.end(
    { componentType: 'Button', component: { component: 'Button' } },
    { getClientOffset: () => ({ x: 5, y: 5 }) }
  );
};
const boxes = [
  { id: ID, parent: null, component: { component: 'Listview', parent: null } },
  { id: 'txt1', parent: ID, component: { component: 'Text', parent: ID } },
];
const moveOver = (element) => {
  pointerOver(element);
  return dragContextBuilder({
    event: { target: document.querySelector('.ele-txt1'), clientX: 5, clientY: 5 },
    widgets: boxes,
  });
};

async function mount() {
  widget.render({ currentMode: 'edit' });
  await waitFor(() => expect(rows()).toHaveLength(3));
  render(<DragLayer index={0} component={{ component: 'Button' }} />);
}

describe('Listview builder: drops on read-only records are refused', () => {
  beforeEach(() => {
    mockHandleDrop.mockClear();
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    delete document.elementsFromPoint;
    delete document.elementFromPoint;
  });

  test('[Listview-BLD-001] a panel drop lands on record 1 of page 1 and is refused on records 2 and 3', async () => {
    // Break this catches: a drop on a copy reaching handleDrop, which adds the component to the shared record template.
    await mount();

    releaseOn(canvasOf(rows()[0]));
    expect(mockHandleDrop).toHaveBeenCalledTimes(1);
    mockHandleDrop.mockClear();

    releaseOn(canvasOf(rows()[1]));
    releaseOn(canvasOf(rows()[2]));
    expect(mockHandleDrop).not.toHaveBeenCalled();
  });

  test('[Listview-BLD-001] a panel drop on record 1 of page 2 is refused', async () => {
    // Break this catches: the gate reading the page-relative index, so page 2's first record accepts the drop.
    await mount();
    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

    releaseOn(canvasOf(rows()[0]));

    expect(mockHandleDrop).not.toHaveBeenCalled();
  });

  test('[Listview-BLD-002] a panel drop on record 1 of server page 2 is refused', async () => {
    // Break this catches: server rows (the whole data, a page-relative index) making page 2's first record a drop target.
    widget.render({
      currentMode: 'edit',
      properties: {
        data: binding(`{{${JSON.stringify([{ name: 'a' }, { name: 'b' }, { name: 'c' }])}}}`),
        serverSidePagination: binding('{{true}}'),
        totalRecords: binding('{{7}}'),
      },
    });
    await waitFor(() => expect(rows()).toHaveLength(3));
    render(<DragLayer index={0} component={{ component: 'Button' }} />);
    releaseOn(canvasOf(rows()[0]));
    expect(mockHandleDrop).toHaveBeenCalledTimes(1);
    mockHandleDrop.mockClear();

    await widget.act('setPage', 2);
    await waitFor(() => expect(widget.exposed()?.pageIndex).toBe(2));
    releaseOn(canvasOf(rows()[0]));

    expect(mockHandleDrop).not.toHaveBeenCalled();
  });

  test('[Listview-BLD-001] moving a component onto a copy record is not a valid drop; onto record 1 it is', async () => {
    // Break this catches: the move target lookup ignoring copy records, so the component is re-parented into a copy.
    await mount();

    expect(moveOver(canvasOf(rows()[0])).isDroppable).toBe(true);
    expect(moveOver(canvasOf(rows()[2])).isDroppable).toBe(false);

    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));
    expect(moveOver(canvasOf(rows()[0])).isDroppable).toBe(false);
  });
});
