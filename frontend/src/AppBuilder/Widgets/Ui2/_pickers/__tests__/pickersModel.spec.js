import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';

describe('pickers model: options', () => {
  const options = [
    { label: 'All', value: '' },
    { label: 'One', value: 1, group: 'Numbers', description: 'first' },
    { label: 'Two', value: 2, group: 'Numbers' },
    { label: 'Alpha', value: 'a', group: 'Letters', disabled: true },
  ];

  it('finds options by value text, so 1 and "1" match and "" is a real value', () => {
    expect(M.findOption(options, '1').label).toBe('One');
    expect(M.findOption(options, '').label).toBe('All');
    expect(M.findOption(options, null)).toBeUndefined();
    expect(M.findOption(null, 1)).toBeUndefined();
  });

  it('reads a default as a key, or none', () => {
    expect(M.initialKey('')).toBeNull();
    expect(M.initialKey(undefined)).toBeNull();
    expect(M.initialKey({ a: 1 })).toBeNull();
    expect(M.initialKey(2)).toBe('2');
  });

  it('filters on label, description, value and group, and groups in order of appearance', () => {
    expect(M.filterOptions(options, 'FIRST').map((e) => e.option.label)).toEqual(['One']);
    expect(M.filterOptions(options, 'numbers').map((e) => e.index)).toEqual([1, 2]);
    expect(M.filterOptions(options, '  ')).toHaveLength(4);
    expect(M.filterOptions('junk', 'x')).toEqual([]);
    const groups = M.groupOptions(M.filterOptions(options, ''));
    expect(groups.map((g) => [g.heading, g.items.length])).toEqual([
      ['', 1],
      ['Numbers', 2],
      ['Letters', 1],
    ]);
  });

  it('gives the validation engine a filled value for 0, false and an option valued ""', () => {
    expect(M.validationInput(false, 'x')).toBe('');
    expect(M.validationInput(true, 0)).toBe('0');
    expect(M.validationInput(true, false)).toBe('false');
    expect(M.validationInput(true, '')).toBe(' ');
    expect(M.validationInput(true, [])).toBe('');
    expect(M.validationInput(true, ['a'])).toEqual(['a']);
  });

  it('adds and removes multiselect keys within the limit, skipping unknown and disabled options', () => {
    expect(M.toValueList('x')).toEqual(['x']);
    expect(M.toValueList(null)).toEqual([]);
    expect(M.toValueList([1, null, {}, 'b'])).toEqual([1, 'b']);
    expect(M.addKeys(['1'], [2, 'a', 'zzz', 1], options)).toEqual(['1', '2']);
    expect(M.addKeys([], [1, 2], options, 1)).toEqual(['1']);
    expect(M.addKeys([], ['x'], [])).toEqual(['x']);
    expect(M.removeKeys(['1', '2'], 2)).toEqual(['1']);
    expect(M.selectedOf(options, ['2', '1']).map((o) => o.value)).toEqual([1, 2]);
    expect(M.clampLimit('abc')).toBe(0);
    expect(M.clampLimit(-3)).toBe(0);
    expect(M.clampLimit('4')).toBe(4);
  });

  it('builds stable keys without throwing on circular data', () => {
    const loop = {};
    loop.self = loop;
    expect(typeof M.stableKey(loop)).toBe('string');
    expect(M.stableKey([1])).toBe('[1]');
  });
});

describe('pickers model: tags', () => {
  it('reads tags from arrays or comma text', () => {
    expect(M.toTags([' a ', '', null, 3, {}])).toEqual(['a', '3']);
    expect(M.toTags('a, b,,c')).toEqual(['a', 'b', 'c']);
    expect(M.toTags(42)).toEqual([]);
  });

  it('splits typed text into complete parts and what is still typed', () => {
    expect(M.splitTyped('a, b,c')).toEqual({ parts: ['a', 'b'], rest: 'c' });
    expect(M.splitTyped('a\n')).toEqual({ parts: ['a'], rest: '' });
    expect(M.splitTyped(undefined)).toEqual({ parts: [], rest: '' });
  });

  it('refuses duplicates (ignoring case unless asked), pattern failures and tags past the limit', () => {
    expect(M.addTags(['React'], ['react'])).toMatchObject({
      tags: ['React'],
      added: [],
      error: '"react" is already added',
    });
    expect(M.addTags(['React'], ['react'], { caseSensitive: true }).tags).toEqual(['React', 'react']);
    expect(M.addTags([], ['ok', 'NO'], { pattern: '^[a-z]+$', patternError: 'Lowercase only' })).toMatchObject({
      tags: ['ok'],
      error: 'Lowercase only',
    });
    expect(M.addTags(['a'], ['b', 'c'], { maxTags: 2 })).toMatchObject({
      tags: ['a', 'b'],
      error: 'You can add up to 2 tags',
    });
    expect(M.addTags([], ['x'], { pattern: '([' }).tags).toEqual(['x']);
    expect(M.safeRegex('')).toBeNull();
  });
});

describe('pickers model: rating', () => {
  it('clamps the icon count and the value', () => {
    expect(M.clampMax(50)).toBe(10);
    expect(M.clampMax(0)).toBe(1);
    expect(M.clampMax('abc')).toBe(5);
    expect(M.clampMax(null)).toBe(5);
    expect(M.normalizeRating(3.4, 5)).toBe(3);
    expect(M.normalizeRating(3.4, 5, true)).toBe(3.5);
    expect(M.normalizeRating(99, 5)).toBe(5);
    expect(M.normalizeRating('x', 5)).toBe(0);
    expect(M.normalizeRating(-2, 5)).toBe(0);
  });

  it('draws full, half and empty icons and steps by the keyboard', () => {
    expect([1, 2, 3, 4].map((p) => M.iconFill(p, 2.5))).toEqual(['full', 'full', 'half', 'empty']);
    expect(M.stepRating(2, 1, 5)).toBe(3);
    expect(M.stepRating(5, 1, 5)).toBe(5);
    expect(M.stepRating(0, -1, 5)).toBe(1);
    expect(M.stepRating(2, -1, 5, true)).toBe(1.5);
  });
});
