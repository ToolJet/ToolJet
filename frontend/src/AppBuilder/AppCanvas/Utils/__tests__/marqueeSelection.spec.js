/**
 * Marquee selection scoping — the decision logic behind EditorSelecto (Selecto.jsx).
 *
 * The drag itself belongs to Cypress; these cover the helpers behind it. Each case is a
 * behaviour that was wrong at some point in PR #17211:
 *   - a marquee leaked into widgets scrolled out of view in another canvas
 *   - a marquee in the page header/footer selected nothing
 *   - a marquee over a nested container selected nothing
 *   - a shift-drag dropped a selection made in another canvas
 */
import { resolveMarqueeCanvasId, isInMarqueeCanvas, mergeMarqueeSelection } from '../marqueeSelection';

/** querySelector that throws on a miss, so a typo'd selector fails loudly instead of yielding null. */
const queryOrThrow = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`No element matched ${selector}`);
  return element;
};

/** Mirrors the editor's DOM: an optional slot wrapper, .real-canvas[data-parentId], .rm-container[component-id]. */
const canvasElement = ({ parentId, componentId, slotId }) => {
  document.body.innerHTML = `
    ${slotId ? `<div component-id="${slotId}">` : ''}
      <div class="real-canvas" data-parentId="${parentId}">
        <div class="container-fluid rm-container p-0" component-id="${componentId}"></div>
      </div>
    ${slotId ? '</div>' : ''}`;
  return queryOrThrow(`.rm-container[component-id="${componentId}"]`);
};

describe('resolveMarqueeCanvasId', () => {
  test('the main canvas resolves to null, since its widgets have no parent', () => {
    expect(resolveMarqueeCanvasId(canvasElement({ parentId: 'canvas', componentId: 'canvas' }))).toBeNull();
  });

  test('a subcontainer resolves to its own id', () => {
    expect(resolveMarqueeCanvasId(canvasElement({ parentId: 'sub-1', componentId: 'sub-1' }))).toBe('sub-1');
  });

  test.each([
    ['header', 'canvas-header'],
    ['footer', 'canvas-footer'],
  ])('the page %s slot resolves to its own id, not the main canvas', (_label, slotId) => {
    expect(resolveMarqueeCanvasId(canvasElement({ parentId: slotId, componentId: slotId }))).toBe(slotId);
  });

  test('a drag in the header slot padding, outside the inner .real-canvas, still resolves to the header', () => {
    document.body.innerHTML = `<div component-id="canvas-header" id="slot"></div>`;
    expect(resolveMarqueeCanvasId(queryOrThrow('#slot'))).toBe('canvas-header');
  });

  test('an element outside any canvas resolves to null rather than throwing', () => {
    document.body.innerHTML = `<div id="stray"></div>`;
    expect(resolveMarqueeCanvasId(queryOrThrow('#stray'))).toBeNull();
  });
});

describe('isInMarqueeCanvas', () => {
  describe('marquee on the main canvas', () => {
    test.each([null, undefined, 'canvas'])('keeps root-level widgets (startCanvasId: %s)', (startCanvasId) => {
      expect(isInMarqueeCanvas(undefined, startCanvasId)).toBe(true);
    });

    test('excludes a widget nested in a subcontainer', () => {
      // The bug this PR opened with: react-selecto ignores overflow clipping, so a widget
      // scrolled out of view inside a container still sits under the selection box.
      expect(isInMarqueeCanvas('sub-1', null)).toBe(false);
    });
  });

  describe('marquee inside a subcontainer', () => {
    test("keeps that subcontainer's own children", () => {
      expect(isInMarqueeCanvas('sub-1', 'sub-1')).toBe(true);
    });

    test('excludes the container being drawn inside, whose parent is one level up', () => {
      expect(isInMarqueeCanvas(undefined, 'sub-1')).toBe(false);
    });

    test('keeps a nested container as one unit rather than reaching into its children', () => {
      // Widgets are identified here by their parent, since that is what the scoping reads.
      // A marquee drawn in sub-1, over a container sub-2 that holds widgets of its own.
      const nestedContainer = { parent: 'sub-1' }; // sub-2 itself, a child of sub-1
      const itsChildren = { parent: 'sub-2' }; // the widgets inside sub-2

      expect(isInMarqueeCanvas(nestedContainer.parent, 'sub-1')).toBe(true);
      expect(isInMarqueeCanvas(itsChildren.parent, 'sub-1')).toBe(false);
    });

    test('excludes a widget from a sibling canvas', () => {
      expect(isInMarqueeCanvas('sub-2', 'sub-1')).toBe(false);
    });
  });

  describe('marquee in the page header or footer', () => {
    test.each(['canvas-header', 'canvas-footer'])('keeps widgets parented to %s', (slotId) => {
      // These widgets carry parent: 'canvas-header' / 'canvas-footer' (componentsSlice.js:217),
      // so treating the slot as the main canvas selected nothing at all.
      expect(isInMarqueeCanvas(slotId, slotId)).toBe(true);
    });

    test('excludes main-canvas widgets while the marquee is in the header', () => {
      expect(isInMarqueeCanvas(undefined, 'canvas-header')).toBe(false);
    });
  });
});

describe('mergeMarqueeSelection', () => {
  test('a plain drag replaces the selection', () => {
    expect(mergeMarqueeSelection(['a', 'b'], ['old'], false)).toEqual(['a', 'b']);
  });

  test('a shift-drag keeps a selection made in another canvas', () => {
    // The hits are scoped, the existing selection is not — scoping the merged list
    // would silently drop anything selected outside the marquee's canvas.
    expect(mergeMarqueeSelection(['root-1'], ['c1'], true)).toEqual(['c1', 'root-1']);
  });

  test('a shift-drag over an already-selected widget does not duplicate it', () => {
    expect(mergeMarqueeSelection(['a'], ['a', 'b'], true)).toEqual(['b', 'a']);
  });

  test('a shift-drag with nothing left after scoping preserves the existing selection', () => {
    expect(mergeMarqueeSelection([], ['c1'], true)).toEqual(['c1']);
  });
});
