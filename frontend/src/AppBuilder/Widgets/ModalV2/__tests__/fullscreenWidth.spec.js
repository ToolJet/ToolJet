import { renderHook } from '@testing-library/react';
import { useModalEventSideEffects } from '../hooks/useResizeSideEffects';

// A fullscreen modal's slot grid must match the space inside the canvas, not the canvas box with its padding and
// scrollbar, or a full-width child runs past the modal's right edge.
beforeAll(() => {
  global.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
  };
});

test('[ModalV2-SIZE-003] a fullscreen modal takes the canvas content width', () => {
  // Break this catches: using the canvas offsetWidth, which includes its 8px side padding (editor) and a classic
  // scrollbar (viewer), so the grid is wider than the modal.
  const canvas = document.createElement('div');
  canvas.className = 'page-container canvas-container';
  canvas.style.paddingLeft = '8px';
  canvas.style.paddingRight = '8px';
  Object.defineProperty(canvas, 'offsetWidth', { value: 1334 });
  Object.defineProperty(canvas, 'clientWidth', { value: 1324 });
  document.body.appendChild(canvas);
  try {
    // The hook reads the modal ref in an effect; set it during render, as the mounted modal would.
    const { result: rerendered } = renderHook(() => {
      const hook = useModalEventSideEffects({
        showModal: true,
        size: 'fullscreen',
        id: 'm1',
        onShowSideEffects: () => {},
      });
      hook.parentRef.current = hook.parentRef.current ?? document.createElement('div');
      return hook;
    });

    expect(rerendered.current.modalWidth).toBe(1324 - 16);
  } finally {
    canvas.remove();
  }
});

test('[ModalV2-SIZE-003] a border the editor reserves on the canvas still counts toward the modal width', () => {
  // Break this catches: taking clientWidth alone, which also drops the canvas's 300px right border that the editor
  // reserves while a modal is open, so the grid ends far short of the modal body.
  const canvas = document.createElement('div');
  canvas.className = 'page-container canvas-container';
  canvas.style.padding = '0 8px';
  canvas.style.borderRight = '300px solid transparent';
  Object.defineProperty(canvas, 'offsetWidth', { value: 1371 });
  Object.defineProperty(canvas, 'clientWidth', { value: 1071 });
  document.body.appendChild(canvas);
  try {
    const { result } = renderHook(() => {
      const hook = useModalEventSideEffects({
        showModal: true,
        size: 'fullscreen',
        id: 'm1',
        onShowSideEffects: () => {},
      });
      hook.parentRef.current = hook.parentRef.current ?? document.createElement('div');
      return hook;
    });

    expect(result.current.modalWidth).toBe(1371 - 16);
  } finally {
    canvas.remove();
  }
});
