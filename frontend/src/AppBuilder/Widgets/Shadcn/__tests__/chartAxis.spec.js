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
  it('formats an axis of year-months as the month, with the year when the axis spans more than one', () => {
    const { dateTicks } = require('../ShadCharts');
    const one = [{ m: '2026-03' }, { m: '2026-04' }];
    expect(dateTicks(one, 'm')('2026-03')).toBe('Mar');
    const two = [{ m: '2025-12' }, { m: '2026-01' }];
    expect(dateTicks(two, 'm')('2025-12')).toBe("Dec '25");
    expect(dateTicks(two, 'm')('2026-01')).toBe("Jan '26");
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
  it('treats a chart under 100px as a sparkline-sized trend', () => {
    const { isCompactChart } = require('../ShadCharts');
    expect(isCompactChart(76)).toBe(true);
    expect(isCompactChart(135)).toBe(false);
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

describe('category tick labels', () => {
  // Expense build (2026-10-12): an 8-bar chart showed every other category ("Marketing, Travel, Office Supplies,
  // Meals") because Recharts thinned labels that did not fit. Every bar keeps its name, wrapped or shortened.
  const { wrapLabel, keepsEveryCategory } = require('../ShadCharts');
  it('keeps short names on one line', () => {
    expect(wrapLabel('Travel', 12)).toEqual(['Travel']);
  });
  it('wraps a long name onto two lines at word breaks', () => {
    expect(wrapLabel('Office Supplies', 10)).toEqual(['Office', 'Supplies']);
  });
  it('shortens what still does not fit with an ellipsis', () => {
    expect(wrapLabel('Professional development courses', 10)).toEqual(['Professio…', 'developme…']);
    expect(wrapLabel('Meals and team events', 10)).toEqual(['Meals and', 'team even…']);
    expect(wrapLabel('Supercalifragilistic', 8)).toEqual(['Superca…']);
  });
  it('copes with blanks and numbers', () => {
    expect(wrapLabel('', 8)).toEqual(['']);
    expect(wrapLabel(2026, 8)).toEqual(['2026']);
  });
  it('keeps every name for categories, not for date axes or very long series', () => {
    const cats = Array.from({ length: 8 }, (_, i) => ({ c: `Category ${i}` }));
    expect(keepsEveryCategory(cats, 'c')).toBe(true);
    expect(keepsEveryCategory([{ d: '2026-09-10' }, { d: '2026-09-11' }], 'd')).toBe(false);
    expect(
      keepsEveryCategory(
        Array.from({ length: 40 }, (_, i) => ({ c: `C${i}` })),
        'c'
      )
    ).toBe(false);
  });
});

// A subscription dashboard's legend read "Mrr" for the field mrr (2026-10-14): known acronyms read in capitals.
describe('seriesLabel, acronyms', () => {
  const { seriesLabel } = require('../chartsModel');
  it.each([
    ['mrr', 'MRR'],
    ['arr_growth', 'ARR growth'],
    ['nps', 'NPS'],
    ['avg_sla_hours', 'Avg SLA hours'],
    ['kpiTarget', 'KPI target'],
    ['revenue', 'Revenue'],
  ])('%s reads %s', (key, label) => {
    expect(seriesLabel(key)).toBe(label);
  });
  // 4,980 km at the top reads "5K km", but the ticks between read "1.5K km" and "4.5K km", and were cut to ".5K km"
  // (fleet distance chart, 2026-10-14): the ticks between are measured too.
  it('is wide enough for the ticks between the ends', () => {
    const compactKm = (v) => (v >= 1000 ? `${Number((v / 1000).toFixed(1))}K km` : `${v} km`);
    expect(valueAxisWidth([{ km: 4980 }, { km: 1200 }], ['km'], compactKm)).toBeGreaterThanOrEqual(7 * 7 + 12);
  });
});
