/**
 * UI 2.0 charts say what they leave out (release audit round 2): the drawn rows set the scale and the fields, rows past
 * a chart's cap are named in a note under it, and a configured field the data lacks is named, with any field drawn in
 * its place. A hidden 25th funnel stage set the scale of the 24 drawn (every bar at the 6% floor), a row past the
 * 2,000-row cap chose the plotted field (and left the chart empty), and a missing "revenue" drew "amount" unsaid.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

measureChartsAt(400, 300);

const expr = (v) => `{{${JSON.stringify(v)}}}`;
const notes = (container) => [...container.querySelectorAll('[data-chart-note]')].map((n) => n.textContent);
const state = (container) => container.querySelector('[data-chart-state]')?.getAttribute('data-chart-state');
const rows = (n, row) => Array.from({ length: n }, (_, i) => row(i));

const harness = (componentType) =>
  createWidgetHarness({ componentType, handle: 'chart1', id: 'chart1', widgetHeight: 300, widgetWidth: 400 });

describe('a funnel past its 24 stages', () => {
  const widget = harness('ShadFunnelChart');
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadFunnelChart-CAP-001] the drawn stages set the scale, and the hidden stage is named', () => {
    const stages = rows(24, (i) => ({ stage: `S${i + 1}`, count: 240 - i * 10 }));
    stages.push({ stage: 'S25', count: 10000 });
    const { container } = widget.render({
      currentMode: 'view',
      properties: { data: binding(expr(stages)), stageField: binding('stage'), valueField: binding('count') },
    });
    const widths = [...container.querySelectorAll('button span[style]')]
      .map((n) => n.style.width)
      .filter((w) => w.endsWith('%'));
    expect(widths).toHaveLength(24);
    expect(widths[0]).toBe('100%');
    expect(widths[12]).toBe(`${(120 / 240) * 100}%`);
    expect(notes(container)).toEqual(['1 more stage not shown']);
  });
});

describe('field inference over the drawn rows', () => {
  const widget = harness('ShadLineChart');
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadLineChart-CAP-001] a row past the cap neither picks the field nor empties the chart', async () => {
    const data = rows(2000, (i) => ({ month: `m${i}`, amount: i + 1 }));
    data.push({ month: 'late', revenue: 5 });
    const { container } = widget.render({
      currentMode: 'view',
      properties: { data: binding(expr(data)), xField: binding('month'), yFields: binding('revenue') },
    });
    await waitFor(() => expect(state(container)).toBeUndefined());
    expect(notes(container)).toEqual(['The data has no revenue field: showing amount', '1 more row not shown']);
  });
});

describe('a configured field the data lacks', () => {
  const widget = harness('ShadBarChart');
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);
  const data = [
    { category: 'Food', amount: 86, count: 3 },
    { category: 'Rent', amount: 1200, count: 1 },
  ];
  const mount = (yFields, xField = 'category') =>
    widget.render({
      currentMode: 'view',
      properties: { data: binding(expr(data)), xField: binding(xField), yFields: binding(yFields) },
    });

  test('[ShadBarChart-FIELD-001] is named with the fields drawn in its place', () => {
    expect(notes(mount('revenue').container)).toEqual(['The data has no revenue field: showing amount and count']);
  });
  test('[ShadBarChart-FIELD-002] is named when the other configured fields are drawn', () => {
    expect(notes(mount('amount, revenue').container)).toEqual(['The data has no revenue field']);
  });
  test('[ShadBarChart-FIELD-003] an x field the data lacks is named with the one used', () => {
    expect(notes(mount('amount', 'month').container)).toEqual(['The data has no month field: showing category']);
  });
  test('[ShadBarChart-FIELD-004] fields the data has draw with no note', () => {
    expect(notes(mount('amount').container)).toEqual([]);
  });
});

describe.each([
  ['ShadBarChart', 501, (i) => ({ month: `m${i}`, revenue: i }), {}, '1 more bar not shown'],
  ['ShadAreaChart', 2001, (i) => ({ month: `m${i}`, revenue: i }), {}, '1 more row not shown'],
  ['ShadPieChart', 101, (i) => ({ type: `c${i}`, value: i + 1 }), {}, '1 more slice not shown'],
  [
    'ShadRadarChart',
    102,
    (i) => ({ skill: `k${i}`, score: i }),
    { categoryField: binding('skill'), yFields: binding('score') },
    '2 more axes not shown',
  ],
])('%s past its cap', (type, count, row, extra, note) => {
  const widget = harness(type);
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test(`[${type}-CAP-002] names the rows it does not draw`, () => {
    const { container } = widget.render({
      currentMode: 'view',
      properties: { data: binding(expr(rows(count, row))), ...extra },
    });
    expect(notes(container)).toEqual([note]);
  });
});
