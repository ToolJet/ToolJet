import * as M from '../pickersModel';

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

describe('pickers model: colour', () => {
  it('normalises hex and rgb text, with alpha only when allowed', () => {
    expect(M.normalizeHex('#ABC')).toBe('#aabbcc');
    expect(M.normalizeHex('6366F1')).toBe('#6366f1');
    expect(M.normalizeHex('#6366f180')).toBe('#6366f1');
    expect(M.normalizeHex('#6366f180', true)).toBe('#6366f180');
    expect(M.normalizeHex('#6366f1ff', true)).toBe('#6366f1');
    expect(M.normalizeHex('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(M.normalizeHex('rgba(0,0,0,0.5)', true)).toBe('#00000080');
    expect(M.normalizeHex('rgb(300,0,0)')).toBeNull();
    expect(M.normalizeHex('red')).toBeNull();
    expect(M.normalizeHex(null)).toBeNull();
  });

  it('gives the rgb forms and round-trips through HSV', () => {
    expect(M.colorForms('#6366f1')).toEqual({ rgb: 'rgb(99, 102, 241)', rgba: 'rgba(99, 102, 241, 1)' });
    expect(M.colorForms('')).toEqual({ rgb: '', rgba: '' });
    for (const hex of ['#6366f1', '#000000', '#ffffff', '#22c55e', '#ef4444']) {
      const rgb = M.hexToRgba(hex);
      expect(M.rgbaToHex(M.hsvToRgb(M.rgbToHsv(rgb)))).toBe(hex);
    }
    expect(M.rgbaToHex({ r: 999, g: -4, b: NaN })).toBe('#ff0000');
  });

  it('keeps valid, distinct swatches and picks a readable check colour', () => {
    expect(M.toSwatches(['#fff', '#FFFFFF', 'nope', null, '#000'])).toEqual(['#ffffff', '#000000']);
    expect(M.toSwatches('junk')).toEqual([]);
    expect(M.contrastOn('#ffffff')).toBe('#000000');
    expect(M.contrastOn('#0f172a')).toBe('#ffffff');
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

describe('pickers model: files', () => {
  it('formats sizes', () => {
    expect(M.formatBytes(0)).toBe('0 B');
    expect(M.formatBytes(512)).toBe('512 B');
    expect(M.formatBytes(1536)).toBe('1.5 KB');
    expect(M.formatBytes(5242880)).toBe('5 MB');
    expect(M.formatBytes('junk')).toBe('0 B');
  });

  it('turns accept lists into react-dropzone maps and words', () => {
    expect(M.toDropzoneAccept('')).toBeUndefined();
    expect(M.toDropzoneAccept(12)).toBeUndefined();
    expect(M.toDropzoneAccept('image/*, .pdf, .weird, nonsense')).toEqual({
      'image/*': [],
      'application/pdf': ['.pdf'],
      'application/octet-stream': ['.weird'],
    });
    expect(M.acceptHint(['image/*', 'application/pdf', '.csv', 'text/csv'])).toBe('Images, PDF, CSV');
    expect(M.acceptHint(undefined)).toBe('');
  });

  it('knows file kinds and limits', () => {
    expect(M.fileKind('image/png', 'a.png')).toBe('image');
    expect(M.fileKind('', 'report.PDF')).toBe('pdf');
    expect(M.fileKind('text/csv', 'a.csv')).toBe('sheet');
    expect(M.fileKind('application/zip', 'a.zip')).toBe('archive');
    expect(M.fileKind(undefined, undefined)).toBe('other');
    expect(M.clampFiles('x')).toBe(10);
    expect(M.clampFiles(1000)).toBe(100);
    expect(M.clampBytes(-5)).toBe(0);
  });

  it('names the first rejection', () => {
    const big = [{ file: { name: 'big.png' }, errors: [{ code: 'file-too-large' }] }];
    expect(M.rejectionMessage(big, { maxSize: 1048576 })).toBe('"big.png" is larger than 1 MB');
    expect(M.rejectionMessage([{ file: { name: 'a.txt' }, errors: [{ code: 'file-invalid-type' }] }])).toBe(
      '"a.txt" is not an accepted file type'
    );
    expect(M.rejectionMessage([{ errors: [{ code: 'too-many-files' }] }], { maxFiles: 3 })).toBe(
      'You can upload up to 3 files'
    );
    expect(M.rejectionMessage(null)).toBe('');
  });

  it('builds stable keys without throwing on circular data', () => {
    const loop = {};
    loop.self = loop;
    expect(typeof M.stableKey(loop)).toBe('string');
    expect(M.stableKey([1])).toBe('[1]');
  });
});
