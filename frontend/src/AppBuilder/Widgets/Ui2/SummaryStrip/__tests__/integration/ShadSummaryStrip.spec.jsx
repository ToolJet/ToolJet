/**
 * UI 2.0 Summary strip: a row of headline figures with labels, changes and captions.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Summary strip itself does. Titles carry [ShadSummaryStrip-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'strip1';
const widget = createWidgetHarness({
  componentType: 'ShadSummaryStrip',
  handle: 'strip1',
  id: ID,
  widgetHeight: 120,
  widgetWidth: 900,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const cells = () => [...document.querySelectorAll('dl > div')];
const cell = (label) => screen.getByText(label).closest('dl > div');
const value = (label) => cell(label).querySelector('dd span');
const delta = (label) => cell(label).querySelector('[data-tone]');
const ONE = (item) => binding(`{{[${item}]}}`);

describe('UI 2.0 Summary strip', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSummaryStrip-DEF-001] shows the four sample figures with signed, toned changes and captions', async () => {
    render();

    await waitFor(() => expect(cells()).toHaveLength(4));
    expect(value('Revenue')).toHaveTextContent('$48,210');
    expect(delta('Revenue')).toHaveTextContent('+12.4%');
    expect(delta('Revenue')).toHaveAttribute('data-tone', 'positive');
    expect(delta('Average order')).toHaveAttribute('data-tone', 'negative');
    // lowerIsBetter: a falling refund rate is good news.
    expect(delta('Refund rate')).toHaveAttribute('data-tone', 'positive');
    expect(cell('Revenue')).toHaveTextContent('vs last month');
  });

  test('[ShadSummaryStrip-PROP-001] items takes plain values too; none shows No figures yet', async () => {
    render({ properties: { items: binding("{{['Open 14', { label: 'Closed', value: 3 }]}}") } });
    await waitFor(() => expect(cells()).toHaveLength(2));
    expect(cells()[0]).toHaveTextContent('Open 14');
    expect(value('Closed')).toHaveTextContent('3');

    render({ properties: { items: binding('{{[]}}') } });
    expect(await screen.findByText('No figures yet')).toBeInTheDocument();
  });

  test('[ShadSummaryStrip-PROP-002] valueFormat and currency format every figure without its own format', async () => {
    render({
      properties: {
        items: ONE("{ label: 'Stock value', value: 6467.11 }, { label: 'Units', value: 433, format: 'number' }"),
        valueFormat: binding('currency'),
        currency: binding('GBP'),
      },
    });

    await waitFor(() => expect(value('Stock value')).toHaveTextContent('£6,467.11'));
    expect(value('Units')).toHaveTextContent('433');
  });

  test('[ShadSummaryStrip-PROP-003] deltaFormat number shows changes as signed numbers', async () => {
    render({
      properties: {
        items: ONE("{ label: 'Tickets', value: 40, delta: -3 }"),
        deltaFormat: binding('number'),
      },
    });

    await waitFor(() => expect(delta('Tickets')).toHaveTextContent('−3'));
    expect(delta('Tickets')).not.toHaveTextContent('%');
    expect(delta('Tickets')).toHaveAttribute('data-tone', 'negative');
  });

  test('[ShadSummaryStrip-PROP-004] appearance panel frames the strip; plain drops the frame', async () => {
    render();
    await waitFor(() => expect(document.querySelector('dl')).toHaveClass('tw-border'));

    render({ properties: { appearance: binding('plain') } });
    await waitFor(() => expect(document.querySelector('dl')).not.toHaveClass('tw-border'));
    expect(cells()[0]).toHaveClass('tw-pl-0');
  });

  test('[ShadSummaryStrip-PROP-005] size sets the figure scale; align center centres each figure', async () => {
    render({ properties: { size: binding('lg'), align: binding('center') } });
    await waitFor(() => expect(value('Revenue')).toHaveClass('tw-text-3xl'));
    expect(cell('Revenue')).toHaveClass('tw-items-center', 'tw-text-center');

    render({ properties: { size: binding('sm') } });
    await waitFor(() => expect(value('Revenue')).toHaveClass('tw-text-ui2-lg'));
    expect(cell('Revenue')).not.toHaveClass('tw-text-center');
  });

  test('[ShadSummaryStrip-DEF-002] lays the figures out in as many columns as fit, a hairline between them', async () => {
    render();
    await waitFor(() =>
      expect(document.querySelector('dl').style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))')
    );
    // The pack's preflight zeroes inline border widths, so separators are border classes.
    expect(cells()[0].className).not.toMatch(/border-l/);
    expect(cells()[1]).toHaveClass('tw-border-l');
    expect(document.querySelector('[style*="border-left"]')).toBeNull();
  });

  // The strip cut long labels and captions to one line ("Technicians on the...", 2026-10-13). They wrap now; the label
  // takes the cell's spare height, so figures in one row stay level.
  test('[ShadSummaryStrip-DEF-003] wraps a long label and caption instead of cutting them', async () => {
    render({
      properties: {
        items: ONE(
          "{ label: 'Jobs this week', value: 14 }, { label: 'Technicians on the road today across both regions', value: 8, caption: 'two more than last week, with one on leave' }"
        ),
      },
    });

    await waitFor(() => expect(document.querySelectorAll('dt')).toHaveLength(2));
    for (const dt of document.querySelectorAll('dt')) {
      expect(dt).not.toHaveClass('tw-truncate');
      expect(dt).toHaveClass('tw-flex-1');
    }
    expect(screen.getByText(/two more/)).not.toHaveClass('tw-truncate');
    // A figure without a caption holds a blank line, so it stays level with its neighbour's.
    expect(cell('Jobs this week').querySelector('dd[aria-hidden="true"]')).toBeTruthy();
  });

  test('[ShadSummaryStrip-STY-001] colours, radius and value typeface reach the strip as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#fafaf9'),
        borderColor: binding('#e7e5e4'),
        labelColor: binding('#78716c'),
        valueColor: binding('#1c1917'),
        positiveColor: binding('#15803d'),
        negativeColor: binding('#b91c1c'),
        borderRadius: binding('{{12}}'),
        valueFontFamily: binding('mono'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-pos')).toBe('#15803d'));
    expect(root.style.getPropertyValue('--lk-neg')).toBe('#b91c1c');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#fafaf9');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#e7e5e4');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#78716c');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#1c1917');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('12px');
    expect(root.style.getPropertyValue('--lk-title-font')).toMatch(/monospace$/);
  });

  test('[ShadSummaryStrip-STY-010] in a fixed box too short for its figures, the strip scrolls instead of cutting them', async () => {
    // At 50px the figures were cut 59px by the strip's overflow: hidden, with no way to reach them (Cypress geometry).
    render({ currentMode: 'edit' });
    const strip = await waitFor(() => {
      const dl = document.querySelector('dl');
      expect(dl).toBeTruthy();
      return dl;
    });
    expect(strip).toHaveClass('tw-h-full', 'tw-overflow-y-auto');
    expect(strip).not.toHaveClass('tw-overflow-hidden');
  });
});
