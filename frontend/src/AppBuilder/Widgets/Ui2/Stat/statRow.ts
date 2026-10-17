// KPI cards side by side came out at different heights: a change chip wrapped in the narrower ones, and a Stat with
// dynamic height is as tall as its own content. Stats that share a row report their natural content height here and
// each takes the tallest as its minimum, dropping back when that one shrinks or leaves. Natural heights are measured
// from the card's content, never from the stretched card, so a row can shrink again.
type Listener = (height: number) => void;

interface StatRow {
  heights: Map<object, number>;
  listeners: Set<Listener>;
}

const rows = new WeakMap<object, StatRow>();

const rowOf = (key: object): StatRow => {
  let row = rows.get(key);
  if (!row) {
    row = { heights: new Map(), listeners: new Set() };
    rows.set(key, row);
  }
  return row;
};

const tallest = (row: StatRow) => Math.max(0, ...row.heights.values());

const notify = (row: StatRow) => {
  const h = tallest(row);
  row.listeners.forEach((listen) => listen(h));
};

/** Joins the row keyed by `key` (an object, such as the row's container element). `onTallest` hears the row's tallest
 *  natural height whenever it changes; `report` sets this member's own, `leave` removes it. */
export const joinStatRow = (
  key: object,
  onTallest: Listener
): { report: (height: unknown) => void; leave: () => void } => {
  const row = rowOf(key);
  const member = {};
  row.listeners.add(onTallest);
  return {
    report: (height: unknown) => {
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
