/**
 * The component properties panel opens only for a component (PR #19054, product decision):
 * - there is no "No component selected" page: the properties tab with nothing to show closes;
 * - an empty-canvas click closes it (other right-panel content, like the query editor, stays);
 * - picking and dragging from the palette leaves it closed; a drop opens it once the component has landed.
 */
import React from 'react';
import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { useGridStore } from '@/_stores/gridStore';
import { HotkeyProvider } from '@/AppBuilder/AppCanvas/HotkeyProvider';
import { RightSideBar } from '@/AppBuilder/RightSideBar/RightSideBar';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { DragLayer } from '@/AppBuilder/RightSideBar/ComponentManagerTab/DragLayer';
import { useCanvasDropHandler } from '@/AppBuilder/AppCanvas/Hooks/useCanvasDropHandler';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const state = () => useStore.getState();
const wrapper = ({ children }) => (
  <ModuleProvider moduleId="canvas" isModuleMode={false}>
    {children}
  </ModuleProvider>
);

const openOn = (tab) =>
  act(() => {
    state().setActiveRightSideBarTab(tab);
    state().setRightSidebarOpen(true);
  });

let canvas;
beforeEach(() => {
  controls.observers.install();
  seedApp({
    btn1: componentDefinition('btn1', 'button1', 'Button'),
    cont1: componentDefinition('cont1', 'container1', 'Container'),
  });
  canvas = document.createElement('div');
  canvas.id = 'real-canvas';
  document.body.appendChild(canvas);
});
afterEach(() => {
  canvas.remove();
  controls.restore();
});

describe('no empty properties page', () => {
  // Break this catches: the right panel shows "No component selected" instead of closing.
  test('the properties tab with no component to show closes', () => {
    openOn(RIGHT_SIDE_BAR_TAB.CONFIGURATION);

    render(wrapper({ children: <RightSideBar darkMode={false} /> }));

    expect(screen.queryByText('No component selected')).toBeNull();
    expect(state().isRightSidebarOpen).toBe(false);
  });

  // Break this catches: the guard closes the panel on a component that is there.
  test('a selected component keeps its properties open', () => {
    act(() => state().setSelectedComponents(['btn1']));
    openOn(RIGHT_SIDE_BAR_TAB.CONFIGURATION);

    render(wrapper({ children: <RightSideBar darkMode={false} /> }));

    expect(state().isRightSidebarOpen).toBe(true);
  });
});

describe('an empty-canvas click', () => {
  const clickEmptyCanvas = () => act(() => state().handleCanvasContainerMouseUp({ target: canvas }));

  // Break this catches: the panel stays on the last component after the canvas selection clears.
  test('closes the component properties', () => {
    act(() => state().setSelectedComponents(['btn1']));
    openOn(RIGHT_SIDE_BAR_TAB.CONFIGURATION);

    clickEmptyCanvas();

    expect(state().selectedComponents).toEqual([]);
    expect(state().isRightSidebarOpen).toBe(false);
  });

  test('closes the canvas header styles', () => {
    act(() => state().setCanvasHeaderSelected(true));
    expect(state().isRightSidebarOpen).toBe(true);

    clickEmptyCanvas();

    expect(state().isRightSidebarOpen).toBe(false);
  });

  // Break this catches: the click closes right-panel content that has its own subject.
  test('leaves the query editor open', () => {
    openOn(RIGHT_SIDE_BAR_TAB.QUERY);

    clickEmptyCanvas();

    expect(state().isRightSidebarOpen).toBe(true);
    expect(state().activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.QUERY);
  });

  // Break this catches: clicking the canvas backdrop around the grid leaves component properties open.
  test.each([
    ['#app-canvas-container', () => Object.assign(document.createElement('div'), { id: 'app-canvas-container' })],
    ['.canvas-content', () => Object.assign(document.createElement('div'), { className: 'canvas-content' })],
  ])('closes component properties when clicking the %s backdrop', (_label, makeEl) => {
    const backdrop = makeEl();
    document.body.appendChild(backdrop);
    try {
      act(() => state().setSelectedComponents(['btn1']));
      openOn(RIGHT_SIDE_BAR_TAB.CONFIGURATION);

      act(() => state().handleCanvasContainerMouseUp({ target: backdrop }));

      expect(state().selectedComponents).toEqual([]);
      expect(state().isRightSidebarOpen).toBe(false);
    } finally {
      backdrop.remove();
    }
  });
});

describe('pressing Escape', () => {
  const mountHotkeys = () =>
    render(
      wrapper({
        children: (
          <HotkeyProvider mode="edit" currentLayout="desktop" canvasMaxWidth={1292}>
            <div />
          </HotkeyProvider>
        ),
      })
    );

  const pressEscape = () => {
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    });
  };

  // Break this catches: Escape clears the canvas selection box but leaves the properties panel open.
  test('closes the component properties and clears selection', () => {
    mountHotkeys();
    act(() => state().setSelectedComponents(['btn1']));
    openOn(RIGHT_SIDE_BAR_TAB.CONFIGURATION);

    pressEscape();

    expect(state().selectedComponents).toEqual([]);
    expect(state().isRightSidebarOpen).toBe(false);
  });

  // Break this catches (RP-30): first Escape closes the component properties instead of leaving it open when ⋮ menu closes.
  test('keeps the properties open when the inspector header menu is open (RP-30)', () => {
    mountHotkeys();
    act(() => state().setSelectedComponents(['btn1']));
    openOn(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    const menu = document.createElement('div');
    menu.className = 'inspector-header-actions-menu';
    document.body.appendChild(menu);
    try {
      pressEscape();
      expect(state().isRightSidebarOpen).toBe(true);
    } finally {
      menu.remove();
    }
  });

  // Break this catches: Escape closes right-panel content that has its own subject.
  test('leaves the query editor open', () => {
    mountHotkeys();
    openOn(RIGHT_SIDE_BAR_TAB.QUERY);

    pressEscape();

    expect(state().isRightSidebarOpen).toBe(true);
    expect(state().activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.QUERY);
  });
});

describe('picking and dropping from the palette', () => {
  const button = componentTypes.find((c) => c.component === 'Button');
  const drop = async (componentType, canvasId) => {
    const ghost = document.createElement('div');
    useGridStore.getState().actions.setGhostDragPosition({ e: { target: ghost } });
    const { result } = renderHook(() => useCanvasDropHandler(), { wrapper });
    await act(() => result.current.handleDrop({ componentType, component: { component: componentType } }, canvasId));
  };

  // Break this catches: starting a drag opens the right panel before anything has landed.
  test('dragging a component card leaves the right panel closed', () => {
    render(
      wrapper({
        children: (
          <DndProvider backend={HTML5Backend}>
            <DragLayer index={0} component={button} />
          </DndProvider>
        ),
      })
    );

    act(() => {
      fireEvent.dragStart(document.querySelector('.draggable-box'), {
        dataTransfer: { setData() {}, getData() {}, setDragImage() {}, types: [], effectAllowed: 'all' },
      });
    });

    expect(state().isRightSidebarOpen).toBe(false);
  });

  // Break this catches: the drop no longer opens the properties of what it added.
  test('a drop opens the properties on the component that landed', async () => {
    await drop('Button', 'canvas');

    const [added] = state().selectedComponents;
    expect(state().getComponentDefinition(added)?.component?.component).toBe('Button');
    expect(state().rightPanelSubject).toEqual({ type: 'component', id: added });
    expect(state().activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    expect(state().isRightSidebarOpen).toBe(true);
  });

  // Break this catches: the panel opens before the component lands, so a refused drop leaves it open and empty.
  test('a refused drop leaves the right panel closed', async () => {
    await drop('Calendar', 'cont1');

    expect(state().isRightSidebarOpen).toBe(false);
  });
});
