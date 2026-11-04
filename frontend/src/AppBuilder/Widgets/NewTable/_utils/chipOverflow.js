/**
 * Which chips get a place in the header. `widths` are the measured widths by chip id, `available` the room the
 * chips may use and `moreWidth` the width of the "+N more" chip. When everything fits all chips are shown;
 * otherwise room is kept for the more chip and chips that have a value are placed before empty ones.
 * Nothing measured (no layout yet) shows everything.
 */
export const getVisibleChipIds = ({ chips, widths, available, gap, moreWidth }) => {
  if (chips.length === 0) return new Set();

  const widthOf = ({ id }) => widths[id] ?? 0;
  const total = chips.reduce((sum, chip) => sum + widthOf(chip), 0) + gap * (chips.length - 1);
  if (available <= 0 || total <= available) return new Set(chips.map(({ id }) => id));

  const budget = available - moreWidth - gap;
  const visible = new Set();
  let used = 0;
  for (const chip of [...chips.filter(({ applied }) => applied), ...chips.filter(({ applied }) => !applied)]) {
    const next = used + (visible.size ? gap : 0) + widthOf(chip);
    if (next > budget) break;
    visible.add(chip.id);
    used = next;
  }
  return visible;
};
