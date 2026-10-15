import { highlightIndexes } from '../chartsModel';

const data = [
  { month: 'May', revenue: 400, cost: 100 },
  { month: 'Jun', revenue: 900, cost: 300 },
  { month: 'Jul', revenue: 700, cost: 50 },
  { month: 'Oct', revenue: 200, cost: 20 },
];
const series = ['revenue', 'cost'];
const pick = (h) => {
  const set = highlightIndexes(data, 'month', series, h);
  return set ? [...set].sort() : set;
};

describe('highlightIndexes', () => {
  it('highlights nothing when unset', () => {
    expect(pick('')).toBeNull();
    expect(pick(undefined)).toBeNull();
    expect(pick(null)).toBeNull();
  });

  it('matches a category value, or several', () => {
    expect(pick('Jun')).toEqual([1]);
    expect(pick(['May', 'Oct'])).toEqual([0, 3]);
    expect(pick('Jun, Oct')).toEqual([1, 3]);
  });

  it('matches numbers and strings alike', () => {
    const years = [
      { y: 2025, v: 1 },
      { y: 2026, v: 2 },
    ];
    expect([...highlightIndexes(years, 'y', ['v'], '2026')]).toEqual([1]);
    expect([...highlightIndexes(years, 'y', ['v'], 2025)]).toEqual([0]);
  });

  it('understands first, last, max and min (by the total of the series)', () => {
    expect(pick('first')).toEqual([0]);
    expect(pick('last')).toEqual([3]);
    expect(pick('max')).toEqual([1]);
    expect(pick('min')).toEqual([3]);
  });

  it('prefers a category literally named like a keyword', () => {
    const rows = [
      { k: 'max', v: 1 },
      { k: 'b', v: 9 },
    ];
    expect([...highlightIndexes(rows, 'k', ['v'], 'max')]).toEqual([0]);
  });

  it('highlights nothing when nothing matches, so the chart draws as usual', () => {
    expect(pick('Dec')).toBeNull();
  });

  it('never throws on junk', () => {
    [{}, 42, NaN, [null, {}], () => 1].forEach((h) =>
      expect(() => highlightIndexes(data, 'month', series, h)).not.toThrow()
    );
    expect(highlightIndexes(null, 'month', series, 'last')).toBeNull();
    expect(highlightIndexes([null, 'x', 3], 'month', series, 'max')).not.toBeUndefined();
  });
});
