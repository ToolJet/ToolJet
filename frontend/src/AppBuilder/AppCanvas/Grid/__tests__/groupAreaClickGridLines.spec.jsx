import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import Grid from '../Grid';

const scenario = defineAppBuilderScenario({
  id: 'grid-group-area-click',
  name: 'Grid group selection click',
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

const button = (id) => {
  const definition = componentDefinition(id, id, 'Button');
  definition.component.definition.others = { showOnDesktop: { value: '{{true}}' } };
  return definition;
};

const RECTS = {
  canvas: { left: 0, top: 0, width: 1000, height: 1000 },
  btnA: { left: 100, top: 100, width: 100, height: 40 },
  btnB: { left: 300, top: 200, width: 100, height: 40 },
};

const rectOf = ({ left, top, width, height }) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
  toJSON() {},
});

// The widget boxes WidgetWrapper renders and Grid's Moveable targets (`.ele-<id>`).
const Canvas = () => (
  <div id="real-canvas" className="real-canvas" data-rect="canvas">
    <div id="btnA" widgetid="btnA" className="moveable-box target ele-btnA" data-rect="btnA" />
    <div id="btnB" widgetid="btnB" className="moveable-box target ele-btnB" data-rect="btnB" />
  </div>
);

describe('Grid group selection', () => {
  let session;
  let root;
  let restoreRect;

  beforeEach(async () => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const key = this.getAttribute?.('data-rect');
      return key ? rectOf(RECTS[key]) : original.call(this);
    };
    // jsdom has no hit-testing; Moveable asks what is under the pointer on mouseup.
    document.elementFromPoint = () => document.querySelector('.moveable-area');
    restoreRect = () => {
      Element.prototype.getBoundingClientRect = original;
      delete document.elementFromPoint;
    };

    session = new AppBuilderTestSession({ scenario });
    const store = seedApp({
      btnA: button('btnA'),
      btnB: button('btnB'),
    });
    store().setEditorLoading(false, 'canvas');
    store().setCurrentMode('edit', 'canvas');
    await session.store.act('setSelectedComponents', ['btnA', 'btnB']);

    root = session.render(
      <>
        <Canvas />
        <Grid gridWidth={1000 / 43} currentLayout="desktop" mainCanvasWidth={1000} />
      </>
    );
    await waitFor(() => expect(document.querySelector('.moveable-area')).not.toBeNull());
  }, 30000); // the first mount loads Grid's module graph cold

  afterEach(() => restoreRect());

  const canvasShowsGrid = () => root.container.querySelector('#real-canvas').classList.contains('show-grid');

  test('a click inside the group area without moving does not turn the grid lines on', () => {
    // In the editor the mouseup of that click clears the selection and unmounts the group before
    // its drag-end cleanup runs, so nothing may be switched on at mousedown.
    const area = document.querySelector('.moveable-area');

    fireEvent.mouseDown(area, { clientX: 250, clientY: 170, button: 0, buttons: 1 });
    expect(canvasShowsGrid()).toBe(false);

    fireEvent.mouseUp(window, { clientX: 250, clientY: 170 });
    expect(canvasShowsGrid()).toBe(false);
  });

  test('dragging the group turns the grid lines on once it moves', () => {
    const area = document.querySelector('.moveable-area');

    fireEvent.mouseDown(area, { clientX: 250, clientY: 170, button: 0, buttons: 1 });
    expect(canvasShowsGrid()).toBe(false);

    fireEvent.mouseMove(window, { clientX: 280, clientY: 190, buttons: 1 });

    expect(canvasShowsGrid()).toBe(true);
  });
});
