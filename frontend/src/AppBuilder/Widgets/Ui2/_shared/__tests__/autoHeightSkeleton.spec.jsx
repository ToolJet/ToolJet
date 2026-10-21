import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * While a UI 2.0 widget shows its loading skeleton, its box keeps its last fitted height (useDynamicHeight's
 * skipAdjustment): the skeleton is not the content, and following it moved the page down and back up when the data
 * came. A spinner (LoadingBox) already draws at the box's height, and loaded content is fitted as before.
 */
import React, { useRef } from 'react';
import { render } from '@testing-library/react';
import { useAutoHeight } from '../packHooks';

const calls = [];
jest.mock('@/_hooks/useDynamicHeight', () => ({ useDynamicHeight: (args) => calls.push(args) }));
jest.mock('@/_hooks/useHeightObserver', () => ({ useHeightObserver: () => 0 }));

const Probe = ({ properties, currentMode = 'view' }) => {
  const ref = useRef(null);
  useAutoHeight({ id: 'w1', height: 200, width: 400, properties, currentMode, componentType: 'ShadSummaryStrip' }, ref);
  return <div ref={ref} />;
};
const last = () => calls[calls.length - 1];

describe('useAutoHeight while loading', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  test('holds the box while a skeleton shows', () => {
    render(<Probe properties={{ loadingState: true, loadingIndicator: 'skeleton' }} />);
    expect(last()).toMatchObject({ isDynamicHeightEnabled: true, skipAdjustment: true });
  });

  test('fits the content when loaded, and while a spinner shows', () => {
    render(<Probe properties={{ loadingState: false, loadingIndicator: 'skeleton' }} />);
    expect(last().skipAdjustment).toBe(false);
    render(<Probe properties={{ loadingState: true, loadingIndicator: 'spinner' }} />);
    expect(last().skipAdjustment).toBe(false);
  });
});
