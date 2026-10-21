import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit round 6 (Codex R6-03): whether a pattern can be checked within the matcher's work budget depends on
// the text, but the Table kept "too complex" as a module-wide verdict per pattern, so one dataset with a pathological
// row made the pattern hold for no row of every other Table, and of the same Table after a refetch. A verdict is now
// scoped to one evaluation of one dataset: within it the pattern still holds for no row whatever the row order (audit
// 016/599), and the next dataset is checked on its own rows.
import {
  applyFilters,
  cellStyleFor,
  matchesCondition,
  normalizeColumns,
  screenRegexRules,
} from '@/AppBuilder/Widgets/Ui2/Table/tableModel';

const PATTERN = '^(?=a)(a+)+$|^independentCache712$';
const RED = { color: '#dc2626' };
const good = [{ id: 'good', value: 'aaa' }];
const bad = [{ id: 'bad', value: `${'a'.repeat(28)}!` }];
const mixed = [...bad, ...good];
const cols = (rows, extra = {}) =>
  normalizeColumns([{ key: 'value', name: 'Value', columnType: 'string', ...extra }], rows);
const styled = (rows) =>
  cols(rows, { conditionalStyles: [{ condition: 'matches', value: PATTERN, textColor: '#dc2626' }] });
const buttons = (rows) =>
  normalizeColumns(
    [
      { key: 'value', name: 'Value', columnType: 'string' },
      {
        key: 'actions',
        name: 'Actions',
        columnType: 'button',
        buttons: [{ id: 'approve', disabledWhen: { key: 'value', condition: 'matches', value: PATTERN } }],
      },
    ],
    rows
  );
let warn;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

test('a filter: a safe dataset, a poisoned one, then the safe one again keeps aaa', () => {
  const filters = [{ column: 'value', condition: 'matches', value: PATTERN }];
  expect(applyFilters(good, filters, cols(good)).map((r) => r.id)).toEqual(['good']);
  expect(applyFilters(bad, filters, cols(bad))).toEqual([]);
  expect(applyFilters(mixed, filters, cols(mixed))).toEqual([]);
  expect(applyFilters(good, filters, cols(good)).map((r) => r.id)).toEqual(['good']);
});

test('a conditional style: the screen of one dataset decides its cells only', () => {
  const [safeColumn] = styled(good);
  const [poisonedColumn] = styled(mixed);
  expect(screenRegexRules([safeColumn], good).size).toBe(0);
  const poisoned = screenRegexRules([poisonedColumn], mixed);
  expect(poisoned.size).toBe(1);
  expect(mixed.map((row) => cellStyleFor(poisonedColumn, row, poisoned))).toEqual([{}, {}]);
  // Another table, or the same one refetched, screens its own rows.
  const again = screenRegexRules([safeColumn], good);
  expect(again.size).toBe(0);
  expect(cellStyleFor(safeColumn, good[0], again)).toEqual(RED);
});

test('without a screen a rule just matches, and a too-complex cell records nothing for later cells', () => {
  const [column] = styled(mixed);
  expect(cellStyleFor(column, bad[0])).toEqual({});
  expect(cellStyleFor(column, good[0])).toEqual(RED);
  expect(matchesCondition(bad[0].value, 'matches', PATTERN)).toBe(false);
  expect(matchesCondition('aaa', 'matches', PATTERN)).toBe(true);
});

test('a button rule is screened with the style rules: it holds for no row of a poisoned dataset only', () => {
  const poisoned = screenRegexRules(buttons(mixed), mixed);
  expect(poisoned.size).toBe(1);
  expect(mixed.map((row) => matchesCondition(row.value, 'matches', PATTERN, undefined, poisoned))).toEqual([
    false,
    false,
  ]);
  const safe = screenRegexRules(buttons(good), good);
  expect(safe.size).toBe(0);
  expect(matchesCondition('aaa', 'matches', PATTERN, undefined, safe)).toBe(true);
});

test('the console warns once per pattern however many datasets cannot check it', () => {
  const value = '^(?=a)(a+)+$|^warnedOnce712$'; // its own pattern: the warning is once per pattern, module-wide
  const [column] = cols(mixed, { conditionalStyles: [{ condition: 'matches', value, textColor: '#dc2626' }] });
  screenRegexRules([column], mixed);
  screenRegexRules([column], [...mixed].reverse());
  applyFilters(mixed, [{ column: 'value', condition: 'matches', value }], cols(mixed));
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('too complex');
});
