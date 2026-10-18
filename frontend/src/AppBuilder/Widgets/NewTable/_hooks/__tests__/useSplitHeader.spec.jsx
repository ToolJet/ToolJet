import React, { useRef } from 'react';
import { render, act } from '@testing-library/react';
import { useSplitHeader } from '../useSplitHeader';

// jsdom lays nothing out: the body's sizes are given, and ResizeObserver is a stub the test triggers.
let observers = [];
beforeEach(() => {
  observers = [];
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    disconnect() {}
  };
});

const sized = (el, { offsetWidth, clientWidth, scrollWidth = 1000, clientHeight = 300, scrollHeight = 5000 }) => {
  Object.defineProperties(el, {
    offsetWidth: { configurable: true, value: offsetWidth },
    clientWidth: { configurable: true, value: clientWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
    clientHeight: { configurable: true, value: clientHeight },
    scrollHeight: { configurable: true, value: scrollHeight },
  });
};

function SplitTable({ onGutter, bodySize }) {
  const headRef = useRef(null);
  const bodyRef = useRef(null);
  const setBody = (el) => {
    if (el && bodySize) sized(el, bodySize);
    bodyRef.current = el;
  };
  const gutter = useSplitHeader(headRef, bodyRef);
  onGutter(gutter);
  return (
    <div>
      <div data-testid="head" ref={headRef} style={{ paddingRight: gutter }} />
      <div data-testid="body" ref={setBody}>
        <table />
      </div>
    </div>
  );
}

describe('useSplitHeader', () => {
  test('the header leaves room for the body’s scrollbar, and none when it goes away', () => {
    let gutter;
    const body = { offsetWidth: 400, clientWidth: 385 };
    const { getByTestId } = render(<SplitTable onGutter={(g) => (gutter = g)} bodySize={body} />);
    expect(gutter).toBe(15);
    expect(getByTestId('head').style.paddingRight).toBe('15px');

    sized(getByTestId('body'), { offsetWidth: 400, clientWidth: 400 });
    act(() => observers.forEach((o) => o.callback([])));
    expect(gutter).toBe(0);
  });

  test('the header follows the body’s horizontal scroll', () => {
    const { getByTestId } = render(
      <SplitTable onGutter={() => {}} bodySize={{ offsetWidth: 400, clientWidth: 385 }} />
    );
    const body = getByTestId('body');
    body.scrollLeft = 120;
    act(() => body.dispatchEvent(new Event('scroll')));
    expect(getByTestId('head').scrollLeft).toBe(120);
  });

  test('wheel over the header scrolls the body', () => {
    const { getByTestId } = render(
      <SplitTable onGutter={() => {}} bodySize={{ offsetWidth: 400, clientWidth: 385 }} />
    );
    const body = getByTestId('body');
    body.scrollBy = jest.fn();
    const wheel = new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true });
    getByTestId('head').dispatchEvent(wheel);
    expect(body.scrollBy).toHaveBeenCalledWith({ left: 0, top: 48 });
    expect(wheel.defaultPrevented).toBe(true);
  });
});
