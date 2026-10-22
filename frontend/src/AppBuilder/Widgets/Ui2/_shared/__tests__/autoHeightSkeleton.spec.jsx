import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * While a UI 2.0 widget shows its loading skeleton, its measured root keeps the height its content last had (a
 * min-height), so the box neither shrinks to the skeleton nor moves the page when the content comes back. An earlier
 * version skipped the adjustment instead (useDynamicHeight's skipAdjustment), which held the box at a height that
 * could be the authored one: after a loading cycle a Card grid authored at 620px and drawn at 240px left a 380px band
 * under it. The adjustment now always runs, through full loaded -> skeleton -> loaded cycles.
 */
import React, { useRef } from 'react';
import { render } from '@testing-library/react';
import { useAutoHeight } from '../packHooks';

const calls = [];
jest.mock('@/_hooks/useDynamicHeight', () => ({ useDynamicHeight: (args) => calls.push(args) }));
jest.mock('@/_hooks/useHeightObserver', () => ({ useHeightObserver: () => 0 }));

// The content's height as the browser would measure it: 240px loaded, 70px as a skeleton (unless held).
let contentHeight = 240;
const Probe = ({ loading, look = 'skeleton', mode = 'view' }) => {
  const ref = useRef(null);
  useAutoHeight(
    {
      id: 'w1',
      height: 620,
      width: 400,
      properties: { loadingState: loading, loadingIndicator: look },
      currentMode: mode,
      componentType: 'ShadCardGrid',
    },
    ref
  );
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (el && !Object.getOwnPropertyDescriptor(el, 'offsetHeight')) {
          Object.defineProperty(el, 'offsetHeight', {
            get: () => Math.max(contentHeight, parseFloat(el.style.minHeight) || 0),
          });
        }
      }}
      data-probe=""
    />
  );
};
const root = () => document.querySelector('[data-probe]');
const measured = () => root().offsetHeight;

describe('useAutoHeight while a skeleton shows', () => {
  beforeEach(() => {
    calls.length = 0;
    contentHeight = 240;
  });

  test('a full loaded -> skeleton -> loaded cycle, twice, keeps the content height and never skips the adjustment', () => {
    const view = render(<Probe loading={false} />);
    expect(measured()).toBe(240);
    for (let cycle = 0; cycle < 2; cycle++) {
      contentHeight = 70; // the skeleton
      view.rerender(<Probe loading />);
      expect(root().style.minHeight).toBe('240px');
      expect(measured()).toBe(240);
      contentHeight = 240; // the content again
      view.rerender(<Probe loading={false} />);
      expect(root().style.minHeight).toBe('');
      expect(measured()).toBe(240);
    }
    expect(calls.every((args) => args.isDynamicHeightEnabled && !args.skipAdjustment)).toBe(true);
  });

  test('content that changed size while loading is measured as it is once loaded', () => {
    const view = render(<Probe loading={false} />);
    view.rerender(<Probe loading />);
    contentHeight = 400;
    view.rerender(<Probe loading={false} />);
    expect(root().style.minHeight).toBe('');
    expect(measured()).toBe(400);
  });

  test('switching the look away from skeleton mid-load releases the hold', () => {
    const view = render(<Probe loading={false} />);
    view.rerender(<Probe loading />);
    expect(root().style.minHeight).toBe('240px');
    view.rerender(<Probe loading look="spinner" />);
    expect(root().style.minHeight).toBe('');
  });

  test('a min-height the widget set itself is never cleared by the hook', () => {
    const view = render(<Probe loading={false} />);
    root().style.minHeight = '120px';
    view.rerender(<Probe loading={false} />);
    expect(root().style.minHeight).toBe('120px');
  });

  test('a skeleton before the first content holds nothing; the spinner look and the editor hold nothing', () => {
    render(<Probe loading />);
    expect(root().style.minHeight).toBe('');
    const spinner = render(<Probe loading={false} look="spinner" />);
    spinner.rerender(<Probe loading look="spinner" />);
    expect(document.querySelectorAll('[data-probe]')[1].style.minHeight).toBe('');
  });
});
