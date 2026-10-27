import React, { useRef } from 'react';
import { render } from '@testing-library/react';
import { WindowedList } from '../WindowedList';

// jsdom does no layout: the menu's height is set by hand.
const VIEWPORT = 200;
const ITEM = 40;

// A menu: the element that scrolls is the list's parent, so its ref is set after the list's own layout effects.
const Menu = (props) => {
  const scrollRef = useRef(null);
  return (
    <div
      ref={(el) => {
        scrollRef.current = el;
        if (el) Object.defineProperty(el, 'clientHeight', { configurable: true, value: VIEWPORT });
      }}
      data-testid="menu"
    >
      <WindowedList
        scrollRef={scrollRef}
        itemHeight={ITEM}
        overscan={0}
        renderItem={(index) => <span>option {index}</span>}
        {...props}
      />
    </div>
  );
};

const shown = (container) => [...container.querySelectorAll('[data-index]')].map((e) => Number(e.dataset.index));

describe('WindowedList', () => {
  test('renders only the items in view of its scrolling parent', () => {
    const { container } = render(<Menu count={10000} />);
    expect(shown(container).length).toBeLessThan(40);
    expect(shown(container)).toContain(0);
  });

  test('centers the initial item when it first shows', () => {
    const { container, getByTestId } = render(<Menu count={10000} initialIndex={5000} />);
    const menu = getByTestId('menu');
    expect(menu.scrollTop).toBe(5000 * ITEM - (VIEWPORT - ITEM) / 2);
    expect(shown(container)).toContain(5000);
  });

  test('keeps a sticky item rendered wherever the list is', () => {
    const { container } = render(<Menu count={10000} initialIndex={5000} stickyIndex={0} />);
    expect(shown(container)).toContain(0);
    expect(container.querySelector('[data-index="0"]').style.position).toBe('sticky');
  });

  test('brings a focused item into view only when it is out of view', () => {
    const { getByTestId, rerender } = render(<Menu count={10000} focusedIndex={-1} />);
    const menu = getByTestId('menu');
    // Focus within view (hovering an option): no scroll.
    rerender(<Menu count={10000} focusedIndex={3} />);
    expect(menu.scrollTop).toBe(0);
    // Focus moved past the bottom (keyboard): just enough scroll to show it.
    rerender(<Menu count={10000} focusedIndex={5} />);
    expect(menu.scrollTop).toBe(6 * ITEM - VIEWPORT);
    // Far away (End key): shown.
    rerender(<Menu count={10000} focusedIndex={9999} />);
    expect(menu.scrollTop).toBe(10000 * ITEM - VIEWPORT);
  });
});
