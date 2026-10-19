// Release audit round 3 (Codex fixtures reviewRepeatedChartSvgIdentity and reviewRepeatedStatSvgIdentity, trimmed):
// an Area chart, Sparkline or Stat trend in a List view drew every row's fill with the first row's gradient (its
// colour): the gradient id was built from the component id, which every row shares, and SVG ids are document-wide.
// Each rendered instance now has its own id.
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { screen, waitFor } from '@testing-library/react';

measureChartsAt(480, 240);
let descriptor;
beforeAll(() => {
  descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
});
afterAll(() => {
  if (descriptor) Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
  else delete Element.prototype.clientWidth;
});

const ROWS = [
  { id: 'a', name: 'Alpha', color: '#ff0000' },
  { id: 'b', name: 'Beta', color: '#0000ff' },
];
const listHarness = (preload) =>
  createWidgetHarness({
    componentType: 'ShadListView',
    id: 'list1',
    handle: 'list1',
    widgetWidth: 600,
    widgetHeight: 600,
    capabilities: { dnd: true },
    preload,
  });
const inList = (w, child, height) => {
  child.component.parent = 'list1';
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height } };
  return w.render({
    currentMode: 'view',
    extraComponents: { [child.component.name]: child },
    properties: { data: binding(`{{${JSON.stringify(ROWS)}}}`), enablePagination: binding('{{false}}') },
  });
};
const ids = (gradients) => gradients.map((g) => g.id);

describe('charts', () => {
  const w = listHarness(['ShadAreaChart', 'ShadSparkline']);
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test.each(['ShadAreaChart', 'ShadSparkline'])('each %s row fills with its own gradient', async (type) => {
    const properties =
      type === 'ShadAreaChart'
        ? {
            data: binding('{{[{x:"a",y:1},{x:"b",y:3}]}}'),
            xField: binding('x'),
            yFields: binding('{{["y"]}}'),
            colors: binding('{{[listItem.color]}}'),
          }
        : { data: binding('{{[1,3,2]}}'), type: binding('area') };
    properties.animate = binding('{{false}}');
    const view = inList(w, componentDefinition('chart1', 'chart1', type, properties), 260);
    await waitFor(() => expect(view.container.querySelectorAll('.recharts-area-area')).toHaveLength(2));
    const gradients = [...view.container.querySelectorAll('linearGradient')];
    expect(new Set(ids(gradients)).size).toBe(2);
    const fills = [...view.container.querySelectorAll('.recharts-area-area')].map((n) => n.getAttribute('fill'));
    expect(fills).toEqual(ids(gradients).map((id) => `url(#${id})`));
    if (type === 'ShadAreaChart') {
      expect(gradients.map((g) => g.querySelector('stop').getAttribute('stop-color'))).toEqual(['#ff0000', '#0000ff']);
    }
  });
});

describe('Stat', () => {
  const w = listHarness(['ShadStat']);
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test('each Stat row fills its trend with its own gradient', async () => {
    const child = componentDefinition('stat1', 'stat1', 'ShadStat', {
      label: binding('{{listItem.name}}'),
      value: binding('{{listItem.id}}'),
      trendData: binding('{{[1,3,2]}}'),
      sparklineType: binding('area'),
    });
    child.component.definition.styles = { sparklineColor: binding('{{listItem.color}}') };
    const view = inList(w, child, 180);
    await screen.findByText('Beta');
    await waitFor(() => expect(view.container.querySelectorAll('svg[viewBox="0 0 120 36"]')).toHaveLength(2));
    const charts = [...view.container.querySelectorAll('svg[viewBox="0 0 120 36"]')];
    const gradients = charts.map((c) => c.querySelector('linearGradient'));
    expect(new Set(ids(gradients)).size).toBe(2);
    charts.forEach((c, i) =>
      expect(c.querySelector('path[fill^="url"]')).toHaveAttribute('fill', `url(#${gradients[i].id})`)
    );
  });
});
