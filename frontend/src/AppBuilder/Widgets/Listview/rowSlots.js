/**
 * Slots for a ListView with too many rows to render them all (see Listview.jsx): only a window of rows is rendered,
 * each in a slot, and the store holds the children's per-row values by slot, so its per-row arrays stay a few dozen
 * long whatever the row count (an array of millions costs ~30 ms per store write). Slot s shows data row `slots[s]`
 * (-1: none) and carries the listItem of `items[s]`, the last row it showed, so a slot with no row still resolves.
 *
 * A row keeps its slot while it stays rendered. A row coming into view takes the first free slot; the slots that change
 * rows are listed in `reset` (their children's values for the previous row are cleared). Free slots at the end are
 * dropped.
 */

export const NO_SLOTS = Object.freeze({ slots: [], items: [] });

/** Slots for `rows` (the data rows to render), from the previous `{ slots, items }`. */
export const assignSlots = (previous, rows) => {
  const want = new Set(rows);
  const slots = previous.slots.slice();
  const items = previous.items.slice();
  const slotOf = new Map();
  slots.forEach((row, slot) => {
    if (row < 0) return;
    if (want.has(row)) slotOf.set(row, slot);
    else slots[slot] = -1;
  });

  const reset = [];
  let free = 0;
  for (const row of rows) {
    if (slotOf.has(row)) continue;
    while (free < slots.length && slots[free] >= 0) free += 1;
    if (free === slots.length) {
      slots.push(-1);
      items.push(row);
    }
    if (free < previous.slots.length) reset.push(free);
    slots[free] = row;
    items[free] = row;
    slotOf.set(row, free);
  }
  while (slots.length && slots[slots.length - 1] < 0) {
    slots.pop();
    items.pop();
  }

  const changed = slots.length !== previous.slots.length || slots.some((row, slot) => row !== previous.slots[slot]);
  return { slots, items, reset, changed };
};
