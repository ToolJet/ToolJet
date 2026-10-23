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

  describe('with a budget for the items beyond the view', () => {
    // Tasks run on timers here (the task queue uses setTimeout without a MessageChannel), and time is mocked.
    let clock;
    let channel;
    beforeEach(() => {
      jest.useFakeTimers();
      channel = global.MessageChannel;
      global.MessageChannel = undefined;
      clock = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => clock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
      global.MessageChannel = channel;
      jest.useRealTimers();
    });
    const nextTask = () => act(() => jest.advanceTimersByTime(1));
    const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

    test('items in view render at once, however slow mounting is; the rest come in the tasks after, ahead first', () => {
      // Every item mounted costs 10 ms: a budget of 25 ms fits 2 of them.
      let shownBefore = new Set();
      const onRender = (view) => {
        const fresh = view.items.filter((item) => !shownBefore.has(item.index)).length;
        clock += 10 * fresh;
        shownBefore = new Set(view.items.map((item) => item.index));
      };
      const { el, shown } = renderList({ count: 1000, overscan: 200, aheadBudgetMs: 25, onRender });
      act(() => setScroll(el, 4000));
      // In view (100…109) and the next step's distance ahead (110…119): all there, in one render.
      expect(shown()).toEqual(expect.arrayContaining(range(100, 119)));
      expect(shown()).not.toContain(95); // behind the view: later
      // The next task brings items ahead of the scrolling before those behind it.
      nextTask();
      const added = shown().filter((i) => i < 100 || i > 119);
      expect(added.length).toBeGreaterThan(0);
      expect(added.every((i) => i > 119)).toBe(true);
      // Eventually the whole window.
      for (let task = 0; task < 60; task++) nextTask();
      expect(shown()).toEqual(expect.arrayContaining(range(95, 124)));
    });

    test('one slow task does not hold the count down: the next tasks mount more again', () => {
      // Rendering costs 1 ms, except during the fourth task, which takes 300 ms (a GC pause, say).
      let renderCost = 1;
      const onRender = () => (clock += renderCost);
      const { el, shown } = renderList({ count: 100000, overscan: 40000, aheadBudgetMs: 25, onRender });
      act(() => setScroll(el, 400000));
      const perTask = [];
      let before = shown().length;
      for (let task = 0; task < 8; task++) {
        renderCost = task === 3 ? 300 : 1;
        nextTask();
        perTask.push(shown().length - before);
        before = shown().length;
      }
      // Half as many right after the slow task, never down to one; then twice as many per task again.
      expect(perTask[4]).toBe(perTask[3] / 2);
      expect(perTask[5]).toBe(perTask[4] * 2);
    });
  });
});
