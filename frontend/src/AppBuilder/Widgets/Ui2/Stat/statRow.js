// KPI cards side by side came out at different heights: a change chip wrapped in the narrower ones, and a Stat with
// dynamic height is as tall as its own content. Stats that share a row report their natural content height here and
// each takes the tallest as its minimum, dropping back when that one shrinks or leaves. Natural heights are measured
// from the card's content, never from the stretched card, so a row can shrink again.
const rows = new WeakMap();

const rowOf = (key) => {
  if (!rows.has(key)) rows.set(key, { heights: new Map(), listeners: new Set() });
  return rows.get(key);
};

const tallest = (row) => Math.max(0, ...row.heights.values());

const notify = (row) => {
  const h = tallest(row);
  row.listeners.forEach((listen) => listen(h));
};

/** Joins the row keyed by `key` (an object, such as the row's container element). `onTallest` hears the row's tallest
 *  natural height whenever it changes; `report` sets this member's own, `leave` removes it. */
export const joinStatRow = (key, onTallest) => {
  const row = rowOf(key);
  const member = {};
  row.listeners.add(onTallest);
  return {
    report: (height) => {
      if (!(typeof height === 'number' && Number.isFinite(height) && height > 0)) return;
      row.heights.set(member, height);
      notify(row);
    },
    leave: () => {
      row.heights.delete(member);
      row.listeners.delete(onTallest);
      notify(row);
    },
  };
};
