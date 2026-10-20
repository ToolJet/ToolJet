import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 599 (Codex fixture independentRegexConsumers599, its three tests kept as written): the bounded matcher
// compared a character with its lower and upper case forms only, so under i it missed JavaScript's case equivalences
// (ς, σ and Σ), and Tags refused a valid final-sigma tag while a Table filter or conditional style skipped the
// equivalent row (a Table passes i itself). Single characters are now tested by the browser's own RegExp.
//
// Also (P1): a pattern whose search runs out of the matcher's step budget is 'too-complex'. Tags refuses the tag with
// a message about the pattern. A Table filter or conditional style whose pattern cannot be checked on some row holds
// for no row, whatever the row order (the filter stops at that row), the verdict is kept per pattern, and the Table
// warns once, naming the pattern. A native run of a pathological pattern on its text is caught, recorded and answered
// without running, so a regression fails here instead of hanging jest.
import { addTags } from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import {
  applyFilters,
  cellStyleFor,
  normalizeColumns,
  screenStyleRules,
} from '@/AppBuilder/Widgets/Ui2/Table/tableModel';

const rows = [
  { id: 'normal', value: 'σ' },
  { id: 'final', value: 'ς' },
  { id: 'other', value: 'x' },
];
const columns = () => normalizeColumns([{ key: 'value', name: 'Value', columnType: 'string' }], rows);

describe('audit 599 fixture', () => {
  test('Tags preserves JavaScript case-insensitive matching for final sigma', () => {
    expect(/σ/i.test('ς')).toBe(true);
    expect(addTags([], ['ς'], { pattern: /σ/i })).toEqual({ tags: ['ς'], added: ['ς'], error: '' });
  });

  test('Table regex filter preserves both equivalent sigma records', () => {
    const filters = [{ column: 'value', condition: 'matches', value: 'σ' }];
    expect(applyFilters(rows, filters, columns()).map((r) => r.id)).toEqual(['normal', 'final']);
  });

  test('Table conditional style applies to both equivalent sigma records', () => {
    const [column] = normalizeColumns(
      [
        {
          key: 'value',
          name: 'Value',
          columnType: 'string',
          conditionalStyles: [{ condition: 'matches', value: 'σ', textColor: '#dc2626' }],
        },
      ],
      rows
    );
    expect(rows.map((row) => cellStyleFor(column, row))).toEqual([{ color: '#dc2626' }, { color: '#dc2626' }, {}]);
  });
});

const A28 = `${'a'.repeat(28)}!`;
// Every pathological pattern here repeats a+ inside a repeat; a fine one never does.
const pathological = (source) => source.includes('(a+)+');
let native;
let warn;
beforeEach(() => {
  native = [];
  for (const method of ['test', 'exec']) {
    const own = RegExp.prototype[method];
    jest.spyOn(RegExp.prototype, method).mockImplementation(function guarded(value) {
      if (pathological(this.source) && String(value).length > 1) {
        native.push({ method, source: this.source, length: String(value).length });
        return method === 'test' ? false : null;
      }
      return own.call(this, value);
    });
  }
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  expect(native).toEqual([]);
});

describe('Tags', () => {
  test('a final-sigma tag is accepted by a class that names only the medial sigma', () => {
    // [α-ρσ-ω] skips ς (U+03C2, between ρ and σ); under i JavaScript still accepts it, as σ's equivalent.
    expect(addTags([], ['λογος'], { pattern: /^[α-ρσ-ω]+$/i })).toEqual({
      tags: ['λογος'],
      added: ['λογος'],
      error: '',
    });
  });

  test('a lookahead pattern accepts a matching tag and refuses one that does not match', () => {
    const rules = { pattern: '^(?=.*\\d).+$', patternError: 'Needs a digit' };
    expect(addTags([], ['release2', 'release'], rules)).toEqual({
      tags: ['release2'],
      added: ['release2'],
      error: 'Needs a digit',
    });
  });

  test('a pattern too complex to check refuses the tag with a message about the pattern', () => {
    const rules = { pattern: '^(?=a)(a+)+$', patternError: 'Only a' };
    expect(addTags([], ['aaaa', A28], rules)).toEqual({
      tags: ['aaaa'],
      added: ['aaaa'],
      error: `The pattern is too complex to check "${A28}"`,
    });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('Table', () => {
  const greek = [
    { id: 'upper', value: 'ΟΔΟΣ' },
    { id: 'lower', value: 'οδος' },
    { id: 'other', value: 'οδοι' },
  ];
  const tableColumns = (data, rules) =>
    normalizeColumns([{ key: 'value', name: 'Value', columnType: 'string', conditionalStyles: rules }], data);

  test('a regex filter keeps the rows a JavaScript RegExp with i matches', () => {
    const filters = [{ column: 'value', condition: 'matches', value: 'σ$' }];
    expect(applyFilters(greek, filters, tableColumns(greek)).map((r) => r.id)).toEqual(['upper', 'lower']);
  });

  test('a conditional style styles the Unicode equivalent rows', () => {
    const [column] = tableColumns(greek, [{ condition: 'matches', value: 'οδοσ', textColor: '#dc2626' }]);
    expect(greek.map((row) => cellStyleFor(column, row))).toEqual([{ color: '#dc2626' }, { color: '#dc2626' }, {}]);
  });

  const data = [
    { id: 'long', value: A28 },
    { id: 'longer', value: `a${A28}` },
    { id: 'short', value: 'aaa' },
    { id: 'b', value: 'b' },
  ];
  const warnedOnceAbout = (source) => {
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(`/${source}/`);
    expect(warn.mock.calls[0][0]).toContain('too complex');
  };

  test.each([
    ['matches', '^(?=a)(a+)+$'],
    ['nl', '^(?=a)(a+)+b$'],
  ])('a %s filter too complex for some row keeps no row, and warns once', (condition, value) => {
    const filters = [{ column: 'value', condition, value }];
    expect(applyFilters(data, filters, tableColumns(data))).toEqual([]);
    // The verdict is kept: the next render keeps no row either, without searching again.
    const { result, ms } = (() => {
      const start = performance.now();
      return { result: applyFilters(data, filters, tableColumns(data)), ms: performance.now() - start };
    })();
    expect(result).toEqual([]);
    expect(ms).toBeLessThan(2);
    warnedOnceAbout(value);
  });

  test('a conditional style too complex for some row applies to no cell, and warns once', () => {
    const [column] = tableColumns(data, [{ condition: 'matches', value: '^(a+)+\\1$', textColor: '#dc2626' }]);
    screenStyleRules([column], data);
    expect(data.map((row) => cellStyleFor(column, row))).toEqual([{}, {}, {}, {}]);
    warnedOnceAbout('^(a+)+\\1$');
  });

  // Rows a fine pattern answers quickly, with one pathological row; each test uses its own pattern (the verdict is kept).
  const many = (bad) => [
    ...Array.from({ length: 999 }, (_, i) => ({ id: `row${i}`, value: i % 3 ? 'aaaa' : `b${i}` })),
    { id: 'bad', value: bad },
  ];
  const timedFilter = (rows, value) => {
    const start = performance.now();
    const kept = applyFilters(rows, [{ column: 'value', condition: 'matches', value }], tableColumns(rows));
    return { ids: kept.map((r) => r.id), ms: performance.now() - start };
  };

  test.each([
    ['every row is pathological', Array.from({ length: 1000 }, (_, i) => ({ id: `row${i}`, value: A28 }))],
    ['the last row is pathological', many(A28)],
  ])('a 1,000-row filter finishes in bounded time when %s', (_, rows) => {
    const value = `^(?=a)(a+)+$|^z${rows.length}${rows[0].value.length}`;
    const { ids, ms } = timedFilter(rows, value);
    expect(ids).toEqual([]);
    expect(ms).toBeLessThan(300);
    warnedOnceAbout(value);
  });

  test('the result does not depend on row order', () => {
    const rows = many(A28);
    const variants = [rows, [...rows].reverse(), [rows[999], ...rows.slice(0, 999)]];
    // A fresh pattern for each order, so no order sees another's verdict.
    variants.forEach((order, n) => expect(timedFilter(order, `^(?=a)(a+)+$|^order${n}`).ids).toEqual([]));
    variants.forEach((order, n) => {
      const rule = { condition: 'matches', value: `^(?=a)(a+)+$|^style${n}`, textColor: '#dc2626' };
      const [column] = tableColumns(order, [rule]);
      screenStyleRules([column], order);
      expect(order.filter((row) => cellStyleFor(column, row).color)).toEqual([]);
    });
    expect(warn).toHaveBeenCalledTimes(6);
  });

  test.each([
    ['matches', '^a+$'],
    ['nl', '^a+$'],
    ['matches', '^(?=a)(?:aa)+$'],
    ['nl', '(?<=b)\\d+'],
    ['matches', '(\\w)\\1'],
  ])('a %s filter on /%s/, fine on every row, keeps exactly the rows a RegExp with i matches', (condition, value) => {
    const rows = many('aaaaa');
    const native = new RegExp(value, 'i');
    const expected = rows.filter((row) => native.test(row.value) !== (condition === 'nl')).map((r) => r.id);
    const filters = [{ column: 'value', condition, value }];
    expect(applyFilters(rows, filters, tableColumns(rows)).map((r) => r.id)).toEqual(expected);
    const [column] = tableColumns(rows, [{ condition, value, textColor: '#dc2626' }]);
    screenStyleRules([column], rows);
    expect(rows.filter((row) => cellStyleFor(column, row).color).map((r) => r.id)).toEqual(expected);
    expect(warn).not.toHaveBeenCalled();
  });
});
