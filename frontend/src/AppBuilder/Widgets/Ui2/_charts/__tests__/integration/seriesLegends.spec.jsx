/**
 * UI 2.0 charts name each series by its own configured label when another configured field is missing from the data
 * (release audit 41): rows without revenue drew cost as "Revenue".
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

measureChartsAt(600, 300);

const ROWS = "{{[{ day: 'Mon', cost: 85, tax: 10 }, { day: 'Tue', cost: 90, tax: 12 }]}}";
const legend = () => [...document.querySelectorAll('.recharts-legend-wrapper span')].map((n) => n.textContent);

describe.each([
  ['ShadLineChart', { xField: binding('day'), yFields: binding("{{['revenue', 'cost', 'tax']}}") }],
  ['ShadBarChart', { xField: binding('day'), yFields: binding("{{['revenue', 'cost', 'tax']}}") }],
  ['ShadAreaChart', { xField: binding('day'), yFields: binding("{{['revenue', 'cost', 'tax']}}") }],
  ['ShadRadarChart', { categoryField: binding('day'), yFields: binding("{{['revenue', 'cost', 'tax']}}") }],
])('%s with a configured series missing from the data', (type, fields) => {
  const widget = createWidgetHarness({
    componentType: type,
    handle: 'chart1',
    id: 'chart1',
    widgetWidth: 600,
    widgetHeight: 300,
  });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test(`[${type}-SER-001] the legend names each drawn series by its own label`, async () => {
    widget.render({
      currentMode: 'view',
      properties: {
        ...fields,
        data: binding(ROWS),
        seriesLabels: binding("{{['Revenue', 'Cost', 'Tax']}}"),
        showLegend: binding('{{true}}'),
        animate: binding('{{false}}'),
      },
    });
    await waitFor(() => expect(legend().length).toBeGreaterThan(0));
    expect(legend().filter((t) => t.trim())).toEqual(['Cost', 'Tax']);
  });
});
