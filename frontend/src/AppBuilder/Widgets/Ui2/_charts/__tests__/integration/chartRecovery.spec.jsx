/**
 * UI 2.0 charts have one recovery policy (release audit round 2): a chart that throws while drawing says it could not
 * be drawn (not "No data"), and draws again by itself once its properties change, as when a query corrects its data;
 * empty data is the empty state. Line showed the empty message for an error, and Bar the native error box that needed
 * a manual retry. A data row marked __fault makes the chart's data hook throw, as a renderer exception would.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { CONFIGS } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';

jest.mock('@/AppBuilder/Widgets/Ui2/_shared/packHooks', () => {
  const actual = jest.requireActual('@/AppBuilder/Widgets/Ui2/_shared/packHooks');
  return {
    ...actual,
    useStable: (value) => {
      if (Array.isArray(value) && value.some((row) => row && row.__fault)) throw new Error('chart fault');
      return actual.useStable(value);
    },
  };
});

measureChartsAt(400, 200);

const TYPES = [
  'ShadAreaChart',
  'ShadBarChart',
  'ShadLineChart',
  'ShadComboChart',
  'ShadPieChart',
  'ShadRadarChart',
  'ShadRadialChart',
  'ShadScatterChart',
  'ShadFunnelChart',
  'ShadHeatmapChart',
  'ShadSparkline',
];
const state = (container) => container.querySelector('[data-chart-state]')?.getAttribute('data-chart-state');

describe.each(TYPES)('%s recovery', (type) => {
  const widget = createWidgetHarness({
    componentType: type,
    handle: 'chart1',
    id: 'chart1',
    widgetHeight: 200,
    widgetWidth: 400,
  });
  let quiet;
  beforeEach(async () => {
    await widget.setup();
    // React reports the caught render error on the console; that report is this test's subject, not a failure.
    quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    quiet.mockRestore();
    widget.teardown();
  });

  test(`[${type}-RECOVER-001] an error says so, apart from empty data, and the chart draws again with new data`, async () => {
    const extra = type === 'ShadRadialChart' ? { mode: binding('categories') } : {};
    const { container } = widget.render({
      currentMode: 'view',
      properties: { ...extra, data: binding('{{[{ __fault: true }]}}'), emptyText: binding('Nothing yet') },
    });
    await waitFor(() => expect(state(container)).toBe('error'));
    expect(container.textContent).not.toContain('Nothing yet');
    expect(widget.exposed().isVisible).toBe(true);

    widget.setComponentProperty('chart1', 'data', CONFIGS[type].definition.properties.data.value, 'properties');
    await waitFor(() => expect(state(container)).toBeUndefined());
    expect(container.querySelector('.tj-shadcn')).toBeInTheDocument();

    widget.setComponentProperty('chart1', 'data', '{{[]}}', 'properties');
    await waitFor(() => expect(state(container)).toBe('empty'));
    expect(container.textContent).toContain('Nothing yet');
  });
});
