import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { useElementSize } from '../useElementSize';

// jsdom has no ResizeObserver: a stand-in that lets the test report a new size.
let report;
let disconnected = 0;
beforeEach(() => {
  disconnected = 0;
  global.ResizeObserver = class {
    constructor(callback) {
      report = (width, height) => callback([{ contentRect: { width, height } }]);
    }
    observe() {}
    disconnect() {
      disconnected += 1;
    }
  };
});

const Probe = () => {
  const ref = useRef(null);
  const { width, height } = useElementSize(ref);
  return (
    <div ref={ref} data-testid="box">
      {width}x{height}
    </div>
  );
};

describe('useElementSize', () => {
  it('starts at zero, follows the element as it resizes, and stops watching on unmount', () => {
    const { getByTestId, unmount } = render(<Probe />);
    expect(getByTestId('box').textContent).toBe('0x0');
    act(() => report(640, 480));
    expect(getByTestId('box').textContent).toBe('640x480');
    unmount();
    expect(disconnected).toBe(1);
  });
});
