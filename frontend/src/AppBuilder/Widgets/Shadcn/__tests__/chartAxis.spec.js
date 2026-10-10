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
