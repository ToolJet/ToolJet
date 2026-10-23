/**
 * UI 2.0 Bar chart: a bar per row and series, upright or horizontal, stacked or side by side, with one bar or one
 * category picked out.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Bars grow in (the bar chart always animates), so assertions on bars wait for them. Standard
 * control behaviour (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in
 * Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadBarChart-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'bar1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadBarChart',
  handle: 'barChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
});

measureChartsAt(W, H);

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const bars = () => document.querySelectorAll('.recharts-rectangle');
const barsDrawn = (count) => waitFor(() => expect(bars()).toHaveLength(count), { timeout: 3000 });
const axisDrawn = () =>
  waitFor(() => expect(document.querySelectorAll('.recharts-cartesian-axis-tick-value').length).toBeGreaterThan(0));
const ticks = () => [...document.querySelectorAll('.recharts-cartesian-axis-tick-value')].map((t) => t.textContent);
// The tick labels of the value axis: numbers only (the category axis shows names).
const valueTicks = () => ticks().filter((t) => /^-?[\d.,]+$/.test(t.trim()));
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
const COUNTS = {
  data: binding(
    "{{[{ name: 'Ana', jobs: 3 }, { name: 'Ben', jobs: 2 }, { name: 'Cy', jobs: 2 }, { name: 'Di', jobs: 1 }]}}"
  ),
  xField: binding('name'),
  yFields: binding('jobs'),
};
const TWO_SERIES = {
  data: binding("{{[{ month: 'Jan', a: 600, b: 600 }, { month: 'Feb', a: 400, b: 500 }]}}"),
  yFields: binding("{{['a', 'b']}}"),
};
const faded = () => [...bars()].filter((b) => b.getAttribute('fill-opacity') === '0.32').length;

describe('UI 2.0 Bar chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadBarChart-DEF-001] draws a bar per month, names every bar, and shows no legend for one series', async () => {
    render();

    await barsDrawn(5);
    // Each name is drawn once, with its full name as a title for when it is cut.
    expect(screen.getAllByText('Jun').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Oct').length).toBeGreaterThan(0);
    expect(ticks()).toContain('280K');
    expect(document.querySelector('.recharts-legend-wrapper')).toBeNull();
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadBarChart-PROP-001] data, xField and yFields choose the bars; counts tick in whole numbers, fractions keep decimals', async () => {
    // Counts (doses, jobs, seats) drew ticks of 0.5, or 0.8, 1.5 and 2.3, which blind reviewers marked down.
    render({ properties: COUNTS });
    await barsDrawn(4);
    expect(valueTicks().length).toBeGreaterThan(1);
    expect(valueTicks().filter((t) => t.includes('.'))).toEqual([]);

    render({
      properties: {
        data: binding("{{[{ name: 'a', rate: 0.25 }, { name: 'b', rate: 0.5 }]}}"),
        xField: binding('name'),
        yFields: binding("{{['rate']}}"),
      },
    });
    await barsDrawn(2);
    expect(valueTicks().some((t) => t.includes('.'))).toBe(true);
  });

  test('[ShadBarChart-PROP-002] horizontal lays the bars sideways, names on the left, counts still in whole numbers', async () => {
    render({ properties: { ...COUNTS, horizontal: binding('{{true}}') } });

    await barsDrawn(4);
    expect(document.querySelector('.recharts-yAxis')).toHaveTextContent('Ana');
    expect(valueTicks().length).toBeGreaterThan(1);
    expect(valueTicks().filter((t) => t.includes('.'))).toEqual([]);
  });

  test('[ShadBarChart-PROP-003] category names wider than their bands are angled and whole; names that fit stay level', async () => {
    // Ten genres in a half-width chart cut one-word names to "Ficti..." and "Child..." (bookshop, 2026-10-14).
    const genres = ['Fiction', 'Crime', "Children's", 'Romance', 'Fantasy', 'Science', 'Cookery', 'Poetry', 'History'];
    const data = [...genres, 'Historical Fiction'].map((name, i) => ({ name, sales: 30 - i * 2 }));
    render({
      properties: { data: binding(`{{${JSON.stringify(data)}}}`), xField: binding('name'), yFields: binding('sales') },
    });
    await axisDrawn();
    const names = () => [...document.querySelectorAll('.recharts-xAxis text')];
    expect(names().some((t) => /rotate\(-35/.test(t.getAttribute('transform') || ''))).toBe(true);
    expect(document.querySelector('.recharts-xAxis')).toHaveTextContent("Children's");
    expect(document.querySelector('.recharts-xAxis').textContent).not.toContain('…');

    render({ properties: COUNTS });
    await axisDrawn();
    expect(names().some((t) => /rotate/.test(t.getAttribute('transform') || ''))).toBe(false);
  });

  test('[ShadBarChart-PROP-004] highlight keeps the named bar (or the largest, with max) in full and fades the rest', async () => {
    render();
    await barsDrawn(5);
    expect(faded()).toBe(0);

    render({ properties: { highlight: binding('Jul') } });
    await barsDrawn(5);
    expect(faded()).toBe(4);
    expect(bars()[1].getAttribute('fill-opacity')).not.toBe('0.32');

    render({ properties: { highlight: binding('max') } });
    await barsDrawn(5);
    expect(faded()).toBe(4);
    expect(bars()[2].getAttribute('fill-opacity')).not.toBe('0.32'); // Aug, the largest
  });

  test('[ShadBarChart-PROP-005] categoryColors colours each named category its own colour', async () => {
    render({
      properties: {
        data: binding("{{[{ result: 'Won', deals: 3 }, { result: 'Lost', deals: 2 }]}}"),
        xField: binding('result'),
        yFields: binding('deals'),
        categoryColors: binding("{{{ Won: '#16a34a', Lost: '#dc2626' }}}"),
      },
    });

    await barsDrawn(2);
    expect([...bars()].map((r) => r.getAttribute('fill'))).toEqual(['#16a34a', '#dc2626']);
  });

  test('[ShadBarChart-PROP-006] stack piles the series, so the value axis reaches their total', async () => {
    render({ properties: TWO_SERIES });
    await barsDrawn(4);
    expect(ticks()).not.toContain('1.2K');

    render({ properties: { ...TWO_SERIES, stack: binding('{{true}}') } });
    await barsDrawn(4);
    expect(ticks()).toContain('1.2K');
  });

  test('[ShadBarChart-PROP-007] showLegend names two series, renamed by seriesLabels, in the colours of colors', async () => {
    render({
      properties: {
        ...TWO_SERIES,
        showLegend: binding('{{true}}'),
        seriesLabels: binding("{{{ a: 'Income' }}}"),
        colors: binding("{{['#111111', '#222222']}}"),
      },
    });

    await barsDrawn(4);
    expect(document.querySelector('.recharts-legend-wrapper')).toHaveTextContent('Income');
    expect([...bars()].map((b) => b.getAttribute('fill'))).toEqual(['#111111', '#111111', '#222222', '#222222']);
  });

  test('[ShadBarChart-PROP-008] valuePrefix and valueSuffix wrap every value tick', async () => {
    render({ properties: { valuePrefix: binding('$'), valueSuffix: binding(' net') } });

    await axisDrawn();
    expect(ticks()).toContain('$280K net');
  });

  test('[ShadBarChart-PROP-009] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadBarChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      { data: binding("{{[null, 3, 'x', [], { month: {}, revenue: 'n/a' }]}}") },
      {
        yFields: binding('{{{ a: 1 }}}'),
        xField: binding('{{null}}'),
        highlight: binding('{{[null]}}'),
        categoryColors: binding('{{[1]}}'),
      },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadBarChart-STY-001] chartColor, gridColor, axisTextColor and legendTextColor reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        gridColor: binding('#d4d4d8'),
        axisTextColor: binding('#52525b'),
        legendTextColor: binding('#3f3f46'),
      },
    });

    await axisDrawn();
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-grid')).toBe('#d4d4d8');
    expect(root.style.getPropertyValue('--lk-axis')).toBe('#52525b');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
  });

  test('[ShadBarChart-STY-002] highlightColor and mutedColor colour the highlighted bar and the rest, which then are not faded', async () => {
    render({
      properties: { highlight: binding('Jul') },
      styles: { highlightColor: binding('#f59e0b'), mutedColor: binding('#e4e4e7') },
    });

    await barsDrawn(5);
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-highlight')).toBe('#f59e0b');
    expect(root.style.getPropertyValue('--lk-muted-bar')).toBe('#e4e4e7');
    expect([...bars()].map((b) => b.getAttribute('fill'))).toEqual([
      'var(--lk-muted-bar)',
      'var(--lk-highlight)',
      'var(--lk-muted-bar)',
      'var(--lk-muted-bar)',
      'var(--lk-muted-bar)',
    ]);
    expect(faded()).toBe(0);
  });

  test('[ShadBarChart-EVT-001] clicking a bar exposes its row as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.barChart1.clickedDataPoint.month}}' }));
    await barsDrawn(5);

    await pointer(['mousemove', 'click']);

    await waitFor(() => expect(widget.variables().seen).toBe('Aug'));
    expect(exposed().clickedDataPoint).toEqual({ month: 'Aug', revenue: 268000 });
  });

  test('[ShadBarChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await barsDrawn(5);

    await pointer(['mousemove', 'click', 'click', 'dblclick']);

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadBarChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await barsDrawn(5);
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ month: 'Aug' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadBarChart-PROP-020] Highlight clicked point draws the clicked bar whole and fades the others until cleared', async () => {
    // A clicked bar looked like every other bar: the chart showed nothing of what clickedDataPoint held.
    render({ properties: { highlightClicked: binding('{{true}}') } });
    await barsDrawn(5);
    // The data bars, not the hover cursor's band.
    const dataBars = () => [...bars()].filter((b) => !b.classList.contains('recharts-tooltip-cursor'));
    const opacities = () => dataBars().map((b) => b.getAttribute('fill-opacity'));
    expect(opacities().filter((o) => o === '0.35')).toHaveLength(0);

    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({ month: 'Aug', revenue: 268000 }));
    await waitFor(() => expect(opacities().filter((o) => o === '0.35')).toHaveLength(4));
    expect(opacities().filter((o) => o === '1')).toHaveLength(1);

    await widget.act('clearClickedPoint');
    await waitFor(() => expect(opacities().filter((o) => o === '0.35')).toHaveLength(0));

    // Off (the default), a click highlights nothing.
    render({ properties: { highlightClicked: binding('{{false}}') } });
    await waitFor(() => expect(dataBars()).toHaveLength(5));
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({ month: 'Aug', revenue: 268000 }));
    expect(opacities().filter((o) => o === '0.35')).toHaveLength(0);
  });
});
