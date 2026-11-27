import { getRowChips, getRowCountLabel } from '../addNewRowChips';

const rowsOf = (chips) => chips.filter((chip) => chip.type === 'row').map((chip) => chip.index);
const moreOf = (chips) => chips.find((chip) => chip.type === 'more')?.hidden;
const shape = (chips) => chips.map((chip) => (chip.type === 'row' ? chip.index : '…'));

describe('Table-ADDROWFORM-039 row chips and the overflow rule', () => {
  test.each([1, 3, 9, 11])('Table-ADDROWFORM-039 %i rows are all shown, none hidden behind a menu', (count) => {
    // Break this catches: a "…" menu appearing for a handful of rows, or rows going missing.
    const chips = getRowChips(count, 0);

    expect(rowsOf(chips)).toEqual(Array.from({ length: count }, (_, index) => index));
    expect(moreOf(chips)).toBeUndefined();
  });

  test('Table-ADDROWFORM-039 12 rows show rows 1-9, a "…" for 10-11 and the last row', () => {
    // Break this catches: the overflow cut-off moving, or the last row being hidden.
    expect(shape(getRowChips(12, 0))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, '…', 11]);
    expect(moreOf(getRowChips(12, 0))).toEqual([9, 10]);
  });

  test('Table-ADDROWFORM-039 20 rows: "…" lists only the hidden rows 10-19', () => {
    // Break this catches: the menu listing rows that are already visible as chips.
    const chips = getRowChips(20, 0);

    expect(shape(chips)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, '…', 19]);
    expect(moreOf(chips)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  });

  test('Table-ADDROWFORM-039 a picked hidden row takes the place of row 9, and row 9 moves into the menu', () => {
    // Break this catches: the picked row staying invisible, so the user cannot see which row they are on.
    const chips = getRowChips(20, 14);

    expect(shape(chips)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 14, '…', 19]);
    expect(moreOf(chips)).toEqual([8, 9, 10, 11, 12, 13, 15, 16, 17, 18]);
  });

  test('Table-ADDROWFORM-039 going back to a visible row puts row 9 back', () => {
    // Break this catches: the picked row sticking in slot 9 after the user moves on.
    expect(shape(getRowChips(20, 2))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, '…', 19]);
    expect(shape(getRowChips(20, 19))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, '…', 19]);
  });

  test('Table-ADDROWFORM-039 the chips always cover every row exactly once', () => {
    // Break this catches: a row both shown and listed, or neither (it could then never be reached).
    for (const [count, active] of [
      [12, 9],
      [12, 10],
      [15, 12],
      [30, 20],
      [30, 29],
    ]) {
      const chips = getRowChips(count, active);
      const all = [...rowsOf(chips), ...(moreOf(chips) ?? [])].sort((a, b) => a - b);
      expect(all).toEqual(Array.from({ length: count }, (_, index) => index));
    }
  });
});

describe('Table-ADDROWFORM-038 row count wording', () => {
  test('Table-ADDROWFORM-038 the button and the saving text follow the number of rows', () => {
    // Break this catches: "Add 1 rows", or the count missing from the button.
    expect(getRowCountLabel(1)).toBe('row');
    expect(getRowCountLabel(2)).toBe('2 rows');
    expect(getRowCountLabel(12)).toBe('12 rows');
  });
});
