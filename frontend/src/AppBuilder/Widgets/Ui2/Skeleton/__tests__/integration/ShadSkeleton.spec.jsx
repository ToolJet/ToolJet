/**
 * UI 2.0 Skeleton: placeholder lines (and an optional avatar circle) shown while content loads.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Skeleton itself does. Titles carry [ShadSkeleton-<AREA>-<NNN>] scenario ids.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadSkeleton',
  handle: 'skeleton1',
  id: 'skel1',
  widgetHeight: 100,
  widgetWidth: 300,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const lines = (container) => [...container.querySelectorAll('.animate-pulse.h-4')];
const circle = (container) => container.querySelector('.animate-pulse.rounded-full');

describe('UI 2.0 Skeleton', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSkeleton-DEF-001] draws three pulsing lines, the last one shorter, and no avatar', async () => {
    const { container } = render();

    await waitFor(() => expect(lines(container)).toHaveLength(3));
    expect(lines(container)[2]).toHaveClass('w-3/5');
    expect(lines(container)[0]).toHaveClass('w-full');
    expect(circle(container)).toBeNull();
  });

  test('[ShadSkeleton-PROP-001] lines sets how many lines, between 1 and 50, and junk falls back to 3', async () => {
    const { container } = render({ properties: { lines: binding('{{5}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(5));

    render({ properties: { lines: binding('{{1}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(1));
    // A single line is full width.
    expect(lines(container)[0]).toHaveClass('w-full');

    render({ properties: { lines: binding('{{500}}') } });
    await waitFor(() => expect(lines(container)).toHaveLength(50));

    render({ properties: { lines: binding('many') } });
    await waitFor(() => expect(lines(container)).toHaveLength(3));
  });

  test('[ShadSkeleton-PROP-002] avatar adds a circle before the lines', async () => {
    const { container } = render({ properties: { avatar: binding('{{true}}') } });

    await waitFor(() => expect(circle(container)).toBeInTheDocument());
    expect(circle(container)).toHaveClass('h-12', 'w-12');
  });

  test('[ShadSkeleton-STY-001] placeholderColor reaches the placeholders as a CSS variable they read', async () => {
    const { container } = render({ styles: { placeholderColor: binding('#e2e8f0') } });

    await waitFor(() => expect(lines(container)).toHaveLength(3));
    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--lk-bg')).toBe('#e2e8f0');
    expect(lines(container)[0].className).toContain('var(--lk-bg');
  });
});
