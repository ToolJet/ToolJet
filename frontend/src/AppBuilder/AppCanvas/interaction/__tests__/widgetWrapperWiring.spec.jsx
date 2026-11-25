/**
 * WidgetWrapper with the canvas interaction flag off (today's Moveable path) and on (the engine's frame, hover and
 * dimming). The flag is read once per page load; each test resets it before rendering.
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import WidgetWrapper from '@/AppBuilder/AppCanvas/WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import useTransientStore from '@/AppBuilder/_stores/transientStore';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { __resetCanvasInteractionFlagForTests } from '../flags';

const scenario = defineAppBuilderScenario({
  id: 'canvas-interaction-widget-wrapper',
  name: 'WidgetWrapper under the canvas interaction flag',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true },
});

// A fractional column width, as on most screens: 1000px over 43 columns.
const GRID_WIDTH = 1000 / 43;

const setFlag = (on) => {
  if (on) window.localStorage.setItem('tj-canvas-interaction', 'v2');
  else window.localStorage.removeItem('tj-canvas-interaction');
  __resetCanvasInteractionFlagForTests();
};

describe('WidgetWrapper and the canvas interaction flag', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
    const button = componentDefinition('btn1', 'button1', 'Button');
    button.layouts = { desktop: { top: 30, left: 3, width: 5, height: 40 } };
    seedApp({ btn1: button });
    const state = useStore.getState();
    state.setEditorLoading(false, 'canvas');
    state.setCurrentMode('edit', 'canvas');
  });

  afterEach(() => setFlag(false));

  const renderWidget = () =>
    session.render(
      <WidgetWrapper
        id="btn1"
        moduleId="canvas"
        mode="edit"
        currentLayout="desktop"
        gridWidth={GRID_WIDTH}
        inCanvas
        onOptionChange={() => {}}
        onOptionsChange={() => {}}
      />
    );
  const box = () => document.getElementById('btn1');

  test('off: no engine frame, hover tracked by the wrapper, dragged widget hidden, fractional columns', async () => {
    setFlag(false);
    renderWidget();
    await waitFor(() => expect(box()).toBeInTheDocument());
    await session.store.act('setSelectedComponents', ['btn1']);

    expect(box().querySelector('.tj-frame')).toBeNull();
    expect(box().style.width).toBe(`${GRID_WIDTH * 5}px`);
    expect(box().style.transform).toBe(`translate(${3 * GRID_WIDTH}px, 30px)`);

    fireEvent.mouseEnter(box());
    expect(useTransientStore.getState().hoveredComponentForGrid).toBe('btn1');

    await session.store.act('setDraggingComponentId', 'btn1');
    expect(box()).toHaveClass('opacity-0', 'pointer-events-none');
    expect(box()).not.toHaveClass('tj-drag-source');
  });

  test('on: the selected widget draws its frame, the engine owns hover, a moved group member is dimmed', async () => {
    setFlag(true);
    renderWidget();
    await waitFor(() => expect(box()).toBeInTheDocument());
    expect(box().querySelector('.tj-frame')).toBeNull();

    await session.store.act('setSelectedComponents', ['btn1']);
    await waitFor(() => expect(box().querySelector('.tj-frame.is-selected')).not.toBeNull());
    expect(box().querySelectorAll('[data-tj-handle]')).toHaveLength(8);
    // Whole-pixel column edges: round(3 * 23.26) = 70, round(8 * 23.26) = 186.
    expect(box().style.transform).toBe('translate(70px, 30px)');
    expect(box().style.width).toBe('116px');

    useTransientStore.getState().setHoveredComponentForGrid('');
    fireEvent.mouseEnter(box());
    expect(useTransientStore.getState().hoveredComponentForGrid).toBe('');

    await session.store.act('setIsGroupDragging', true);
    expect(box()).toHaveClass('tj-drag-source');
    expect(box()).not.toHaveClass('opacity-0');
  });
});
