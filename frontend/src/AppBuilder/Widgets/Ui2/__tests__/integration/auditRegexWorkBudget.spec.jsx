import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixtures auditTagsPatternWorkBudget, auditTableRegexWorkBudget and
// currentTableStyleRegex016, trimmed): an author's pattern was run with the browser's RegExp, which backtracks, so a
// Tags pattern, a Table regex filter or a conditional-style rule such as ^(a+)+$ took seconds on 29 characters
// ('a' x 28 then '!') and could not be stopped once started; the Table ran it for every row as it rendered. Patterns
// are now matched by the pack's bounded matcher, whose work grows with text length times pattern size.
//
// The browser's RegExp is never given the pathological pattern and a non-empty text here: such a call is caught,
// recorded and answered false without running, so a regression fails the test instead of hanging jest.
import { screen } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { addTags } from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { applyFilters, cellStyleFor, normalizeColumns } from '@/AppBuilder/Widgets/Ui2/Table/tableModel';

const NESTED = '^(a+)+$';
const TEXT = `${'a'.repeat(28)}!`;
const LONG = `${'a'.repeat(5000)}!`;
let native;
beforeEach(() => {
  native = [];
  for (const method of ['test', 'exec']) {
    const own = RegExp.prototype[method];
    jest.spyOn(RegExp.prototype, method).mockImplementation(function guarded(value) {
      if (this.source === NESTED && String(value) !== '') {
        native.push({ method, flags: this.flags, length: String(value).length });
        return method === 'test' ? false : null;
      }
      return own.call(this, value);
    });
  }
});
afterEach(() => {
  jest.restoreAllMocks();
  expect(native).toEqual([]);
});

// Runs fn and returns what it gave and how long it took.
const timed = (fn) => {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
};

describe('Tags pattern', () => {
  test.each([
    ['29-character', TEXT],
    ['5001-character', LONG],
  ])('a nested-quantifier pattern refuses a %s non-matching tag in bounded time', (_, tag) => {
    const { result, ms } = timed(() => addTags([], [tag], { pattern: NESTED, patternError: 'Only a' }));
    expect(result).toEqual({ tags: [], added: [], error: 'Only a' });
    expect(ms).toBeLessThan(1000);
  });

  test('the same pattern still accepts a matching tag, and a linear one works as before', () => {
    expect(addTags([], ['aaaa'], { pattern: NESTED }).added).toEqual(['aaaa']);
    expect(addTags([], ['abc', 'ab1'], { pattern: '^[a-z]+$' })).toEqual({
      tags: ['abc'],
      added: ['abc'],
      error: '"ab1" is not valid',
    });
  });
});

describe('Table filters and conditional styles', () => {
  const rows = [
    { id: 'long', value: TEXT },
    { id: 'short', value: 'aaa' },
  ];
  const columns = (rules) =>
    normalizeColumns([{ key: 'value', name: 'Value', columnType: 'string', conditionalStyles: rules }], rows);

  test.each([
    ['matches', ['short']],
    ['nl', ['long']],
  ])('a %s filter with a nested-quantifier pattern keeps the right rows in bounded time', (condition, kept) => {
    const filters = [{ column: 'value', condition, value: NESTED }];
    const { result, ms } = timed(() => applyFilters([...rows, { id: 'longer', value: LONG }], filters, columns()));
    expect(result.map((r) => r.id)).toEqual(condition === 'nl' ? [...kept, 'longer'] : kept);
    expect(ms).toBeLessThan(1000);
  });

  test('a conditional style with a nested-quantifier pattern styles only the matching cells', () => {
    const [column] = columns([{ condition: 'matches', value: NESTED, textColor: '#dc2626' }]);
    expect(cellStyleFor(column, rows[0])).toEqual({});
    expect(cellStyleFor(column, rows[1])).toEqual({ color: '#dc2626' });
  });

  describe('mounted', () => {
    const w = createWidgetHarness({
      componentType: 'ShadTable',
      id: 'table1',
      handle: 'table1',
      widgetWidth: 800,
      widgetHeight: 400,
    });
    beforeEach(() => w.setup());
    afterEach(() => w.teardown());

    test.each(['matches', 'nl'])('a %s rule and filter on the pattern render and filter in bounded time', async (c) => {
      const rule = { condition: c, value: NESTED, textColor: '#dc2626' };
      w.render({
        currentMode: 'view',
        properties: {
          data: binding([{ id: 'row1', value: TEXT }]),
          columns: binding([{ key: 'value', name: 'Value', columnType: 'string', conditionalStyles: [rule] }]),
        },
      });
      const cell = (await screen.findByText(TEXT)).closest('td');
      expect(cell.style.color).toBe(c === 'nl' ? 'rgb(220, 38, 38)' : '');
      await w.act('setFilters', [{ column: 'value', condition: c, value: NESTED }]);
      expect(w.exposed().filteredData.map((r) => r.id)).toEqual(c === 'nl' ? ['row1'] : []);
    });
  });
});
