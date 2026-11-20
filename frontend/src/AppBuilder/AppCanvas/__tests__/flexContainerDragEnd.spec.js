/**
 * Dragging a widget OUT of a FlexContainer takes its own drag-end path, which short-circuits
 * Grid's normal one. The drop restrictions a builder relies on everywhere else have to hold on
 * this path too.
 */
jest.mock('@/AppBuilder/AppCanvas/Grid/helpers/dragEnd', () => {
  const actual = jest.requireActual('@/AppBuilder/AppCanvas/Grid/helpers/dragEnd');
  return { ...actual, getDroppableSlotIdOnScreen: jest.fn() };
});

import { getDroppableSlotIdOnScreen } from '@/AppBuilder/AppCanvas/Grid/helpers/dragEnd';
import { handleFlexContainerDragEnd } from '@/AppBuilder/AppCanvas/Grid/helpers/flexContainerDragEnd';

const FLEX_ID = 'flex00000-0000-0000-0000-00000000';
const KANBAN_ID = 'kanban000-0000-0000-0000-00000000';
const CONTAINER_ID = 'cont00000-0000-0000-0000-00000000';
const LV_ID = 'listview0-0000-0000-0000-00000000';

const widget = (id, type, parent) => ({ id, parent, component: { component: type, parent }, layouts: {} });

const boxList = [
  widget(FLEX_ID, 'FlexContainer', null),
  widget(KANBAN_ID, 'Kanban', null),
  widget(CONTAINER_ID, 'Container', null),
  widget(LV_ID, 'Listview', FLEX_ID),
];

function dragOutTo(targetSlotId) {
  getDroppableSlotIdOnScreen.mockReturnValue(targetSlotId);
  const setComponentLayout = jest.fn();
  const handled = handleFlexContainerDragEnd({
    e: {
      target: { id: LV_ID, style: {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) },
      lastEvent: {},
      clientX: 10,
      clientY: 10,
    },
    boxList,
    currentLayout: 'desktop',
    gridWidth: 10,
    setComponentLayout,
    getComponentTypeFromId: (id) => boxList.find((b) => b.id === id)?.component?.component ?? null,
    incrementCanvasUpdater: jest.fn(),
    setReorderContainerChildren: jest.fn(),
    moduleId: 'canvas',
    getResolvedComponent: jest.fn(),
  });
  return { handled, setComponentLayout };
}

describe('Dragging out of a FlexContainer', () => {
  test('[Listview-BUG-027] a List View dragged out onto a Kanban card is refused', () => {
    // Break this catches: the drag-out path writing the new layout unconditionally, so a widget the
    // target would never accept lands inside it anyway — every restriction skipped by one route.
    const { handled, setComponentLayout } = dragOutTo(KANBAN_ID);

    expect(handled).toBe(true);
    expect(setComponentLayout).not.toHaveBeenCalled();
  });

  test('[Listview-BUG-027] a List View dragged out onto a Container still lands', () => {
    // Guard, not a bug: an allowed drop must keep working, or the fix refuses every drag-out.
    const { handled, setComponentLayout } = dragOutTo(CONTAINER_ID);

    expect(handled).toBe(true);
    expect(setComponentLayout).toHaveBeenCalled();
  });
});
