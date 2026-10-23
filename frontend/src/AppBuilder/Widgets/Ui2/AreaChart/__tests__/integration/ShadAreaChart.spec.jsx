/**
 * UI 2.0 Area chart: a filled area (or a plain line) per series over a category axis.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for every
 * UI 2.0 widget in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadAreaChart-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'area1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadAreaChart',
  handle: 'areaChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
});

measureChartsAt(W, H);

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const curves = () => document.querySelectorAll('.recharts-area-curve');
const drawn = (selector = '.recharts-area-curve') =>
  waitFor(() => expect(document.querySelectorAll(selector).length).toBeGreaterThan(0));
const ticks = () => [...document.querySelectorAll('.recharts-cartesian-axis-tick-value')].map((t) => t.textContent);
const valueTicks = () => ticks().filter((t) => /^-?[\d.,]+[KM]?$/.test(t));
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
const TWO_SERIES = binding("{{[{ month: 'Jan', a: 600, b: 600 }, { month: 'Feb', a: 400, b: 500 }]}}");

describe('UI 2.0 Area chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadAreaChart-DEF-001] draws one filled area over the months, with compact value ticks and no legend', async () => {
    render();

    await drawn();
    expect(curves()).toHaveLength(1);
    expect(document.querySelector('.recharts-area-area')).toBeInTheDocument();
    expect(ticks()).toEqual(expect.arrayContaining(['Jun', 'Oct', '280K']));
    // One series is named by the chart's title: no legend.
    expect(document.querySelector('.recharts-legend-wrapper')).toBeNull();
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadAreaChart-PROP-001] data, xField and yFields choose what is drawn; counts tick in whole numbers', async () => {
    // Counts (doses, jobs, seats) drew ticks of 0.5 or 0.8, 1.5 and 2.3, which blind reviewers marked down.
    render({
      properties: {
        data: binding(
          "{{[{ name: 'Ana', jobs: 3 }, { name: 'Ben', jobs: 2 }, { name: 'Cy', jobs: 2 }, { name: 'Di', jobs: 1 }]}}"
        ),
        xField: binding('name'),
        yFields: binding("{{['jobs']}}"),
      },
    });

    await drawn();
    expect(ticks()).toEqual(expect.arrayContaining(['Ana', 'Di']));
    expect(valueTicks().length).toBeGreaterThan(1);
    expect(valueTicks().filter((t) => t.includes('.'))).toEqual([]);
  });

  test('[ShadAreaChart-PROP-002] an x axis of ISO dates reads as day and month', async () => {
    render({
      properties: {
        data: binding("{{[{ day: '2026-09-10', visits: 4 }, { day: '2026-09-11', visits: 9 }]}}"),
        xField: binding('day'),
        yFields: binding('visits'),
      },
    });

    await drawn();
    expect(ticks()).toContain('10 Sep');
  });

  test('[ShadAreaChart-PROP-003] valuePrefix and valueSuffix wrap every value tick', async () => {
    render({ properties: { valuePrefix: binding('$'), valueSuffix: binding(' net') } });

    await drawn();
    expect(ticks()).toContain('$280K net');
  });

  test('[ShadAreaChart-PROP-004] showLegend names two series, renamed by seriesLabels', async () => {
    render({
      properties: {
        data: TWO_SERIES,
        yFields: binding("{{['a', 'b']}}"),
        showLegend: binding('{{true}}'),
        seriesLabels: binding("{{{ a: 'Income' }}}"),
      },
    });

    await waitFor(() => expect(curves()).toHaveLength(2));
    expect(document.querySelector('.recharts-legend-wrapper')).toHaveTextContent('Income');
  });

  test('[ShadAreaChart-PROP-005] stack piles the series, so the value axis reaches their total', async () => {
    render({ properties: { data: TWO_SERIES, yFields: binding("{{['a', 'b']}}") } });
    await drawn();
    expect(ticks()).not.toContain('1.2K');

    render({ properties: { data: TWO_SERIES, yFields: binding("{{['a', 'b']}}"), stack: binding('{{true}}') } });
    await drawn();
    expect(ticks()).toContain('1.2K');
  });

  test('[ShadAreaChart-PROP-006] lineOnly draws a line with no fill', async () => {
    render({ properties: { lineOnly: binding('{{true}}') } });

    await drawn('.recharts-line-curve');
    expect(document.querySelector('.recharts-area-area')).toBeNull();
  });

  test('[ShadAreaChart-PROP-007] curve linear draws straight segments, and colors sets the series colour', async () => {
    render();
    await drawn();
    expect(curves()[0].getAttribute('d')).toContain('C');

    render({ properties: { curve: binding('linear'), colors: binding("{{['#0ea5e9']}}") } });
    await drawn();
    expect(curves()[0].getAttribute('d')).not.toContain('C');
    expect(curves()[0].getAttribute('stroke')).toBe('#0ea5e9');
  });

  test('[ShadAreaChart-PROP-008] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadAreaChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      { data: binding("{{[null, 3, 'x', [], { month: {}, revenue: 'n/a' }]}}") },
      {
        yFields: binding('{{{ a: 1 }}}'),
        xField: binding('{{null}}'),
        curve: binding('constructor'),
        colors: binding('red'),
      },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadAreaChart-STY-001] chartColor, axisTextColor, gridColor and legendTextColor reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        axisTextColor: binding('#52525b'),
        gridColor: binding('#d4d4d8'),
        legendTextColor: binding('#3f3f46'),
      },
    });

    await drawn();
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-axis')).toBe('#52525b');
    expect(root.style.getPropertyValue('--lk-grid')).toBe('#d4d4d8');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
  });

  test('[ShadAreaChart-EVT-001] clicking a point exposes it as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.areaChart1.clickedDataPoint.month}}' }));
    await drawn();

    await pointer(['mousemove', 'click']);

    await waitFor(() => expect(widget.variables().seen).toBe('Aug'));
    expect(exposed().clickedDataPoint).toEqual({ month: 'Aug', revenue: 268000 });
  });

  test('[ShadAreaChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn();

    await pointer(['mousemove', 'click', 'click', 'dblclick']);

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadAreaChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await drawn();
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ month: 'Aug' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadAreaChart-PROP-020] Highlight clicked point marks the clicked point until the clicked point is cleared', async () => {
    render({ properties: { highlightClicked: binding('{{true}}') } });
    await drawn();
    const marks = () => document.querySelectorAll('.recharts-reference-dot').length;
    expect(marks()).toBe(0);
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(marks()).toBeGreaterThan(0));
    await widget.act('clearClickedPoint');
    await waitFor(() => expect(marks()).toBe(0));
  });
});
