import { comboSeries, funnelStages, scatterGroups } from '../chartsModel';

describe('funnelStages', () => {
  const data = [
    { stage: 'Visited', count: 1000 },
    { stage: 'Signed up', count: 400 },
    { stage: 'Activated', count: 250 },
    { stage: 'Paid', count: 50 },
  ];

  it('gives each stage its share of the widest, of the first and of the one before', () => {
    const stages = funnelStages(data, 'stage', 'count');
    expect(stages.map((s) => s.label)).toEqual(['Visited', 'Signed up', 'Activated', 'Paid']);
    expect(stages.map((s) => s.width)).toEqual([1, 0.4, 0.25, 0.05]);
    expect(stages.map((s) => s.ofFirst)).toEqual([100, 40, 25, 5]);
    expect(stages.map((s) => s.ofPrevious)).toEqual([null, 40, 62.5, 20]);
    expect(stages[1].row).toBe(data[1]);
  });

  it('falls back to the first text and first number fields when the named ones are missing', () => {
    const stages = funnelStages(
      [
        { name: 'Lead', amount: '200' },
        { name: 'Won', amount: 50 },
      ],
      'stage',
      'count'
    );
    expect(stages.map((s) => [s.label, s.value])).toEqual([
      ['Lead', 200],
      ['Won', 50],
    ]);
  });

  it('survives junk: no rows, nulls, zero and negative values', () => {
    expect(funnelStages(null, 'a', 'b')).toEqual([]);
    expect(funnelStages('x', 'a', 'b')).toEqual([]);
    const stages = funnelStages([null, { s: 'A', v: 0 }, { s: 'B', v: -5 }, { s: 'C', v: 'n/a' }], 's', 'v');
    expect(stages.map((s) => s.value)).toEqual([0, 0, null]);
    expect(stages.every((s) => s.width === 0)).toBe(true);
    expect(stages[1].ofPrevious).toBe(null);
  });
});

describe('scatterGroups', () => {
  const data = [
    { name: 'Acme', spend: 10, revenue: 40, deals: 3, region: 'EU' },
    { name: 'Beta', spend: 20, revenue: 15, deals: 8, region: 'US' },
    { name: 'Coda', spend: '5', revenue: '30', deals: 1, region: 'EU' },
    { name: 'Bad', spend: 'x', revenue: 2, region: 'US' },
  ];

  it('keeps the rows with both numbers, one group per group value', () => {
    const groups = scatterGroups(data, { xField: 'spend', yField: 'revenue', groupField: 'region' });
    expect(groups.map((g) => g.name)).toEqual(['EU', 'US']);
    expect(groups[0].points.map((p) => [p.x, p.y])).toEqual([
      [10, 40],
      [5, 30],
    ]);
    expect(groups[1].points).toHaveLength(1);
  });

  it('is one group without a group field, and carries size and name', () => {
    const [only] = scatterGroups(data, { xField: 'spend', yField: 'revenue', sizeField: 'deals', nameField: 'name' });
    expect(only.points.map((p) => p.z)).toEqual([3, 8, 1]);
    expect(only.points[0].label).toBe('Acme');
  });

  it('never throws on junk', () => {
    expect(scatterGroups(undefined, {})).toEqual([]);
    expect(scatterGroups([1, 'a', null, []], { xField: 'a', yField: 'b' })).toEqual([]);
  });
});

describe('comboSeries', () => {
  it('lists bars then lines, each with its axis, and drops lines already drawn as bars', () => {
    expect(comboSeries('revenue', ['margin', 'revenue'], 'margin')).toEqual([
      { field: 'revenue', kind: 'bar', axis: 'left' },
      { field: 'margin', kind: 'line', axis: 'right' },
    ]);
  });

  it('is empty for junk', () => {
    expect(comboSeries(null, {}, 7)).toEqual([]);
  });
});
