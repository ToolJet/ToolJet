/**
 * UI 2.0 Circular progress: a ring filled to a percentage, with a figure or text in its centre.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Circular progress itself does. Titles carry [ShadCircularProgress-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadCircularProgress',
  handle: 'circularProgress1',
  id: 'ring1',
  widgetHeight: 120,
  widgetWidth: 200,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const ring = () => screen.getByRole('progressbar');
const circles = () => ring().querySelectorAll('circle');
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Circular progress', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCircularProgress-DEF-001] fills a 96px ring to 63%, shows it in the centre with the label, and exposes value', async () => {
    render();

    await waitFor(() => expect(ring()).toHaveAttribute('aria-valuenow', '63'));
    expect(ring()).toHaveAttribute('aria-label', 'Complete');
    expect(ring().style.width).toBe('96px');
    expect(screen.getByText('63%')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    await waitFor(() => expect(exposed().value).toBe(63));
  });

  test('[ShadCircularProgress-PROP-001] value is clamped to 0-100; at 0 only the track is drawn', async () => {
    render({ properties: { value: binding('{{150}}') } });
    await waitFor(() => expect(ring()).toHaveAttribute('aria-valuenow', '100'));
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(exposed().value).toBe(100);

    render({ properties: { value: binding('{{0}}') } });
    await waitFor(() => expect(ring()).toHaveAttribute('aria-valuenow', '0'));
    expect(circles()).toHaveLength(1);
  });

  test('[ShadCircularProgress-PROP-002] size and thickness set the ring and its stroke; lineCap flat squares the ends', async () => {
    render({ properties: { size: binding('{{140}}'), thickness: binding('{{14}}') } });
    await waitFor(() => expect(ring().style.width).toBe('140px'));
    expect(circles()[1]).toHaveAttribute('stroke-width', '14');
    expect(circles()[1]).toHaveAttribute('stroke-linecap', 'round');

    render({ properties: { lineCap: binding('flat') } });
    await waitFor(() => expect(circles()[1]).toHaveAttribute('stroke-linecap', 'butt'));
  });

  test('[ShadCircularProgress-PROP-003] centerText custom shows the text property; none shows only the label', async () => {
    render({ properties: { centerText: binding('custom'), text: binding('Nearly there') } });
    expect(await screen.findByText('Nearly there')).toBeInTheDocument();
    expect(screen.queryByText('63%')).toBeNull();

    render({ properties: { centerText: binding('none') } });
    await waitFor(() => expect(screen.queryByText('Nearly there')).toBeNull());
    expect(screen.queryByText('63%')).toBeNull();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  test('[ShadCircularProgress-PROP-004] label names the ring, and without one it is announced as Progress', async () => {
    render({ properties: { label: binding('Onboarding') } });
    await waitFor(() => expect(ring()).toHaveAttribute('aria-label', 'Onboarding'));

    render({ properties: { label: binding('') } });
    await waitFor(() => expect(ring()).toHaveAttribute('aria-label', 'Progress'));
  });

  test('[ShadCircularProgress-ACT-001] setValue fills the ring and updates value until the Value property changes', async () => {
    render();

    await widget.act('setValue', 12);
    await waitFor(() => expect(ring()).toHaveAttribute('aria-valuenow', '12'));
    expect(exposed().value).toBe(12);
    expect(screen.getByText('12%')).toBeInTheDocument();

    render({ properties: { value: binding('{{80}}') } });
    await waitFor(() => expect(exposed().value).toBe(80));
  });

  test('[ShadCircularProgress-STY-001] bar, track, text and label colours and the alignment reach the ring', async () => {
    const { container } = render({
      styles: {
        barColor: binding('#ea580c'),
        trackColor: binding('#ffedd5'),
        textColor: binding('#7c2d12'),
        labelColor: binding('#9a3412'),
        alignment: binding('right'),
      },
    });

    await waitFor(() => expect(ring()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#ea580c');
    expect(root.style.getPropertyValue('--lk-track')).toBe('#ffedd5');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#7c2d12');
    expect(root.style.getPropertyValue('--lk-label')).toBe('#9a3412');
    expect(ring().parentElement).toHaveClass('tw-justify-end');
  });
});
