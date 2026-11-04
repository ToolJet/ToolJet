import { getVisibleChipIds } from '../chipOverflow';

const chip = (id, applied = false) => ({ id, applied });

describe('Table-FILTERUI-023 which chips fit in the header', () => {
  const GAP = 8;
  const MORE = 60;

  test('Table-FILTERUI-023 all chips are shown when they fit, with no room kept for "+N more"', () => {
    // Break this catches: a "+N more" chip appearing when everything fits.
    const chips = [chip('a'), chip('b')];

    expect(getVisibleChipIds({ chips, widths: { a: 100, b: 100 }, available: 208, gap: GAP, moreWidth: MORE })).toEqual(
      new Set(['a', 'b'])
    );
  });

  test('Table-FILTERUI-023 when they do not fit, room is kept for the "+N more" chip', () => {
    // Break this catches: the "+N more" chip pushed out of the header by the chips it summarises.
    const chips = [chip('a'), chip('b'), chip('c')];
    // all three need 316; with 60 + 8 kept for the more chip only 232 is left: two chips (208) fit, three do not
    const visible = getVisibleChipIds({
      chips,
      widths: { a: 100, b: 100, c: 100 },
      available: 300,
      gap: GAP,
      moreWidth: MORE,
    });

    expect(visible).toEqual(new Set(['a', 'b']));
  });

  test('Table-FILTERUI-023 a chip that has a value takes the space before an empty one', () => {
    // Break this catches: a filled-in filter hidden behind "+N more" while an empty one stays visible.
    const chips = [chip('a'), chip('b', true), chip('c')];

    const visible = getVisibleChipIds({
      chips,
      widths: { a: 100, b: 100, c: 100 },
      available: 250,
      gap: GAP,
      moreWidth: MORE,
    });

    expect(visible).toEqual(new Set(['b']));
  });

  test('Table-FILTERUI-023 filled-in chips fill the room first, then empty ones in their own order', () => {
    // Break this catches: the empty chips taking the room of filled-in ones further along.
    const chips = [chip('a'), chip('b'), chip('c', true), chip('d', true)];

    const visible = getVisibleChipIds({
      chips,
      widths: { a: 100, b: 100, c: 100, d: 100 },
      available: 300,
      gap: GAP,
      moreWidth: MORE,
    });

    expect(visible).toEqual(new Set(['c', 'd']));
  });

  test('Table-FILTERUI-023 when not even one chip fits, they all go behind "+N more"', () => {
    // Break this catches: a chip wider than the header being forced in and clipped.
    expect(
      getVisibleChipIds({ chips: [chip('a')], widths: { a: 500 }, available: 300, gap: GAP, moreWidth: MORE })
    ).toEqual(new Set());
  });

  test('Table-FILTERUI-023 with nothing measured yet, every chip is shown', () => {
    // Break this catches: all chips hidden before the first measurement (and in environments without layout).
    const chips = [chip('a'), chip('b')];

    expect(getVisibleChipIds({ chips, widths: { a: 0, b: 0 }, available: 0, gap: GAP, moreWidth: 0 })).toEqual(
      new Set(['a', 'b'])
    );
  });

  test('Table-FILTERUI-023 no chips, no visible ids', () => {
    // Break this catches: a crash on an empty list.
    expect(getVisibleChipIds({ chips: [], widths: {}, available: 300, gap: GAP, moreWidth: MORE })).toEqual(new Set());
  });
});
