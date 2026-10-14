import { progressPercent, sparkPaths, splitChange, STAT_SIZES, statSize, statValue } from '../statModel';

describe('sparkPaths', () => {
  it('draws a line and a closed area across the box', () => {
    const paths = sparkPaths([3, 5, 4, 8], 100, 30);
    expect(paths.line.startsWith('M')).toBe(true);
    expect(paths.area.endsWith('Z')).toBe(true);
    expect(paths.last.x).toBeCloseTo(100 - paths.pad, 5);
    // The highest value sits at the top of the drawing area, the lowest at the bottom.
    expect(paths.last.y).toBeCloseTo(paths.pad, 5);
  });

  it('accepts point objects and comma text, and skips gaps', () => {
    expect(
      sparkPaths(
        [
          { x: 'Mon', y: 2 },
          { x: 'Tue', y: 6 },
        ],
        80,
        20
      )
    ).not.toBeNull();
    expect(sparkPaths('4,7,5', 80, 20)).not.toBeNull();
    expect(sparkPaths([1, null, 3], 80, 20)).not.toBeNull();
  });

  it('draws a flat line through the middle when every value is equal', () => {
    const paths = sparkPaths([5, 5, 5], 60, 20);
    expect(paths.last.y).toBeCloseTo(10, 5);
  });

  it('returns null without two numbers, and never throws on junk', () => {
    expect(sparkPaths([], 80, 20)).toBeNull();
    expect(sparkPaths([7], 80, 20)).toBeNull();
    [null, undefined, 42, {}, 'x,y', [[1]], [NaN, Infinity]].forEach((v) =>
      expect(() => sparkPaths(v, 80, 20)).not.toThrow()
    );
    expect(sparkPaths([1, 2], 0, 0)).toBeNull();
  });
});

describe('progressPercent', () => {
  it('clamps to 0 to 100 and is null when unset', () => {
    expect(progressPercent(42)).toBe(42);
    expect(progressPercent('73.5')).toBe(73.5);
    expect(progressPercent(140)).toBe(100);
    expect(progressPercent(-5)).toBe(0);
    expect(progressPercent('')).toBeNull();
    expect(progressPercent(undefined)).toBeNull();
    expect(progressPercent('abc')).toBeNull();
  });
});

describe('statSize', () => {
  it('maps the size to value classes, defaulting to default', () => {
    expect(statSize('lg')).toBe(STAT_SIZES.lg);
    expect(statSize('nope')).toBe(STAT_SIZES.default);
    expect(statSize(undefined)).toBe(STAT_SIZES.default);
  });
});

describe('statValue money', () => {
  it('shows cents on a non-integer amount (an inventory value read "$3,043.5")', () => {
    expect(statValue(3043.5, { valueFormat: 'currency', currency: 'USD' })).toBe('$3,043.50');
    expect(statValue(3043, { valueFormat: 'currency', currency: 'USD' })).toBe('$3,043');
  });
});

// A clinic app (2026-10-13) set change to "+8 vs semana passada": the chip, capped at 60% of the row, read
// "+8 vs semana pa...". The figure stays in the chip and the words move to the context line, which wraps.
describe('splitChange', () => {
  it('keeps the leading figure in the chip and moves the words to the context', () => {
    expect(splitChange('+8 vs semana passada')).toEqual({ chip: '+8', context: 'vs semana passada' });
    expect(splitChange('-12.5% vs last month')).toEqual({ chip: '-12.5%', context: 'vs last month' });
    expect(splitChange('+$1,240 this week')).toEqual({ chip: '+$1,240', context: 'this week' });
  });
  it('leaves a bare figure or words without a leading figure alone', () => {
    expect(splitChange('+12%')).toEqual({ chip: '+12%', context: '' });
    expect(splitChange('Up from last week')).toEqual({ chip: 'Up from last week', context: '' });
    expect(splitChange('')).toEqual({ chip: '', context: '' });
  });
});
