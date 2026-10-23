/**
 * UI 2.0 Progress: a horizontal bar filled to a percentage.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Progress itself does. Titles carry [ShadProgress-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadProgress',
  handle: 'progress1',
  id: 'prog1',
  widgetHeight: 40,
  widgetWidth: 300,
  defaultProperties: { value: binding('{{60}}') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const bar = () => screen.getByRole('progressbar');
/** How far the indicator is filled, read from its offset (translateX(-40%) is 60% full). */
const filled = () => 100 - Number(bar().firstChild.style.transform.match(/-?([\d.]+)%/)[1]);
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Progress', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadProgress-DEF-001] fills the bar to its value and exposes it, with no label row by default', async () => {
    const { container } = render();

    await waitFor(() => expect(filled()).toBe(60));
    expect(exposed().value).toBe(60);
    expect(container.querySelector('.tj-shadcn').textContent).toBe('');
  });

  test('[ShadProgress-PROP-001] value is clamped to 0-100, and junk reads as 0', async () => {
    render({ properties: { value: binding('{{140}}') } });
    await waitFor(() => expect(exposed().value).toBe(100));
    expect(filled()).toBe(100);

    render({ properties: { value: binding('{{-5}}') } });
    await waitFor(() => expect(exposed().value).toBe(0));

    render({ properties: { value: binding('lots') } });
    await waitFor(() => expect(filled()).toBe(0));
  });

  test('[ShadProgress-PROP-002] label and showValue show a caption row with the rounded percentage', async () => {
    render({ properties: { label: binding('Upload'), showValue: binding('{{true}}'), value: binding('{{42.6}}') } });

    expect(await screen.findByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();

    render({ properties: { label: binding('Upload'), showValue: binding('{{false}}') } });
    await waitFor(() => expect(screen.queryByText(/%$/)).toBeNull());
  });

  test('[ShadProgress-ACT-001] setValue fills the bar and updates value until the Value property changes', async () => {
    render();

    await widget.act('setValue', 12);
    await waitFor(() => expect(exposed().value).toBe(12));
    expect(filled()).toBe(12);

    render({ properties: { value: binding('{{75}}') } });
    await waitFor(() => expect(exposed().value).toBe(75));
  });

  // The bar once took its value for the indicator only, so the progressbar had no aria-valuenow and read as
  // indeterminate to a screen reader.
  test('[ShadProgress-KBD-001] the progress bar announces its value to assistive technology', async () => {
    render();

    await waitFor(() => expect(bar()).toHaveAttribute('aria-valuenow', '60'));
  });

  test('[ShadProgress-STY-001] bar, track, label and value colours and the bar height reach the bar as CSS variables', async () => {
    const { container } = render({
      properties: { label: binding('Upload'), showValue: binding('{{true}}') },
      styles: {
        barColor: binding('#16a34a'),
        trackColor: binding('#dcfce7'),
        labelColor: binding('#14532d'),
        valueColor: binding('#166534'),
        barHeight: binding('{{12}}'),
      },
    });

    await screen.findByText('Upload');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#16a34a');
    expect(root.style.getPropertyValue('--lk-track')).toBe('#dcfce7');
    expect(root.style.getPropertyValue('--lk-label')).toBe('#14532d');
    expect(root.style.getPropertyValue('--lk-help')).toBe('#166534');
    expect(root.style.getPropertyValue('--lk-height')).toBe('12px');
    expect(bar().className).toContain('tw-h-[var(--lk-height,0.5rem)]');
  });
});
