/**
 * UI 2.0 Skeleton: placeholder lines (and an optional avatar circle) shown while content loads.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Skeleton itself does. Titles carry [ShadSkeleton-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadSkeleton',
  handle: 'skeleton1',
  id: 'skel1',
  // Tall enough for the 50 lines PROP-001 asks for (a 16px line and an 8px gap each).
  widgetHeight: 1300,
  widgetWidth: 300,
});
// A short box: as many lines as fit are drawn (FIT-001).
const short = createWidgetHarness({
  componentType: 'ShadSkeleton',
  handle: 'skeleton2',
  id: 'skel2',
  widgetHeight: 100,
  widgetWidth: 300,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const lines = (container) => [...container.querySelectorAll('.tw-animate-pulse.tw-h-4')];
const circle = (container) => container.querySelector('.tw-animate-pulse.tw-rounded-full');

describe('UI 2.0 Skeleton', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSkeleton-DEF-001] draws three pulsing lines, the last one shorter, and no avatar', async () => {
    const { container } = render();

    await waitFor(() => expect(lines(container)).toHaveLength(3));
    expect(lines(container)[2]).toHaveClass('tw-w-3/5');
    expect(lines(container)[0]).toHaveClass('tw-w-full');
    expect(circle(container)).toBeNull();
  });

  test('[ShadSkeleton-PROP-001] lines sets how many lines, between 1 and 50, and junk falls back to 3', async () => {
    const { container } = render({ properties: { lines: binding('{{5}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(5));

    render({ properties: { lines: binding('{{1}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(1));
    // A single line is full width.
    expect(lines(container)[0]).toHaveClass('tw-w-full');

    render({ properties: { lines: binding('{{500}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(50));

    render({ properties: { lines: binding('many') } });
    await waitFor(() => expect(lines(container)).toHaveLength(3));
  });

  test('[ShadSkeleton-PROP-002] avatar adds a circle before the lines', async () => {
    const { container } = render({ properties: { avatar: binding('{{true}}') } });

    await waitFor(() => expect(circle(container)).toBeInTheDocument());
    expect(circle(container)).toHaveClass('tw-h-12', 'tw-w-12');
  });

  test('[ShadSkeleton-FIT-001] in a short box only the lines that fit are drawn, the last one still shorter', async () => {
    // 20 lines in a 100px box drew 476px of placeholders over the widgets below. A 96px box (its 2px padding off)
    // fits 4: 4 x 16px + 3 x 8px = 88px. The widget keeps its box (it has no Dynamic height) and clips the rest.
    await short.setup();
    const { container } = short.render({ currentMode: 'view', properties: { lines: binding('{{20}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(4));
    expect(lines(container)[3]).toHaveClass('tw-w-3/5');
    expect(container.querySelector('.tj-shadcn')).toHaveClass('tw-h-full', 'tw-overflow-hidden');

    short.render({ currentMode: 'view', properties: { lines: binding('{{2}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(2));
    short.teardown();
  });

  test('[ShadSkeleton-STY-001] placeholderColor reaches the placeholders as a CSS variable they read', async () => {
    const { container } = render({ styles: { placeholderColor: binding('#e2e8f0') } });

    await waitFor(() => expect(lines(container)).toHaveLength(3));
    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--lk-bg')).toBe('#e2e8f0');
    expect(lines(container)[0].className).toContain('var(--lk-bg');
  });
});
