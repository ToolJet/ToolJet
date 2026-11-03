/**
 * A sub-canvas keeps its grid while one of its own children is dragged.
 *
 * Drag start adds `show-grid` to every `.real-canvas` imperatively (gridUtils showGridLines), then
 * marks the dragged widget in the store. That makes the dragged widget's parent canvas re-render with
 * `is-child-being-dragged`, and React rewrites its className — so the grid has to be part of the
 * canvas's own className, or the canvas the widget is dragged out of is the one that loses it.
 */
import { act } from '@testing-library/react';
import { binding, componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const CONTAINER_ID = 'container1';
const CHILD_ID = 'button1';

const widget = createWidgetHarness({
  componentType: 'Container',
  handle: 'container1',
  id: CONTAINER_ID,
  defaultProperties: {
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showHeader: binding('{{false}}'),
  },
  capabilities: { dnd: true },
  widgetHeight: 300,
  widgetWidth: 400,
});

// The child is only ever a store entry here: kept off the desktop layout so the Container doesn't
// mount it (an edit-mode child pulls in ConfigHandle, which Jest can't load). The grid depends only on
// the container-children mapping, which still lists it.
const child = () => {
  const definition = componentDefinition(CHILD_ID, 'button1', 'Button', { text: binding('Button') });
  definition.component.parent = CONTAINER_ID;
  definition.component.definition.others = { showOnDesktop: binding('{{false}}'), showOnMobile: binding('{{false}}') };
  return { [CHILD_ID]: definition };
};

const containerCanvas = () => document.getElementById(`canvas-${CONTAINER_ID}`);

describe('sub-canvas grid while its child is dragged', () => {
  beforeEach(() => widget.setup());
  afterEach(() => {
    act(() => store().setDraggingComponentId(null));
    widget.teardown();
  });

  it('[SubCanvas-GRID-001] shows the grid on the canvas a widget is being dragged out of', () => {
    widget.render({ extraComponents: child() });
    expect(containerCanvas()).not.toBeNull();

    act(() => store().setDraggingComponentId(CHILD_ID));

    expect(containerCanvas()).toHaveClass('is-child-being-dragged');
    expect(containerCanvas()).toHaveClass('show-grid');
  });

  it('[SubCanvas-GRID-002] drops the grid once the drag ends', () => {
    widget.render({ extraComponents: child() });
    act(() => store().setDraggingComponentId(CHILD_ID));

    act(() => store().setDraggingComponentId(null));

    expect(containerCanvas()).not.toHaveClass('show-grid');
  });
});
