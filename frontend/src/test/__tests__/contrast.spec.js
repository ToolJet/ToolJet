/**
 * @jest-environment node
 */
import { contrastRatio, parseColor, readToken } from '../contrast';

describe('contrastRatio', () => {
  test.each([
    ['#000', '#fff', 21],
    ['#767676', '#ffffff', 4.54],
    ['#777777', '#ffffff', 4.48],
    ['#ffffff', '#ffffff', 1],
  ])('%s on %s is %d:1 (WCAG reference pairs)', (fg, bg, expected) => {
    expect(contrastRatio(fg, bg)).toBeCloseTo(expected, 2);
  });

  test('is symmetric', () => {
    expect(contrastRatio('#fff', '#767676')).toBeCloseTo(contrastRatio('#767676', '#fff'), 10);
  });

  test('reads computed rgb() and radix hsl() strings', () => {
    expect(contrastRatio('rgb(118, 118, 118)', 'rgba(255, 255, 255, 1)')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('hsl(0, 0%, 46.3%)', 'hsl(0, 0%, 100%)')).toBeCloseTo(4.54, 1);
  });

  test('flattens translucent text onto its background', () => {
    expect(contrastRatio('rgba(0, 0, 0, 0.5)', '#fff')).toBeCloseTo(contrastRatio('#808080', '#fff'), 1);
  });

  test('flattens translucent background layers top first, then onto white', () => {
    expect(contrastRatio('#000', '#00000080')).toBeCloseTo(contrastRatio('#000', '#7f7f7f'), 2);
    expect(contrastRatio('#000', '#00000000', '#808080')).toBeCloseTo(contrastRatio('#000', '#808080'), 10);
  });

  test.each(['var(--text-default)', 'rgb(none none none)', 'rgb(1, 2)', '#12345', 'hsl(abc, 10%, 10%)', undefined])(
    'rejects %s instead of returning NaN',
    (value) => {
      expect(() => parseColor(value)).toThrow('Unsupported colour');
      expect(() => contrastRatio('#000', value)).toThrow('Unsupported colour');
    }
  );
});

describe('readToken', () => {
  const scss = `
    :root, .light-theme { --text: #111; /* --text: #999; */ }
    .dark-theme { --text: #eee; }
    // .dark-theme { --text: #000; }
    .dark-theme { --text: #ddd !important; }
    .btn {
      color: var(--a);
      &.selected { color: var(--b); }
    }
  `;

  test('reads a token from a block in a selector list', () => {
    expect(readToken(scss, ':root', '--text')).toBe('#111');
  });

  test('takes the last declaration and ignores comments', () => {
    expect(readToken(scss, '.dark-theme', '--text')).toBe('#ddd');
  });

  test('reads nested blocks without leaking into the parent', () => {
    expect(readToken(scss, '&.selected', 'color')).toBe('var(--b)');
    expect(readToken(scss, '.btn', 'color')).toBe('var(--a)');
  });

  test('returns undefined for a missing token', () => {
    expect(readToken(scss, ':root', '--missing')).toBeUndefined();
  });
});
