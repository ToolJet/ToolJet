import React from 'react';
import { renderHook, act } from '@testing-library/react';

jest.mock('@/_stores/gridStore', () => {
  const state = {
    moveableRef: null,
    actions: { setVirtualTarget: jest.fn() },
  };
  const useGridStore = (selector) => selector(state);
  useGridStore.getState = () => state;
  return { useGridStore };
});

jest.mock('@/AppBuilder/_stores/store', () => {
  const state = { selectedComponents: [] };
  const useStore = (selector) => selector(state);
  useStore.getState = () => state;
  return { __esModule: true, default: useStore };
});

jest.mock('@/AppBuilder/AppCanvas/Grid/gridUtils', () => ({
  clearActiveTargetClassNamesAfterSnapping: jest.fn(),
}));

import { useDropVirtualMoveableGhost } from '../useDropVirtualMoveableGhost';

const mockRect = (element, { left, top, width = 0, height = 0 }) => {
  element.getBoundingClientRect = () => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  });
};

const getGhostTranslate = () => {
  const ghost = document.getElementById('moveable-virtual-ghost-element');
  const match = ghost.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
};

describe('useDropVirtualMoveableGhost - initial ghost position', () => {
  let realCanvas;
  let subCanvas;

  beforeEach(() => {
    document.body.innerHTML = '';

    // Main canvas, horizontally scrolled to the rightmost edge:
    // its viewport-relative left is negative by the scroll amount.
    realCanvas = document.createElement('div');
    realCanvas.id = 'real-canvas';
    mockRect(realCanvas, { left: -1500, top: 100, width: 3000, height: 2000 });
    document.body.appendChild(realCanvas);

    // A subcontainer canvas (e.g. inside a modal) visible in the viewport.
    subCanvas = document.createElement('div');
    subCanvas.id = 'canvas-sub-1';
    mockRect(subCanvas, { left: 300, top: 250, width: 400, height: 300 });
    document.body.appendChild(subCanvas);
  });

  const componentSize = { width: 100, height: 40 };
  const mousePosition = { x: 400, y: 300 };
  // The ghost lives inside #real-canvas, so its translate must always be
  // expressed in main-canvas content coordinates:
  const expected = { x: mousePosition.x - -1500, y: mousePosition.y - 100 };

  it('positions the ghost in main-canvas coordinates when activated from the main canvas', () => {
    const { result } = renderHook(() => useDropVirtualMoveableGhost());

    act(() => {
      result.current.activateMoveableGhost(componentSize, mousePosition, { current: realCanvas });
    });

    expect(getGhostTranslate()).toEqual(expected);
  });

  it('positions the ghost in main-canvas coordinates when a subcontainer activates it first', () => {
    const { result } = renderHook(() => useDropVirtualMoveableGhost());

    act(() => {
      result.current.activateMoveableGhost(componentSize, mousePosition, { current: subCanvas });
    });

    // Bug: position was computed relative to the subcontainer's rect while the
    // ghost element is appended to #real-canvas, so the ghost ended up offset
    // by (subRect - realCanvasRect) for the whole drag.
    expect(getGhostTranslate()).toEqual(expected);
  });

  it('appends the ghost element to the main canvas regardless of activating container', () => {
    const { result } = renderHook(() => useDropVirtualMoveableGhost());

    act(() => {
      result.current.activateMoveableGhost(componentSize, mousePosition, { current: subCanvas });
    });

    const ghost = document.getElementById('moveable-virtual-ghost-element');
    expect(ghost.parentElement).toBe(realCanvas);
  });
});
