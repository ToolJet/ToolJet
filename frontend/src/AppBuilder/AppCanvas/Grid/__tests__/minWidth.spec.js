import { getMinWidthPx } from '../minWidth';

describe('getMinWidthPx', () => {
  test('[Listview-SIZE-003] a ListView minimum is 140px rounded up to whole columns of its parent canvas', () => {
    // Break this catches: a minimum that is not a whole number of columns, which snaps back below 140px on drop.
    expect(getMinWidthPx('Listview', 1000 / 43, 1000 / 43)).toBeCloseTo((1000 / 43) * 7);
    expect(getMinWidthPx('Listview', 10, 23)).toBe(140);
    expect(getMinWidthPx('Listview', 12.5, 23)).toBe(150);
  });

  test('[Listview-SIZE-004] every other widget keeps the default minimum', () => {
    // Break this catches: the ListView minimum applied to every widget.
    expect(getMinWidthPx('Button', 10, 23)).toBe(23);
    expect(getMinWidthPx(undefined, 10, 23)).toBe(23);
  });
});
