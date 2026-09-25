import React from 'react';
import { fireEvent } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import EditorSelecto from '../../Selecto';

const scenario = defineAppBuilderScenario({
  id: 'editor-selecto-marquee',
  name: 'Editor marquee selection',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {},
});

// Two buttons on the main canvas and one in the page header.
const button = (id, parent) => {
  const definition = componentDefinition(id, id, 'Button');
  if (parent) definition.component.parent = parent;
  return definition;
};

const RECTS = {
  canvas: { left: 0, top: 0, width: 1000, height: 1000 },
  mainA: { left: 100, top: 100, width: 100, height: 40 },
  mainB: { left: 300, top: 100, width: 100, height: 40 },
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

// The widget boxes WidgetWrapper renders: `.moveable-box[widgetid]` inside the canvas drag container.
const CanvasTargets = () => (
  <div className="canvas-container" data-testid="canvas-container">
    <div component-id="canvas" data-parentid="canvas" className="real-canvas" data-testid="main-canvas">
      <div className="moveable-box" widgetid="mainA" data-rect="mainA" />
      <div className="moveable-box" widgetid="mainB" data-rect="mainB" />
    </div>
  </div>
);

describe('EditorSelecto marquee end', () => {
  let session;
  let restoreRect;

  beforeEach(() => {
    const original = Element.prototype.getBoundingClientRect;
    // jsdom has no layout; give the canvas and widget boxes real geometry for Selecto's hit test.
    Element.prototype.getBoundingClientRect = function () {
      const key = this.getAttribute?.('data-rect') || (this.getAttribute?.('component-id') === 'canvas' && 'canvas');
      return key ? rectOf(RECTS[key]) : original.call(this);
    };
    restoreRect = () => (Element.prototype.getBoundingClientRect = original);

    session = new AppBuilderTestSession({ scenario });
    seedApp({ mainA: button('mainA'), mainB: button('mainB'), header1: button('header1', 'canvas-header') });
  });

  afterEach(() => restoreRect());

  // Lasso from (50,50) to (450,200) on the main canvas, covering mainA and mainB.
  const lassoOverBothMainButtons = async ({ shiftKey }) => {
    const root = session.render(
      <>
        <EditorSelecto />
        <CanvasTargets />
      </>
    );
    const start = root.getByTestId('main-canvas');
    fireEvent.mouseDown(start, { clientX: 50, clientY: 50, button: 0, buttons: 1, shiftKey });
    for (const [x, y] of [
      [150, 100],
      [300, 150],
      [450, 200],
    ]) {
      fireEvent.mouseMove(window, { clientX: x, clientY: y, buttons: 1, shiftKey });
    }
    fireEvent.mouseUp(window, { clientX: 450, clientY: 200, shiftKey });
  };

  const selected = () => session.store.read((state) => state.selectedComponents);

  test('a plain lasso over two widgets replaces a selection made in another canvas', async () => {
    await session.store.act('setSelectedComponents', ['header1']);

    await lassoOverBothMainButtons({ shiftKey: false });

    expect([...selected()].sort()).toEqual(['mainA', 'mainB']);
  });

  test('a Shift lasso over two widgets keeps a selection made in another canvas', async () => {
    await session.store.act('setSelectedComponents', ['header1']);

    await lassoOverBothMainButtons({ shiftKey: true });

    expect([...selected()].sort()).toEqual(['header1', 'mainA', 'mainB']);
  });
});
