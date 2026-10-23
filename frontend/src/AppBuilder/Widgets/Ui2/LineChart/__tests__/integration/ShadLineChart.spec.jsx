/**
 * UI 2.0 Line chart: one line per series over a category axis, with an optional dashed series and target line.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for every
 * UI 2.0 widget in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadLineChart-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'line1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadLineChart',
  handle: 'lineChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
  // Drawn at once: the entrance animation has its own scenario below.
  defaultProperties: { animate: binding('{{false}}') },
});

measureChartsAt(W, H);

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const lines = () => document.querySelectorAll('.recharts-line-curve');
const drawn = () => waitFor(() => expect(lines().length).toBeGreaterThan(0));
const ticks = () => [...document.querySelectorAll('.recharts-cartesian-axis-tick-value')].map((t) => t.textContent);
/** Mouse events at a point of the chart (jsdom's carry no page coordinates, which Recharts reads). */
const pointer = (types, x = 250, y = 120) =>
  act(async () => {
    const wrapper = document.querySelector('.recharts-wrapper');
    for (const type of types) {
      const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
      Object.defineProperties(e, { pageX: { value: x }, pageY: { value: y } });
      fireEvent(wrapper, e);
    }
  });
/** The isAnimationActive each drawn series got, read from React's fiber tree (jsdom draws both the same). */
const animationFlags = () => {
  const flags = new Set();
  for (const el of document.querySelectorAll('svg *')) {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    for (let f = key ? el[key] : null; f; f = f.return) {
      if (f.memoizedProps && 'isAnimationActive' in f.memoizedProps) {
        flags.add(f.memoizedProps.isAnimationActive);
        break;
      }
    }
  }
  return [...flags];
};

describe('UI 2.0 Line chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadLineChart-DEF-001] draws a line per series with a legend, a grid and a number axis', async () => {
    render();

    await waitFor(() => expect(lines()).toHaveLength(2));
    expect(ticks()).toEqual(expect.arrayContaining(['Jan', 'Jun', '32K']));
    // A new line chart draws its axis as numbers, not money (a currency default drew counts as $3).
    expect(ticks().join(' ')).not.toContain('$');
    expect(document.querySelector('.recharts-cartesian-grid')).toBeInTheDocument();
    expect(document.querySelector('.recharts-legend-wrapper')).toHaveTextContent('RevenueExpenses');
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadLineChart-PROP-001] data, xField and yFields choose the rows, the category and the series drawn', async () => {
    render({
      properties: {
        data: binding("{{[{ week: 'W1', signups: 4, churn: 1 }, { week: 'W2', signups: 9, churn: 2 }]}}"),
        xField: binding('week'),
        yFields: binding("{{['signups']}}"),
      },
    });

    await waitFor(() => expect(lines()).toHaveLength(1));
    expect(ticks()).toEqual(expect.arrayContaining(['W1', 'W2']));
  });

  test('[ShadLineChart-PROP-002] dashedFields dashes a series, and referenceValue with referenceLabel draws a labelled target', async () => {
    render({
      properties: {
        dashedFields: binding('expenses'),
        referenceValue: binding('{{25000}}'),
        referenceLabel: binding('Target'),
      },
    });

    await waitFor(() => expect(lines()).toHaveLength(2));
    expect(lines()[0].getAttribute('stroke-dasharray')).toBeNull();
    expect(lines()[1].getAttribute('stroke-dasharray')).toBe('6 4');
    expect(document.querySelector('.recharts-reference-line')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
  });

  test('[ShadLineChart-PROP-003] yAxisFormat currency in the chosen currency abbreviates money ticks', async () => {
    render({ properties: { yAxisFormat: binding('currency'), currency: binding('EUR') } });

    await drawn();
    expect(ticks()).toContain('€32K');
  });

  test('[ShadLineChart-PROP-004] yAxisFormat percent reads fractions as percentages', async () => {
    render({
      properties: {
        data: binding("{{[{ month: 'Jan', rate: 0.1 }, { month: 'Feb', rate: 0.4 }]}}"),
        yFields: binding("{{['rate']}}"),
        yAxisFormat: binding('percent'),
      },
    });

    await drawn();
    expect(ticks()).toContain('40%');
  });

  test('[ShadLineChart-PROP-005] valuePrefix and valueSuffix wrap every value tick', async () => {
    render({ properties: { valuePrefix: binding('~'), valueSuffix: binding(' u') } });

    await drawn();
    expect(ticks()).toContain('~32K u');
  });

  test('[ShadLineChart-PROP-006] curve linear draws straight segments; the default monotone curve bends', async () => {
    render();
    await drawn();
    expect(lines()[0].getAttribute('d')).toContain('C');

    render({ properties: { curve: binding('linear') } });
    await drawn();
    expect(lines()[0].getAttribute('d')).not.toContain('C');
  });

  test('[ShadLineChart-PROP-007] showDots marks every point, strokeWidth sets the line weight and colors the series colours', async () => {
    render({
      properties: {
        showDots: binding('{{true}}'),
        strokeWidth: binding('{{4}}'),
        colors: binding("{{['#111111', '#222222']}}"),
      },
    });

    await waitFor(() => expect(document.querySelectorAll('.recharts-line-dots circle')).toHaveLength(12));
    expect(lines()[0].getAttribute('stroke-width')).toBe('4');
    expect([...lines()].map((l) => l.getAttribute('stroke'))).toEqual(['#111111', '#222222']);
  });

  test('[ShadLineChart-PROP-008] showGrid off removes the grid, and showLegend off removes the legend', async () => {
    render({ properties: { showGrid: binding('{{false}}'), showLegend: binding('{{false}}') } });

    await drawn();
    expect(document.querySelector('.recharts-cartesian-grid')).toBeNull();
    expect(document.querySelector('.recharts-legend-wrapper')).toBeNull();
  });

  test('[ShadLineChart-PROP-009] seriesLabels rename series in the legend; one series needs no legend', async () => {
    render({ properties: { seriesLabels: binding("{{{ revenue: 'Income' }}}") } });
    await drawn();
    expect(document.querySelector('.recharts-legend-wrapper')).toHaveTextContent('Income');

    // A fleet page's spend chart printed a legend reading "Cost" under its one line (2026-10-14).
    render({ properties: { yFields: binding("{{['revenue']}}") } });
    await waitFor(() => expect(lines()).toHaveLength(1));
    expect(document.querySelector('.recharts-legend-wrapper')).toBeNull();
  });

  test('[ShadLineChart-PROP-010] emptyText is shown when there is nothing to draw, and junk data shows it too', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });
    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();

    render({ properties: { data: binding('oops'), yFields: binding('{{{ a: 1 }}}') } });
    expect(await screen.findByText('No data')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
  });

  test('[ShadLineChart-PROP-011] animate turns every series entrance animation on, and off', async () => {
    render({ properties: { animate: binding('{{true}}') } });
    await drawn();
    expect(animationFlags()).toEqual([true]);

    render({ properties: { animate: binding('{{false}}') } });
    await drawn();
    expect(animationFlags()).toEqual([false]);
  });

  test('[ShadLineChart-STY-001] chartColor, gridColor and referenceLineColor reach the chart as CSS variables', async () => {
    render({
      styles: { chartColor: binding('#e11d48'), gridColor: binding('#d4d4d8'), referenceLineColor: binding('#0ea5e9') },
    });

    await drawn();
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-grid')).toBe('#d4d4d8');
    expect(root.style.getPropertyValue('--lk-ref')).toBe('#0ea5e9');
  });

  test('[ShadLineChart-EVT-001] clicking a point exposes it as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.lineChart1.clickedDataPoint.month}}' }));
    await drawn();

    await pointer(['mousemove', 'click']);

    await waitFor(() => expect(widget.variables().seen).toBe('Mar'));
    expect(exposed().clickedDataPoint).toMatchObject({ month: 'Mar', revenue: 23700, expenses: 12000 });
  });

  test('[ShadLineChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn();

    await pointer(['mousemove', 'click', 'click', 'dblclick']);

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadLineChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await drawn();
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ month: 'Mar' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadLineChart-PROP-020] Highlight clicked point rings the clicked point on each line until cleared', async () => {
    render({ properties: { highlightClicked: binding('{{true}}') } });
    await drawn();
    expect(document.querySelectorAll('.recharts-reference-dot')).toHaveLength(0);
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(Object.keys(exposed().clickedDataPoint).length).toBeGreaterThan(0));
    await waitFor(() => expect(document.querySelectorAll('.recharts-reference-dot').length).toBeGreaterThan(0));

    await widget.act('clearClickedPoint');
    await waitFor(() => expect(document.querySelectorAll('.recharts-reference-dot')).toHaveLength(0));
  });
});
