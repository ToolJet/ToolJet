/**
 * UI 2.0 Separator: a thin horizontal or vertical rule.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Separator itself does. Titles carry [ShadSeparator-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadSeparator',
  handle: 'separator1',
  id: 'sep1',
  widgetHeight: 24,
  widgetWidth: 300,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const rule = (container) => container.querySelector('[data-orientation]');

describe('UI 2.0 Separator', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSeparator-DEF-001] draws a decorative horizontal rule centred in its box', async () => {
    const { container } = render();

    await waitFor(() => expect(rule(container)).toHaveAttribute('data-orientation', 'horizontal'));
    // Decorative: a screen reader skips it.
    expect(rule(container)).toHaveAttribute('role', 'none');
    expect(rule(container).className).toContain('tw-h-[var(--lk-thick,1px)]');
    // Centred in the height RenderWidget gives it: the widget's 24px less the wrapper's 2px padding on each side.
    expect(rule(container).parentElement.style.height).toBe('20px');
  });

  test('[ShadSeparator-PROP-001] orientation vertical draws an upright rule', async () => {
    const { container } = render({ properties: { orientation: binding('vertical') } });

    await waitFor(() => expect(rule(container)).toHaveAttribute('data-orientation', 'vertical'));
    expect(rule(container).className).toContain('tw-w-[var(--lk-thick,1px)]');
  });

  test('[ShadSeparator-STY-001] lineColor and thickness reach the rule as CSS variables it reads', async () => {
    const { container } = render({ styles: { lineColor: binding('#94a3b8'), thickness: binding('{{3}}') } });

    await waitFor(() => expect(rule(container)).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-line')).toBe('#94a3b8');
    expect(root.style.getPropertyValue('--lk-thick')).toBe('3px');
    expect(rule(container).className).toContain('tw-bg-[color:var(--lk-line,var(--sc-border))]');
  });
});
