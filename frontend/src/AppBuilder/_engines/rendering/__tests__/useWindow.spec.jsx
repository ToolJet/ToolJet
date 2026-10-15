import React, { useRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { useWindow } from '../useWindow';

// jsdom does no layout: the scroll element's height and scroll position are set by hand.
const VIEWPORT = 400;
const setScroll = (el, top) => {
  el.scrollTop = top;
  fireEvent.scroll(el);
};

const List = ({ count, size = 40, onRender, ...options }) => {
  const scrollRef = useRef(null);
  const view = useWindow({ count, scrollRef, estimateSize: size, getItemKey: (i) => `k${i}`, ...options });
  onRender?.(view);
  return (
    <div ref={scrollRef} data-testid="scroll">
      <div style={{ height: view.height, position: 'relative' }}>
        {view.items.map((item) => (
          <div key={item.key} data-testid="item" data-index={item.index} style={{ top: view.itemTop(item.start) }}>
            {item.index}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderList = (props) => {
  const result = render(<List {...props} />);
  const el = result.getByTestId('scroll');
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: VIEWPORT });
  // The first layout pass assumed a taller viewport: correct it.
  act(() => setScroll(el, 0));
  const shown = () => result.queryAllByTestId('item').map((item) => Number(item.dataset.index));
  return { ...result, el, shown };
};

describe('useWindow', () => {
  test('renders the items in view plus the overscan, positioned at their offsets', () => {
    const { shown, getAllByTestId } = renderList({ count: 1000, overscan: 80 });
    // 0…(400 + 80) px of 40 px items.
    expect(shown()).toEqual(Array.from({ length: 13 }, (_, i) => i));
    expect(getAllByTestId('item')[3].style.top).toBe('120px');
  });

  test('scrolling moves the window; items keep their positions', () => {
    const { el, shown, getAllByTestId } = renderList({ count: 1000, overscan: 80 });
    act(() => setScroll(el, 4000));
    expect(shown()[0]).toBe(98); // 4000 − 80
    // 4000 + 400 + 80, and up to 3 viewports more ahead after a fast move.
    expect(shown().at(-1)).toBeGreaterThanOrEqual(112);
    expect(shown().at(-1)).toBeLessThanOrEqual(142);
    expect(getAllByTestId('item')[2].style.top).toBe('4000px');
  });

  test('a list taller than the browser allows: wheel scrolling moves items 1:1, positioned against an anchor', () => {
    let last = null;
    const onRender = (view) => (last = view);
    const { el, shown } = renderList({ count: 5000000, size: 46, overscan: 0, onRender });
    expect(el.parentElement).toBeTruthy();
    // Far down by dragging the scrollbar (a press on the scroll element itself).
    act(() => {
      fireEvent.pointerDown(el, { button: 0, pointerType: 'mouse' });
      setScroll(el, 5000000);
      fireEvent.pointerUp(window);
    });
    const first = shown()[0];
    expect(first).toBeGreaterThan(5000000 / 46); // proportional: further than the scroll position itself
    // Then the wheel: 1:1.
    act(() => {
      fireEvent.wheel(el);
      setScroll(el, 5000000 + 46 * 3);
    });
    expect(shown()[0]).toBe(first + 3);
    // jsdom drops calc(var()) from `top`; browsers apply it.
    expect(last.itemTop(last.items[0].start)).toMatch(/^calc\(var\(--tj-window-top, 0px\) \+ \d+px\)$/);
    expect(el.style.getPropertyValue('--tj-window-top')).toMatch(/px$/);
  });

  test('no items', () => {
    const { shown } = renderList({ count: 0 });
    expect(shown()).toEqual([]);
  });

  test('a mount budget mounts new items over several frames, nearest the view first', () => {
    jest.useFakeTimers();
    const now = jest.spyOn(performance, 'now');
    let clock = 0;
    now.mockImplementation(() => clock);
    // Every render costs 10 ms per item mounted.
    const onRender = (view) => (clock += 10 * view.items.length);
    try {
      const { el, shown } = renderList({ count: 1000, overscan: 0, mountBudgetMs: 25, onRender });
      expect(shown()).toHaveLength(11); // all at once on the first render
      act(() => setScroll(el, 4000));
      // 2–3 items' worth of budget: the ones in the middle of the view first.
      const partial = shown();
      expect(partial.length).toBeLessThan(11);
      expect(partial.length).toBeGreaterThan(0);
      for (const index of partial) expect(index).toBeGreaterThanOrEqual(100);
      for (let frame = 0; frame < 20; frame++) act(() => jest.advanceTimersByTime(20));
      expect(shown()).toEqual(Array.from({ length: 11 }, (_, i) => 100 + i));
    } finally {
      now.mockRestore();
      jest.useRealTimers();
    }
  });
});
