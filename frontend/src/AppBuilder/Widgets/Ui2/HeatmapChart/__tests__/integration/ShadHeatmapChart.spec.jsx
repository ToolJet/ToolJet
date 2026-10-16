/**
 * UI 2.0 Heatmap chart: a grid of cells (weekday by hour, region by month) shaded by value, with a min-to-max legend.
 * Plain HTML, so it needs no layout to draw.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in
 * Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadHeatmapChart-<AREA>-<NNN>] ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'heat1';
const widget = createWidgetHarness({
  componentType: 'ShadHeatmapChart',
  handle: 'heatmapChart1',
  id: ID,
  widgetHeight: 280,
  widgetWidth: 480,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const cells = () => screen.queryAllByRole('button');
const drawn = (count) => waitFor(() => expect(cells()).toHaveLength(count));
const legend = () => document.querySelector('.w-24')?.parentElement ?? null;
const TWO = binding(
  "{{[{ day: 'Mon', hour: '09:00', tickets: 4 }, { day: 'Tue', hour: '09:00', tickets: 9 }, { day: 'Tue', hour: '10:00', tickets: 1200 }]}}"
);

describe('UI 2.0 Heatmap chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadHeatmapChart-DEF-001] draws a cell per day and hour, the strongest in the chart colour, with a legend', async () => {
    render();

    await drawn(7 * 6);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(cells().some((c) => c.dataset.strength === '1.00')).toBe(true);
    expect(cells().some((c) => c.dataset.strength === '0.00')).toBe(true);
    // Values are in each cell's title, not printed.
    expect(cells()[0].getAttribute('title')).toMatch(/^Mon · 08:00: \d+$/);
    expect(cells()[0]).toHaveTextContent('');
    expect(legend()).toBeInTheDocument();
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadHeatmapChart-PROP-001] data, xField, yField and valueField choose the grid, and showValues prints the values', async () => {
    render({
      properties: {
        data: binding("{{[{ region: 'North', month: 'Jan', units: 4 }, { region: 'South', month: 'Jan', units: 9 }]}}"),
        xField: binding('month'),
        yField: binding('region'),
        valueField: binding('units'),
        showValues: binding('{{true}}'),
      },
    });

    await drawn(2);
    expect(screen.getByText('South')).toBeInTheDocument();
    expect(cells().map((c) => c.textContent)).toEqual(['4', '9']);
  });

  test('[ShadHeatmapChart-PROP-002] xOrder and yOrder set the order of the columns and the rows', async () => {
    render({
      properties: {
        xOrder: binding("{{['18:00', '16:00', '14:00', '12:00', '10:00', '08:00']}}"),
        yOrder: binding("{{['Sun', 'Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon']}}"),
      },
    });

    await drawn(7 * 6);
    expect(cells()[0].getAttribute('title')).toMatch(/^Sun · 18:00: /);
    expect(cells()[41].getAttribute('title')).toMatch(/^Mon · 08:00: /);
  });

  test('[ShadHeatmapChart-PROP-003] cellGap sets the space between cells', async () => {
    render({ properties: { cellGap: binding('{{8}}') } });

    await drawn(7 * 6);
    expect(cells()[0].parentElement.style.gap).toBe('8px');
  });

  test('[ShadHeatmapChart-PROP-004] yAxisFormat, currency, valuePrefix and valueSuffix format the values and the legend', async () => {
    render({
      properties: {
        data: TWO,
        showValues: binding('{{true}}'),
        yAxisFormat: binding('currency'),
        currency: binding('EUR'),
      },
    });
    await drawn(4);
    expect(screen.getByText('€9')).toBeInTheDocument();
    expect(legend()).toHaveTextContent('€4');
    expect(legend()).toHaveTextContent('€1,200');

    render({
      properties: {
        data: TWO,
        showValues: binding('{{true}}'),
        yAxisFormat: binding('compact'),
        valuePrefix: binding('~'),
        valueSuffix: binding(' calls'),
      },
    });
    await drawn(4);
    expect(screen.getAllByText('~1.2K calls').length).toBeGreaterThan(0);
  });

  test('[ShadHeatmapChart-PROP-005] showLegend off removes the legend', async () => {
    render({ properties: { showLegend: binding('{{false}}') } });

    await drawn(7 * 6);
    expect(legend()).toBeNull();
  });

  test('[ShadHeatmapChart-PROP-006] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadHeatmapChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      { xOrder: binding('x'), yOrder: binding('{{{}}}'), cellGap: binding('big'), showValues: binding('yes') },
      { data: binding("{{[null, 3, 'x', [], { day: {}, tickets: 'n/a' }]}}"), xField: binding('{{[1, 2]}}') },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadHeatmapChart-STY-001] chartColor, axisTextColor and legendTextColor reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        axisTextColor: binding('#52525b'),
        legendTextColor: binding('#3f3f46'),
      },
    });

    await drawn(7 * 6);
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-axis')).toBe('#52525b');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
  });

  test('[ShadHeatmapChart-EVT-001] clicking a cell exposes its row, column and value as clickedDataPoint and fires onClick', async () => {
    render({ properties: { data: TWO } });
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.heatmapChart1.clickedDataPoint.tickets}}' }));
    await drawn(4);

    await act(async () => fireEvent.click(cells()[2]));

    await waitFor(() => expect(widget.variables().seen).toBe(9));
    expect(exposed().clickedDataPoint).toEqual({ day: 'Tue', hour: '09:00', tickets: 9 });
  });

  test('[ShadHeatmapChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn(7 * 6);

    await act(async () => fireEvent.doubleClick(cells()[1]));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadHeatmapChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render({ properties: { data: TWO } });
    await drawn(4);
    await act(async () => fireEvent.click(cells()[2]));
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ day: 'Tue' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });
});
