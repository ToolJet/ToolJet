import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 599 (Codex fixture independentRegexConsumers599, its three tests kept as written): the bounded matcher
// compared a character with its lower and upper case forms only, so under i it missed JavaScript's case equivalences
// (ς, σ and Σ), and Tags refused a valid final-sigma tag while a Table filter or conditional style skipped the
// equivalent row (a Table passes i itself). Single characters are now tested by the browser's own RegExp.
//
// Also (P1): a pattern whose search runs out of the matcher's step budget is 'too-complex'. Tags refuses the tag with
// a message about the pattern; a Table filter or conditional style does not hold for that row, and the Table warns
// once, naming the pattern. A native run of a pathological pattern on its text is caught, recorded and answered
// without running, so a regression fails here instead of hanging jest.
import { addTags } from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { applyFilters, cellStyleFor, normalizeColumns } from '@/AppBuilder/Widgets/Ui2/Table/tableModel';

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
const PATHOLOGICAL = new Set(['^(?=a)(a+)+$', '^(?=a)(a+)+b$', '^(a+)+\\1$']);
let native;
let warn;
beforeEach(() => {
  native = [];
  for (const method of ['test', 'exec']) {
    const own = RegExp.prototype[method];
    jest.spyOn(RegExp.prototype, method).mockImplementation(function guarded(value) {
      if (PATHOLOGICAL.has(this.source) && String(value).length > 1) {
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

  test.each([
    ['matches', '^(?=a)(a+)+$', ['short']],
    ['nl', '^(?=a)(a+)+b$', ['short', 'b']],
  ])('a %s filter too complex for some rows leaves them out and warns once', (condition, value, kept) => {
    const filters = [{ column: 'value', condition, value }];
    expect(applyFilters(data, filters, tableColumns(data)).map((r) => r.id)).toEqual(kept);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(`/${value}/`);
    expect(warn.mock.calls[0][0]).toContain('too complex');
  });

  test('a conditional style too complex for a row does not apply to it, and warns once', () => {
    const [column] = tableColumns(data, [{ condition: 'matches', value: '^(a+)+\\1$', textColor: '#dc2626' }]);
    expect(data.map((row) => cellStyleFor(column, row))).toEqual([{}, {}, { color: '#dc2626' }, {}]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('/^(a+)+\\1$/');
  });
});
