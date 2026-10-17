/**
 * UI 2.0 charts disabled or loading take no clicks: a double click (and a click on a chart without points to pick)
 * fires nothing while setDisable or setLoading is on, as a user expects of a disabled control (release audit 44).
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { fireEvent, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

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

describe.each(TYPES)('%s while disabled or loading', (type) => {
  const widget = createWidgetHarness({
    componentType: type,
    handle: 'chart1',
    id: 'chart1',
    widgetHeight: 200,
    widgetWidth: 400,
  });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  const mount = async () => {
    const view = widget.render({ currentMode: 'view', properties: { animate: binding('{{false}}') } });
    widget.setEvents(countInvocationsOn('chart1', 'onDoubleClick'));
    await waitFor(() => expect(widget.exposed()?.setDisable).toBeInstanceOf(Function));
    // The chart's frame, looked up again after a change (loading can redraw it).
    return () => view.container.querySelector('.tj-shadcn > div');
  };

  test(`[${type}-BUSY-001] a double click fires onDoubleClick only while it is enabled`, async () => {
    const frame = await mount();
    fireEvent.doubleClick(frame());
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    await widget.act('setDisable', true);
    fireEvent.doubleClick(frame());
    await widget.act('setDisable', false);
    await widget.act('setLoading', true);
    if (frame()) fireEvent.doubleClick(frame());
    expect(widget.variables().calls).toBe(1);
  });
});
