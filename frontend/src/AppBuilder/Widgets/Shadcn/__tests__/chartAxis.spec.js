import { valueAxisWidth } from '../ShadCharts';

describe('valueAxisWidth', () => {
  const rows = [
    { t: '17:40', seats: 96 },
    { t: '19:20', seats: 36 },
  ];
  it('fits a suffixed label at the rounded-up top tick', () => {
    // "100 seats" is 9 characters: a fixed 48px wrapped it onto two lines and clipped the top tick.
    expect(valueAxisWidth(rows, ['seats'], (v) => `${v} seats`)).toBeGreaterThanOrEqual(9 * 7);
  });
  it('stays compact for short numbers and copes with junk', () => {
    expect(valueAxisWidth(rows, ['seats'], (v) => String(v))).toBe(33);
    expect(valueAxisWidth([{ a: 'x' }, null], ['a'], String)).toBe(40);
  });
  it('counts stacked totals', () => {
    const stacked = [{ a: 600, b: 600 }];
    expect(valueAxisWidth(stacked, ['a', 'b'], (v) => `£${v}`, true)).toBeGreaterThan(
      valueAxisWidth(stacked, ['a', 'b'], (v) => `£${v}`)
    );
  });
});

describe('dateTicks', () => {
  it('formats an axis of ISO dates as day and month, and leaves other axes alone', () => {
    const { dateTicks } = require('../ShadCharts');
    expect(dateTicks([{ d: '2026-09-10' }], 'd')('2026-09-10')).toBe('10 Sep');
    expect(dateTicks([{ d: '2026-09-10T06:30:00Z' }], 'd')('2026-10-04T06:30:00Z')).toMatch(/^\d+ Oct$/);
    expect(dateTicks([{ d: 'Jan' }], 'd')).toBeUndefined();
    expect(dateTicks([], 'd')).toBeUndefined();
  });
});

describe('resolveChartFields', () => {
  const { resolveChartFields } = require('../chartsModel');
  const rows = [
    { category: 'Food', amount: 86.4, count: 3 },
    { category: 'Rent', amount: '1200', count: 1 },
  ];
  it('keeps fields that exist in the data', () => {
    expect(resolveChartFields(rows, 'category', ['amount'])).toEqual({ x: 'category', series: ['amount'] });
  });
  it("falls back to the data's numeric fields when no named series exists (a build kept the default 'revenue')", () => {
    expect(resolveChartFields(rows, 'category', ['revenue'])).toEqual({ x: 'category', series: ['amount', 'count'] });
  });
  it('falls back to the first text field when the x field is missing', () => {
    expect(resolveChartFields(rows, 'month', ['amount'])).toEqual({ x: 'category', series: ['amount'] });
  });
  it('copes with empty and junk data', () => {
    expect(resolveChartFields([], 'month', ['revenue'])).toEqual({ x: 'month', series: ['revenue'] });
    expect(resolveChartFields([null, 'x'], 'month', ['revenue'])).toEqual({ x: 'month', series: ['revenue'] });
  });
});

describe('isCompactChart', () => {
  it('treats a chart under 150px as a sparkline-sized trend', () => {
    const { isCompactChart } = require('../ShadCharts');
    expect(isCompactChart(56)).toBe(true);
    expect(isCompactChart(280)).toBe(false);
    expect(isCompactChart(undefined)).toBe(false);
  });
});

describe('seriesLabel', () => {
  const { seriesLabel } = require('../chartsModel');
  it("uses the author's label, else a readable field name", () => {
    expect(seriesLabel('food_cost_pct', { food_cost_pct: 'Food cost' })).toBe('Food cost');
    expect(seriesLabel('food_cost_pct', {})).toBe('Food cost pct');
    expect(seriesLabel('lastWeek')).toBe('Last week');
    expect(seriesLabel('revenue', 'junk')).toBe('Revenue');
  });
});
