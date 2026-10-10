import { progressPercent, sparkPaths, STAT_SIZES, statSize } from '../statModel';

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
