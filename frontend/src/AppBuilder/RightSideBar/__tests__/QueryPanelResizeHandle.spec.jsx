import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryPanelResizeHandle } from '../QueryPanelResizeHandle';

const VIEWPORT_WIDTH = 1440;

// The handle measures the panel it sits in when a drag starts; jsdom has no layout, so the panel
// reports the width it would have on screen.
const renderHandle = (panelWidth = 496) => {
  const onResize = jest.fn();
  const onResizeEnd = jest.fn();
  render(
    <div data-testid="panel">
      <QueryPanelResizeHandle onResize={onResize} onResizeEnd={onResizeEnd} />
    </div>
  );
  screen.getByTestId('panel').getBoundingClientRect = () => ({ width: panelWidth });
  return { handle: screen.getByRole('separator', { name: 'Resize query panel' }), onResize, onResizeEnd };
};

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: VIEWPORT_WIDTH });
});

// Break this catches: dragging the left edge does nothing, or moves the panel the wrong way.
test('widens the panel by the distance dragged to the left and narrows it back', () => {
  const { handle, onResize, onResizeEnd } = renderHandle(496);

  fireEvent.mouseDown(handle, { clientX: 944 });
  fireEvent.mouseMove(window, { clientX: 744 });
  expect(onResize).toHaveBeenLastCalledWith(696);

  fireEvent.mouseMove(window, { clientX: 844 });
  expect(onResize).toHaveBeenLastCalledWith(596);

  fireEvent.mouseUp(window);
  expect(onResizeEnd).toHaveBeenCalledWith(596);
});

// Break this catches: the panel covers the left navigation rail, or shrinks below its default width.
test('stops at the left rail and at the default width', () => {
  const { handle, onResize } = renderHandle(496);

  fireEvent.mouseDown(handle, { clientX: 944 });
  fireEvent.mouseMove(window, { clientX: 0 });
  expect(onResize).toHaveBeenLastCalledWith(VIEWPORT_WIDTH - 54);

  fireEvent.mouseMove(window, { clientX: 1300 });
  expect(onResize).toHaveBeenLastCalledWith(496);
});

// Break this catches: a fast flick (press, move, release before React re-renders) is lost.
test('follows a drag delivered faster than React re-renders', () => {
  const { handle, onResize, onResizeEnd } = renderHandle(600);

  fireEvent.mouseDown(handle, { clientX: 840 });
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 640 }));
  window.dispatchEvent(new MouseEvent('mouseup'));

  expect(onResize).toHaveBeenLastCalledWith(800);
  expect(onResizeEnd).toHaveBeenCalledWith(800);
});

// Break this catches: dragging selects the query text under the pointer.
test('does not start a text selection when the drag begins', () => {
  const { handle } = renderHandle();
  const notCancelled = fireEvent.mouseDown(handle, { clientX: 900 });
  expect(notCancelled).toBe(false);
});

// Break this catches: moving the mouse after the drag ended keeps resizing the panel.
test('ignores mouse moves outside a drag', () => {
  const { handle, onResize, onResizeEnd } = renderHandle();

  fireEvent.mouseMove(window, { clientX: 300 });
  fireEvent.mouseUp(window);
  expect(onResize).not.toHaveBeenCalled();
  expect(onResizeEnd).not.toHaveBeenCalled();

  fireEvent.mouseDown(handle, { clientX: 900 });
  fireEvent.mouseUp(window);
  fireEvent.mouseMove(window, { clientX: 300 });
  expect(onResize).not.toHaveBeenCalled();
});

// Break this catches: keyboard users can't resize the panel.
test('resizes from the keyboard with the arrow keys', () => {
  const { handle, onResizeEnd } = renderHandle(600);

  fireEvent.keyDown(handle, { key: 'ArrowLeft' });
  expect(onResizeEnd).toHaveBeenLastCalledWith(616);

  fireEvent.keyDown(handle, { key: 'ArrowRight' });
  expect(onResizeEnd).toHaveBeenLastCalledWith(584);
});
