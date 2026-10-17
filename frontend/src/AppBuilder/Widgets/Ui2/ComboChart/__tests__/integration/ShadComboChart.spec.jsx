/**
 * UI 2.0 Combo chart: bars and lines over one category axis, with series on a left or a right value axis.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for every
 * UI 2.0 widget in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadComboChart-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'combo1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadComboChart',
  handle: 'comboChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
  // Drawn at once: the entrance animation has its own scenario below.
  defaultProperties: { animate: binding('{{false}}') },
});

measureChartsAt(W, H);

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const bars = () => document.querySelectorAll('.recharts-bar-rectangle');
const lines = () => document.querySelectorAll('.recharts-line-curve');
const drawn = () => waitFor(() => expect(bars().length + lines().length).toBeGreaterThan(0));
const yAxes = () => [...document.querySelectorAll('.recharts-yAxis')];
const axisTicks = (axis) => [...axis.querySelectorAll('.recharts-cartesian-axis-tick-value')].map((t) => t.textContent);
const legend = () => document.querySelector('.recharts-legend-wrapper');
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
const AB = binding("{{[{ week: 'W1', a: 600, b: 600, c: 2 }, { week: 'W2', a: 400, b: 500, c: 3 }]}}");

describe('UI 2.0 Combo chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadComboChart-DEF-001] draws revenue bars and a margin line with dots on a right percent axis, and a legend', async () => {
    render();

    await drawn();
    expect(bars()).toHaveLength(6);
    expect(lines()).toHaveLength(1);
    expect(document.querySelectorAll('.recharts-line-dots circle')).toHaveLength(6);
    expect(yAxes()).toHaveLength(2);
    // A new combo chart draws its left axis as numbers, not money.
    expect(axisTicks(yAxes()[0]).join(' ')).not.toContain('$');
    expect(axisTicks(yAxes()[1]).every((t) => t.endsWith('%'))).toBe(true);
    expect(document.querySelector('.recharts-cartesian-grid')).toBeInTheDocument();
    expect(legend()).toHaveTextContent('RevenueMargin');
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadComboChart-PROP-001] data, xField, barFields, lineFields and rightAxisFields place each series', async () => {
    render({
      properties: {
        data: AB,
        xField: binding('week'),
        barFields: binding("{{['a', 'b']}}"),
        lineFields: binding("{{['c']}}"),
        rightAxisFields: binding('{{[]}}'),
      },
    });

    await drawn();
    expect(bars()).toHaveLength(4);
    expect(lines()).toHaveLength(1);
    // Nothing on the right: one value axis.
    expect(yAxes()).toHaveLength(1);
    expect(document.querySelector('.recharts-xAxis')).toHaveTextContent('W1');
  });

  test('[ShadComboChart-PROP-002] stackBars piles the bars, so the left axis reaches their total', async () => {
    const properties = { data: AB, barFields: binding("{{['a', 'b']}}"), lineFields: binding('{{[]}}') };
    render({ properties });
    await drawn();
    expect(axisTicks(yAxes()[0])).not.toContain('1.2K');

    render({ properties: { ...properties, stackBars: binding('{{true}}') } });
    await drawn();
    expect(axisTicks(yAxes()[0])).toContain('1.2K');
  });

  test('[ShadComboChart-PROP-003] yAxisFormat currency shows money in the chosen currency; rightAxisFormat number drops the percent', async () => {
    render({
      properties: { yAxisFormat: binding('currency'), currency: binding('EUR'), rightAxisFormat: binding('number') },
    });

    await drawn();
    expect(axisTicks(yAxes()[0]).some((t) => t.startsWith('€'))).toBe(true);
    expect(axisTicks(yAxes()[1]).some((t) => t.includes('%'))).toBe(false);
  });

  test('[ShadComboChart-PROP-004] valuePrefix and valueSuffix wrap the left axis ticks', async () => {
    render({ properties: { valuePrefix: binding('~'), valueSuffix: binding(' u') } });

    await drawn();
    expect(
      axisTicks(yAxes()[0])
        .filter((t) => t !== '~0 u')
        .every((t) => /^~[\d.]+K u$/.test(t))
    ).toBe(true);
  });

  test('[ShadComboChart-PROP-005] curve, strokeWidth, showDots and colors shape and colour the line and bars', async () => {
    render();
    await drawn();
    expect(lines()[0].getAttribute('d')).toContain('C');

    render({
      properties: {
        curve: binding('linear'),
        strokeWidth: binding('{{4}}'),
        showDots: binding('{{false}}'),
        colors: binding("{{['#111111', '#222222']}}"),
      },
    });
    await drawn();
    expect(lines()[0].getAttribute('d')).not.toContain('C');
    expect(lines()[0].getAttribute('stroke-width')).toBe('4');
    expect(lines()[0].getAttribute('stroke')).toBe('#222222');
    expect(document.querySelector('.recharts-line-dots')).toBeNull();
    expect(bars()[0].querySelector('path').getAttribute('fill')).toBe('#111111');
  });

  test('[ShadComboChart-PROP-006] seriesLabels rename series; showGrid and showLegend off remove the grid and legend', async () => {
    render({ properties: { seriesLabels: binding("{{{ revenue: 'Income', margin: 'Margin %' }}}") } });
    await drawn();
    expect(legend()).toHaveTextContent('IncomeMargin %');

    render({ properties: { showGrid: binding('{{false}}'), showLegend: binding('{{false}}') } });
    await drawn();
    expect(document.querySelector('.recharts-cartesian-grid')).toBeNull();
    expect(legend()).toBeNull();
  });

  test('[ShadComboChart-PROP-007] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadComboChart-PROP-008] animate turns every series entrance animation on, and off', async () => {
    render({ properties: { animate: binding('{{true}}') } });
    await waitFor(() => expect(animationFlags()).toEqual([true]));

    render({ properties: { animate: binding('{{false}}') } });
    await drawn();
    expect(animationFlags()).toEqual([false]);
  });

  test('[ShadComboChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      {
        barFields: binding('{{null}}'),
        lineFields: binding('{{7}}'),
        rightAxisFields: binding('{{{}}}'),
        stackBars: binding('yes'),
      },
      { data: binding("{{[null, 3, 'x', [], { month: {}, revenue: 'n/a' }]}}"), rightAxisFormat: binding('{{9}}') },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadComboChart-STY-001] chartColor, gridColor, axisTextColor and legendTextColor reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        gridColor: binding('#d4d4d8'),
        axisTextColor: binding('#52525b'),
        legendTextColor: binding('#3f3f46'),
      },
    });

    await drawn();
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-grid')).toBe('#d4d4d8');
    expect(root.style.getPropertyValue('--lk-axis')).toBe('#52525b');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
  });

  test('[ShadComboChart-EVT-001] clicking a month exposes its row as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.comboChart1.clickedDataPoint.month}}' }));
    await drawn();

    await pointer(['mousemove', 'click']);

    await waitFor(() => expect(widget.variables().seen).toBe('Apr'));
    expect(exposed().clickedDataPoint).toMatchObject({ month: 'Apr', revenue: 52800, margin: 34 });
  });

  test('[ShadComboChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn();

    await pointer(['mousemove', 'click', 'click', 'dblclick']);

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadComboChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await drawn();
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ month: 'Apr' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });
});
