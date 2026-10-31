// Rows 1-9, a "…" menu for the hidden middle rows, and the last row stay on screen (Figma, multiple rows).
// Up to 11 rows fit as they are; "…" would then hide a single row.
const FIRST_VISIBLE = 9;
const ALL_VISIBLE_UP_TO = 11;

/**
 * What the row picker draws for `count` rows with row `active` (0-based) selected: a list of
 * `{ type: 'row', index }` chips and one `{ type: 'more', hidden: [...] }` entry for the "…" menu.
 * A hidden row that is selected takes the place of row 9, so the user can always see where they are;
 * row 9 then moves into the menu.
 */
export const getRowChips = (count, active) => {
  const all = Array.from({ length: count }, (_, index) => ({ type: 'row', index }));
  if (count <= ALL_VISIBLE_UP_TO) return all;

  const last = count - 1;
  const slot = active >= FIRST_VISIBLE && active < last ? active : FIRST_VISIBLE - 1;
  const shown = new Set([...Array.from({ length: FIRST_VISIBLE - 1 }, (_, index) => index), slot, last]);
  const hidden = all.filter(({ index }) => !shown.has(index)).map(({ index }) => index);

  return [
    ...all.slice(0, FIRST_VISIBLE - 1),
    { type: 'row', index: slot },
    { type: 'more', hidden },
    { type: 'row', index: last },
  ];
};

// "Add row" / "Add 3 rows" (and "Adding row…" / "Adding 3 rows…")
export const getRowCountLabel = (count) => (count === 1 ? 'row' : `${count} rows`);
