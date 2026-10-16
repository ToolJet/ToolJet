import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { useObservedWidth } from '../useObservedWidth';

// A stand-in ResizeObserver: the test reports sizes by hand.
const observers = [];
class FakeResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = new Set();
    observers.push(this);
  }
  observe(target) {
    this.targets.add(target);
  }
  unobserve(target) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }
}
const report = (sizes) =>
  act(() => observers[0].callback(sizes.map(([target, inlineSize]) => ({ target, borderBoxSize: [{ inlineSize }] }))));

const Labelled = ({ show = true, onRender }) => {
  const ref = useRef();
  const width = useObservedWidth(ref);
  onRender(width);
  return show ? <label ref={ref}>name</label> : null;
};

describe('useObservedWidth', () => {
  // One observer serves the whole module, so the stand-in stays for the file.
  beforeAll(() => {
    global.ResizeObserver = FakeResizeObserver;
  });
  afterAll(() => {
    delete global.ResizeObserver;
  });

  test('reports the width the observer gives, many elements in one render', () => {
    const widths = { a: [], b: [] };
    const { container } = render(
      <>
        <Labelled onRender={(w) => widths.a.push(w)} />
        <Labelled onRender={(w) => widths.b.push(w)} />
      </>
    );
    const [a, b] = container.querySelectorAll('label');
    expect(observers).toHaveLength(1);
    expect(observers[0].targets).toEqual(new Set([a, b]));
    const rendersBefore = widths.a.length;
    report([
      [a, 48.5],
      [b, 60],
    ]);
    expect(widths.a.at(-1)).toBe(48.5);
    expect(widths.b.at(-1)).toBe(60);
    expect(widths.a).toHaveLength(rendersBefore + 1);
  });

  test('0 once the element is gone, and it is no longer observed', () => {
    const widths = [];
    const { container, rerender } = render(<Labelled onRender={(w) => widths.push(w)} />);
    const label = container.querySelector('label');
    report([[label, 30]]);
    expect(widths.at(-1)).toBe(30);
    rerender(<Labelled show={false} onRender={(w) => widths.push(w)} />);
    expect(widths.at(-1)).toBe(0);
    expect(observers[0].targets.has(label)).toBe(false);
  });
});
