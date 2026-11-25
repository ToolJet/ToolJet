/**
 * The canvas engine's pointer state machine against a real store, in jsdom. jsdom has no layout or hit-testing,
 * so the canvas and the component report fixed rects (`data-rect`) and `elementsFromPoint` answers with the page
 * canvas, as in Grid/__tests__/groupAreaClickGridLines.spec.jsx.
 */
import useStore from '@/AppBuilder/_stores/store';
import useTransientStore from '@/AppBuilder/_stores/transientStore';
import { useGridStore } from '@/_stores/gridStore';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { CanvasEngine } from '../engine';

const COLUMN = 20; // px per column of the page canvas
const CANVAS = { left: 100, top: 50 }; // the page canvas's content edge, in the viewport
const LAYOUT = { top: 30, left: 2, width: 5, height: 40 }; // btnA's saved layout

const RECTS = {
  root: { left: 0, top: 0, width: 1000, height: 1000 },
  canvas: { ...CANVAS, width: 43 * COLUMN, height: 800 },
  btnA: {
    left: CANVAS.left + LAYOUT.left * COLUMN,
    top: CANVAS.top + LAYOUT.top,
    width: LAYOUT.width * COLUMN,
    height: LAYOUT.height,
  },
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

const pointer = (type, target, { x, y, shiftKey = false }) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, shiftKey });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  target.dispatchEvent(event);
  return event;
};

// The engine draws its feedback on the next animation frame.
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

// Inside btnA, 10px from its top-left corner.
const PRESS = { x: RECTS.btnA.left + 10, y: RECTS.btnA.top + 10 };

describe('CanvasEngine', () => {
  let root;
  let canvas;
  let widget;
  let engine;
  let setComponentLayout;
  let restore;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="main-editor-canvas" data-rect="root">
        <div id="real-canvas" class="real-canvas" data-parentId="canvas" data-rect="canvas">
          <div class="rm-container" component-id="canvas">
            <div id="btnA" widgetid="btnA" component-type="Button" class="moveable-box target ele-btnA" data-rect="btnA"></div>
          </div>
        </div>
      </div>`;
    root = document.getElementById('main-editor-canvas');
    canvas = document.getElementById('real-canvas');
    widget = document.getElementById('btnA');

    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const key = this.getAttribute?.('data-rect');
      return key ? rectOf(RECTS[key]) : original.call(this);
    };
    document.elementsFromPoint = () => [canvas.firstElementChild, canvas, root];
    document.elementFromPoint = () => widget;
    restore = () => {
      Element.prototype.getBoundingClientRect = original;
      delete document.elementsFromPoint;
      delete document.elementFromPoint;
    };

    const button = componentDefinition('btnA', 'button1', 'Button');
    button.layouts = { desktop: { ...LAYOUT } };
    seedApp({ btnA: button });
    useStore.getState().setCurrentMode('edit', 'canvas');
    useStore.getState().setSelectedComponents([]);
    // Saving is the store's business; here only what the engine asks it to save matters.
    setComponentLayout = jest.fn();
    useStore.setState({ setComponentLayout });
    useGridStore.getState().actions.setSubContainerWidths('canvas', COLUMN);
    useTransientStore.getState().setHoveredComponentForGrid('');

    engine = new CanvasEngine(root, { moduleId: 'canvas' });
    engine.attach();
  });

  afterEach(() => {
    engine.detach();
    restore();
    document.body.innerHTML = '';
  });

  it('a press-move-release on a component saves one layout, snapped to columns and rows', async () => {
    pointer('pointerdown', widget, PRESS);
    // 47px right, 23px down: the box's corner lands 87px / 53px from the canvas edge.
    pointer('pointermove', window, { x: PRESS.x + 20, y: PRESS.y + 10 });
    pointer('pointermove', window, { x: PRESS.x + 47, y: PRESS.y + 23 });
    expect(useStore.getState().draggingComponentId).toBe('btnA');
    await nextFrame();
    expect(canvas.querySelector('.tj-drop-ghost')).not.toBeNull();
    pointer('pointerup', window, { x: PRESS.x + 47, y: PRESS.y + 23 });

    expect(setComponentLayout).toHaveBeenCalledTimes(1);
    expect(setComponentLayout).toHaveBeenCalledWith(
      // 87 / 20 = 4.35 → column 4; 30 + 23 = 53 → row 50. Width and height kept.
      { btnA: { left: 4, top: 50, width: 5, height: 40 } },
      null,
      'canvas',
      { updateParent: false }
    );
    expect(useStore.getState().draggingComponentId).toBeNull();
    expect(useStore.getState().selectedComponents).toEqual(['btnA']);
  });

  it('a press that moves 3px or less saves nothing and selects the component', () => {
    pointer('pointerdown', widget, PRESS);
    pointer('pointermove', window, { x: PRESS.x + 3, y: PRESS.y - 3 });
    pointer('pointerup', window, { x: PRESS.x + 3, y: PRESS.y - 3 });

    expect(setComponentLayout).not.toHaveBeenCalled();
    expect(useStore.getState().draggingComponentId).toBeFalsy();
    expect(useStore.getState().selectedComponents).toEqual(['btnA']);
    expect(useStore.getState().isRightSidebarOpen).toBe(true);
  });

  it('Escape cancels a move: nothing is saved, the ghost goes, the release does nothing', async () => {
    pointer('pointerdown', widget, PRESS);
    pointer('pointermove', window, { x: PRESS.x + 60, y: PRESS.y + 40 });
    await nextFrame();
    expect(canvas.querySelector('.tj-drop-ghost')).not.toBeNull();

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(canvas.querySelector('.tj-drop-ghost')).toBeNull();
    expect(useStore.getState().draggingComponentId).toBeNull();

    pointer('pointerup', window, { x: PRESS.x + 60, y: PRESS.y + 40 });
    expect(setComponentLayout).not.toHaveBeenCalled();
  });

  describe('while the editor previews in place', () => {
    beforeEach(() => {
      useStore.getState().setPreviewInEditor(true, 'canvas');
    });

    it('does not hover, select, move or open anything', async () => {
      pointer('pointerover', widget, PRESS);
      expect(useTransientStore.getState().hoveredComponentForGrid).toBe('');

      const down = pointer('pointerdown', widget, PRESS);
      pointer('pointermove', window, { x: PRESS.x + 60, y: PRESS.y + 40 });
      await nextFrame();
      pointer('pointerup', window, { x: PRESS.x + 60, y: PRESS.y + 40 });

      expect(down.defaultPrevented).toBe(false);
      expect(setComponentLayout).not.toHaveBeenCalled();
      expect(useStore.getState().selectedComponents).toEqual([]);
      expect(useStore.getState().draggingComponentId).toBeFalsy();
      expect(document.querySelector('.tj-drop-ghost, .tj-marquee')).toBeNull();
    });

    it('draws no marquee from the canvas and ignores Escape', async () => {
      pointer('pointerdown', canvas.firstElementChild, { x: 900, y: 600 });
      pointer('pointermove', window, { x: 800, y: 500 });
      await nextFrame();
      expect(document.querySelector('.tj-marquee')).toBeNull();

      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      window.dispatchEvent(escape);
      expect(escape.defaultPrevented).toBe(false);
    });

    it('shows no drop preview for a component dragged in from the panel', () => {
      engine.updateInsert({ x: 300, y: 300 }, { componentType: 'Button', component: { defaultSize: { width: 5 } } });
      expect(document.querySelector('.tj-drop-ghost')).toBeNull();
      expect(useGridStore.getState().currentDragCanvasId).toBeNull();
    });

    it('hovers again once the preview ends (control)', () => {
      useStore.getState().setPreviewInEditor(false, 'canvas');
      pointer('pointerover', widget, PRESS);
      expect(useTransientStore.getState().hoveredComponentForGrid).toBe('btnA');
    });
  });
});
