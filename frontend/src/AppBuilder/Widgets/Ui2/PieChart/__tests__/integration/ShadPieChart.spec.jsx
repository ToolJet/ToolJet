/**
 * UI 2.0 Pie chart: a slice per row, as a donut (with an optional centre figure) or a full pie.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Slices sweep in (the pie always animates), so assertions on slices wait for them. Standard
 * control behaviour (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in
 * Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadPieChart-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'pie1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadPieChart',
  handle: 'pieChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
});

measureChartsAt(W, H);

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const slices = () => document.querySelectorAll('.recharts-pie-sector path');
const slicesDrawn = (count) => waitFor(() => expect(slices()).toHaveLength(count), { timeout: 3000 });
const legend = () => document.querySelector('.recharts-legend-wrapper');

describe('UI 2.0 Pie chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadPieChart-DEF-001] draws a donut with a slice per row and a legend naming them', async () => {
    render();

    await slicesDrawn(3);
    expect(legend()).toHaveTextContent('CharterDay tripEvent');
    // A donut's slices are parted by a wide border.
    expect(slices()[0].getAttribute('stroke-width')).toBe('4');
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadPieChart-PROP-001] data, categoryField and valueField choose the slices and their names', async () => {
    render({
      properties: {
        data: binding("{{[{ kind: 'Paid', amount: 5, value: 1 }, { kind: 'Due', amount: 3, value: 1 }]}}"),
        categoryField: binding('kind'),
        valueField: binding('amount'),
      },
    });

    await slicesDrawn(2);
    expect(legend()).toHaveTextContent('PaidDue');
  });

  test('[ShadPieChart-PROP-002] centerValue and centerLabel sit in the donut hole', async () => {
    render({ properties: { centerValue: binding('100'), centerLabel: binding('bookings') } });

    await slicesDrawn(3);
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    expect(screen.getByText('bookings')).toBeInTheDocument();
  });

  test('[ShadPieChart-PROP-003] donut off draws a full pie with thin borders and no centre figure', async () => {
    render({
      properties: { donut: binding('{{false}}'), centerValue: binding('100'), centerLabel: binding('bookings') },
    });

    await slicesDrawn(3);
    expect(slices()[0].getAttribute('stroke-width')).toBe('1');
    expect(screen.queryByText('bookings')).toBeNull();
  });

  test('[ShadPieChart-PROP-004] showLegend off removes the legend, and colors sets the slice colours', async () => {
    render({
      properties: { showLegend: binding('{{false}}'), colors: binding("{{['#111111', '#222222', '#333333']}}") },
    });

    await slicesDrawn(3);
    expect(legend()).toBeNull();
    expect([...slices()].map((s) => s.getAttribute('fill'))).toEqual(['#111111', '#222222', '#333333']);
  });

  test('[ShadPieChart-PROP-005] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadPieChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      { data: binding("{{[null, 3, 'x', [], { type: {}, value: 'n/a' }]}}") },
      { categoryField: binding('{{42}}'), valueField: binding('{{undefined}}'), centerValue: binding('{{{}}}') },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadPieChart-STY-001] chartColor, sliceBorderColor, legendTextColor and the centre colours reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        sliceBorderColor: binding('#ffffff'),
        legendTextColor: binding('#3f3f46'),
        centerValueColor: binding('#18181b'),
        centerLabelColor: binding('#71717a'),
      },
    });

    await slicesDrawn(3);
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-slice-border')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
    expect(root.style.getPropertyValue('--lk-center-value')).toBe('#18181b');
    expect(root.style.getPropertyValue('--lk-center-label')).toBe('#71717a');
  });

  test('[ShadPieChart-EVT-001] clicking a slice exposes its row as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.pieChart1.clickedDataPoint.type}}' }));
    await slicesDrawn(3);

    await act(async () => fireEvent.click(slices()[1]));

    await waitFor(() => expect(widget.variables().seen).toBe('Day trip'));
    expect(exposed().clickedDataPoint).toMatchObject({ type: 'Day trip', value: 24 });
  });

  test('[ShadPieChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await slicesDrawn(3);

    await act(async () => fireEvent.doubleClick(slices()[0]));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadPieChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await slicesDrawn(3);
    await act(async () => fireEvent.click(slices()[0]));
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ type: 'Charter' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadPieChart-PROP-020] Highlight clicked point fades the other slices until the clicked point is cleared', async () => {
    render({ properties: { highlightClicked: binding('{{true}}') } });
    await slicesDrawn(3);
    const faded = () => [...slices()].filter((s) => s.getAttribute('fill-opacity') === '0.35').length;
    await act(async () => fireEvent.click(slices()[1]));
    await waitFor(() => expect(faded()).toBe(2));
    await widget.act('clearClickedPoint');
    await waitFor(() => expect(faded()).toBe(0));
  });
});
