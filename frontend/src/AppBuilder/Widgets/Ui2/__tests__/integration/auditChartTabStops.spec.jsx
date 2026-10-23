// Found by a keyboard end-user test (19 Oct): a Combo chart's svg and a Pie chart's sectors were tab stops with no
// name. A chart is read as one named image (its drawn shapes are hidden from assistive tech), so nothing inside it
// takes focus: the Line and Combo charts no longer turn on Recharts' keyboard layer, and the Pie's sectors are not
// tab stops.
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { waitFor } from '@testing-library/react';

const W = 480;
const H = 280;
measureChartsAt(W, H);

const ROWS = "{{[{ month: 'Jan', spend: 4, budget: 5 }, { month: 'Feb', spend: 6, budget: 5 }]}}";
const CASES = [
  ['ShadLineChart', { data: binding(ROWS), xField: binding('month'), series: binding('spend') }],
  [
    'ShadComboChart',
    { data: binding(ROWS), xField: binding('month'), barFields: binding('spend'), lineFields: binding('budget') },
  ],
  ['ShadPieChart', { data: binding(ROWS), nameField: binding('month'), valueField: binding('spend') }],
];

describe.each(CASES)('%s', (type, properties) => {
  const w = createWidgetHarness({
    componentType: type,
    handle: 'chart1',
    id: 'chart1',
    widgetHeight: H,
    widgetWidth: W,
    defaultProperties: { animate: binding('{{false}}') },
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test('[UI2-AUDIT-CHARTFOCUS-001] is one named image with no tab stop inside', async () => {
    w.render({ currentMode: 'view', properties });
    await waitFor(() => expect(document.querySelector('.recharts-surface')).not.toBeNull());
    const image = document.querySelector('[role="img"][aria-label]');
    expect(image).not.toBeNull();
    expect(image.querySelectorAll('[tabindex]:not([tabindex="-1"])')).toHaveLength(0);
  });
});
