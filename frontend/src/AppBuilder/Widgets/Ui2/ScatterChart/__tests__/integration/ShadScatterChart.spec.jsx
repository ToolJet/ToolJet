/**
 * UI 2.0 Scatter chart: a point (or a bubble sized by a field) per row on two value axes, coloured by group.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for every
 * UI 2.0 widget in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadScatterChart-<AREA>-<NNN>] ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'scatter1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadScatterChart',
  handle: 'scatterChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
  // Drawn at once: the entrance animation has its own scenario below.
  defaultProperties: { animate: binding('{{false}}') },
});

let measure;
beforeAll(() => {
  const own = Element.prototype.getBoundingClientRect;
  measure = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    return this.classList?.contains('recharts-responsive-container')
      ? { x: 0, y: 0, top: 0, left: 0, right: W, bottom: H, width: W, height: H }
      : own.call(this);
  });
});
afterAll(() => measure.mockRestore());

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const points = () => document.querySelectorAll('.recharts-symbols');
const drawn = (count = 8) => waitFor(() => expect(points()).toHaveLength(count));
const axisTicks = (axis) =>
  [...document.querySelectorAll(`.recharts-${axis}Axis .recharts-cartesian-axis-tick-value`)].map((t) => t.textContent);
const legend = () => document.querySelector('.recharts-legend-wrapper');
const sizes = () => new Set([...points()].map((p) => p.getAttribute('d'))).size;
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

describe('UI 2.0 Scatter chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadScatterChart-DEF-001] draws a bubble per account, a legend entry per segment, titled axes and a grid', async () => {
    render();

    await drawn(8);
    expect(legend()).toHaveTextContent('Mid-marketEnterpriseSMB');
    expect(screen.getByText('Marketing spend ($k)')).toBeInTheDocument();
    expect(screen.getByText('Revenue ($k)')).toBeInTheDocument();
    expect(document.querySelector('.recharts-cartesian-grid')).toBeInTheDocument();
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadScatterChart-PROP-001] data, xField, yField and groupField choose the points; one group needs no legend', async () => {
    render({
      properties: {
        data: binding('{{[{ h: 1, w: 60, kind: "a" }, { h: 2, w: 75, kind: "b" }, { h: 3, w: 90, kind: "a" }]}}'),
        xField: binding('h'),
        yField: binding('w'),
        groupField: binding(''),
        sizeField: binding(''),
      },
    });

    await drawn(3);
    expect(legend()).toBeNull();
    expect(axisTicks('y').join(' ')).toContain('90');
  });

  test('[ShadScatterChart-PROP-002] sizeField sizes each bubble by its value; without it every point has pointSize', async () => {
    render();
    await drawn(8);
    expect(sizes()).toBeGreaterThan(3);

    render({ properties: { sizeField: binding(''), pointSize: binding('{{6}}') } });
    await drawn(8);
    expect(sizes()).toBe(1);
    const small = points()[0].getAttribute('d');
    render({ properties: { sizeField: binding(''), pointSize: binding('{{12}}') } });
    await drawn(8);
    expect(points()[0].getAttribute('d')).not.toBe(small);
    expect(sizes()).toBe(1);
  });

  test('[ShadScatterChart-PROP-003] hovering a point shows its nameField, with the xLabel and yLabel names for its values', async () => {
    render({ properties: { nameField: binding('account'), xLabel: binding('Spend'), yLabel: binding('Income') } });
    await drawn(8);

    await act(async () => fireEvent.mouseEnter(document.querySelector('.recharts-scatter-symbol')));

    expect(await screen.findByText('Northwind')).toBeInTheDocument();
    expect(screen.getAllByText('Spend').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Income').length).toBeGreaterThan(1);
  });

  test('[ShadScatterChart-PROP-004] xAxisFormat and yAxisFormat currency show the chosen currency; valuePrefix and valueSuffix wrap y', async () => {
    render({
      properties: { xAxisFormat: binding('currency'), yAxisFormat: binding('currency'), currency: binding('EUR') },
    });
    await drawn(8);
    expect(axisTicks('x').every((t) => t.startsWith('€'))).toBe(true);
    expect(axisTicks('y').every((t) => t.startsWith('€'))).toBe(true);

    render({ properties: { valuePrefix: binding('~'), valueSuffix: binding(' k') } });
    await drawn(8);
    expect(axisTicks('y').every((t) => /^~\d+ k$/.test(t))).toBe(true);
    expect(axisTicks('x').some((t) => t.includes('~'))).toBe(false);
  });

  test('[ShadScatterChart-PROP-005] referenceX and referenceY draw a dashed line across each axis', async () => {
    render();
    await drawn(8);
    expect(document.querySelectorAll('.recharts-reference-line')).toHaveLength(0);

    render({ properties: { referenceX: binding('{{20}}'), referenceY: binding('{{60}}') } });
    await drawn(8);
    expect(document.querySelectorAll('.recharts-reference-line')).toHaveLength(2);
  });

  test('[ShadScatterChart-PROP-006] fillOpacity sets how solid the points are, and colors the group colours', async () => {
    render({
      properties: { fillOpacity: binding('{{0.2}}'), colors: binding("{{['#111111', '#222222', '#333333']}}") },
    });

    await drawn(8);
    expect(points()[0].getAttribute('fill-opacity')).toBe('0.2');
    expect(new Set([...points()].map((p) => p.getAttribute('fill')))).toEqual(
      new Set(['#111111', '#222222', '#333333'])
    );
  });

  test('[ShadScatterChart-PROP-007] showGrid and showLegend off remove the grid and the legend', async () => {
    render({ properties: { showGrid: binding('{{false}}'), showLegend: binding('{{false}}') } });

    await drawn(8);
    expect(document.querySelector('.recharts-cartesian-grid')).toBeNull();
    expect(legend()).toBeNull();
  });

  test('[ShadScatterChart-PROP-008] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadScatterChart-PROP-009] animate turns every series entrance animation on, and off', async () => {
    render({ properties: { animate: binding('{{true}}') } });
    await waitFor(() => expect(animationFlags()).toEqual([true]));

    render({ properties: { animate: binding('{{false}}') } });
    await drawn(8);
    expect(animationFlags()).toEqual([false]);
  });

  test('[ShadScatterChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      {
        sizeField: binding('{{{}}}'),
        groupField: binding('{{[]}}'),
        nameField: binding('{{null}}'),
        pointSize: binding('{{-3}}'),
      },
      { referenceX: binding('x'), referenceY: binding('{{{}}}'), xAxisFormat: binding('{{1}}') },
      { data: binding("{{[null, 3, 'x', [], { spend: {}, revenue: 'n/a' }]}}") },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadScatterChart-STY-001] chartColor, gridColor, axisTextColor, legendTextColor and referenceLineColor reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        gridColor: binding('#d4d4d8'),
        axisTextColor: binding('#52525b'),
        legendTextColor: binding('#3f3f46'),
        referenceLineColor: binding('#0ea5e9'),
      },
    });

    await drawn(8);
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-grid')).toBe('#d4d4d8');
    expect(root.style.getPropertyValue('--lk-axis')).toBe('#52525b');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
    expect(root.style.getPropertyValue('--lk-ref')).toBe('#0ea5e9');
  });

  test('[ShadScatterChart-EVT-001] clicking a point exposes its row as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.scatterChart1.clickedDataPoint.account}}' }));
    await drawn(8);

    await act(async () => fireEvent.click(points()[0]));

    await waitFor(() => expect(widget.variables().seen).toBe('Northwind'));
    expect(exposed().clickedDataPoint).toEqual({
      account: 'Northwind',
      spend: 12,
      revenue: 48,
      seats: 40,
      segment: 'Mid-market',
    });
  });

  test('[ShadScatterChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn(8);

    await act(async () => fireEvent.doubleClick(points()[0]));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadScatterChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await drawn(8);
    await act(async () => fireEvent.click(points()[0]));
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ account: 'Northwind' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });
});
