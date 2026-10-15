import { renderHook } from '@testing-library/react';
import { useDropVirtualMoveableGhost } from '../useDropVirtualMoveableGhost';

// The drag ghost is always appended to the main canvas (#real-canvas), so its
// translate must be measured from the main canvas. When a new-component drag
// starts and the right sidebar collapses, the canvas shifts under a stationary
// cursor; if that cursor now sits over a sub-canvas, the sub-canvas hover is the
// first to activate the ghost. Measuring from the sub-canvas there puts the ghost
// (and the dropped widget) far from the cursor.
describe('useDropVirtualMoveableGhost - first activation from a sub-canvas', () => {
  const setRect = (el, left, top, width, height) => {
    el.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height });
  };

  let mainCanvas;
  let subCanvas;

  beforeEach(() => {
    const editor = document.createElement('div');
    editor.id = 'main-editor-canvas';
    mainCanvas = document.createElement('div');
    mainCanvas.id = 'real-canvas';
    subCanvas = document.createElement('div');
    subCanvas.id = 'canvas-form-1';
    mainCanvas.appendChild(subCanvas);
    editor.appendChild(mainCanvas);
    document.body.appendChild(editor);

    // Main canvas scrolled down: its top is above the viewport.
    setRect(mainCanvas, 100, -800, 1200, 3000);
    // Form sits at the right end of the main canvas, under the cursor.
    setRect(subCanvas, 900, 150, 400, 500);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('places the ghost under the cursor relative to the main canvas it is attached to', () => {
    const { result } = renderHook(() => useDropVirtualMoveableGhost());
    const cursor = { x: 1000, y: 300 };

    result.current.activateMoveableGhost({ width: 200, height: 40 }, cursor, { current: subCanvas });

    const ghost = document.getElementById('moveable-virtual-ghost-element');
    expect(ghost.parentElement).toBe(mainCanvas);
    expect(ghost.style.transform).toBe('translate(900px, 1100px)');
  });
});
