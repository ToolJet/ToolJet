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

const button = (id, parent) => {
  const definition = componentDefinition(id, id, 'Button');
  if (parent) definition.component.parent = parent;
  return definition;
};

// Page layout: two buttons on the main canvas, a container (box1) whose child is scrolled out of
// view but still overlaps the main-canvas lasso area, and a button in the page header slot.
const RECTS = {
  canvas: { left: 0, top: 0, width: 1000, height: 1000 },
  mainA: { left: 100, top: 100, width: 100, height: 40 },
  mainB: { left: 300, top: 100, width: 100, height: 40 },
  box1: { left: 600, top: 100, width: 300, height: 100 },
  hiddenChild: { left: 350, top: 160, width: 80, height: 30 },
  header: { left: 0, top: 1200, width: 1000, height: 100 },
  header1: { left: 100, top: 1220, width: 100, height: 40 },
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

// The widget boxes WidgetWrapper renders: `.moveable-box[widgetid]` inside each canvas.
const CanvasTargets = () => (
  <div className="canvas-container">
    <div component-id="canvas" data-parentid="canvas" className="real-canvas" data-rect="canvas" data-testid="main">
      <div className="moveable-box" widgetid="mainA" data-rect="mainA" />
      <div className="moveable-box" widgetid="mainB" data-rect="mainB" />
      <div className="moveable-box" widgetid="box1" data-rect="box1">
        <div className="real-canvas sub-canvas" data-parentid="box1" component-id="box1">
          <div className="moveable-box" widgetid="hiddenChild" data-rect="hiddenChild" />
        </div>
      </div>
    </div>
    <div component-id="canvas-header" data-rect="header" data-testid="header">
      <div className="moveable-box" widgetid="header1" data-rect="header1" />
    </div>
  </div>
);

const MAIN_LASSO = { start: 'main', from: [50, 50], to: [450, 200] }; // covers mainA, mainB, hiddenChild
const HEADER_LASSO = { start: 'header', from: [50, 1210], to: [450, 1290] }; // covers header1

describe('EditorSelecto marquee end', () => {
  let session;
  let root;
  let restoreRect;

  beforeEach(() => {
    const original = Element.prototype.getBoundingClientRect;
    // jsdom has no layout; give the canvases and widget boxes geometry for Selecto's hit test.
    Element.prototype.getBoundingClientRect = function () {
      const key = this.getAttribute?.('data-rect');
      return key ? rectOf(RECTS[key]) : original.call(this);
    };
    restoreRect = () => (Element.prototype.getBoundingClientRect = original);

    session = new AppBuilderTestSession({ scenario });
    seedApp({
      mainA: button('mainA'),
      mainB: button('mainB'),
      box1: button('box1'),
      hiddenChild: button('hiddenChild', 'box1'),
      header1: button('header1', 'canvas-header'),
    });
    root = session.render(
      <>
        <EditorSelecto />
        <CanvasTargets />
      </>
    );
  });

  afterEach(() => restoreRect());

  const lasso = ({ start, from, to }, { shiftKey = false } = {}) => {
    const [x0, y0] = from;
    const [x1, y1] = to;
    // Selecto switches to add-mode from the Shift keydown itself, not the mouse event's shiftKey.
    if (shiftKey) fireEvent.keyDown(window, { key: 'Shift', code: 'ShiftLeft', keyCode: 16, shiftKey: true });
    fireEvent.mouseDown(root.getByTestId(start), { clientX: x0, clientY: y0, button: 0, buttons: 1, shiftKey });
    for (const t of [0.33, 0.66, 1]) {
      fireEvent.mouseMove(window, { clientX: x0 + (x1 - x0) * t, clientY: y0 + (y1 - y0) * t, buttons: 1, shiftKey });
    }
    fireEvent.mouseUp(window, { clientX: x1, clientY: y1, shiftKey });
    if (shiftKey) fireEvent.keyUp(window, { key: 'Shift', code: 'ShiftLeft', keyCode: 16 });
  };

  const select = (ids) => session.store.act('setSelectedComponents', ids);
  const selected = () => [...session.store.read((state) => state.selectedComponents)].sort();

  test('a plain lasso over two widgets replaces a selection made in another canvas', async () => {
    await select(['header1']);

    lasso(MAIN_LASSO);

    expect(selected()).toEqual(['mainA', 'mainB']);
  });

  test('a Shift lasso over two widgets keeps a selection made in another canvas', async () => {
    await select(['header1']);

    lasso(MAIN_LASSO, { shiftKey: true });

    expect(selected()).toEqual(['header1', 'mainA', 'mainB']);
  });

  test('a lasso on the main canvas skips a container child scrolled out of view under it', async () => {
    // Selecto hit-tests bounding rects and ignores the container's overflow clipping.
    lasso(MAIN_LASSO);

    expect(selected()).not.toContain('hiddenChild');
    expect(selected()).toEqual(['mainA', 'mainB']);
  });

  test('re-lassoing the same widgets after the selection changed elsewhere selects them again', async () => {
    lasso(MAIN_LASSO);
    await select(['header1']); // e.g. a click on another component, which Selecto never sees

    lasso(MAIN_LASSO);

    expect(selected()).toEqual(['mainA', 'mainB']);
  });

  test('a Shift re-lasso adds widgets Selecto still remembers from its last lasso', async () => {
    lasso(MAIN_LASSO);
    await select(['header1']);

    lasso(MAIN_LASSO, { shiftKey: true });

    expect(selected()).toEqual(['header1', 'mainA', 'mainB']);
  });

  test('a lasso started in the page header selects the header widgets only', async () => {
    await select(['mainA']);

    lasso(HEADER_LASSO);

    expect(selected()).toEqual(['header1']);
  });
});
