import { buildBlockers, compareBoxes, solveContainer, solveTops, sortBoxes } from '../solver';

// A widget's saved layout inside one container, in grid units: `left`/`width` in
// columns (43 per row), `top`/`height` in px.
const box = (id, top, left, width, height, extra = {}) => ({ id, top, left, width, height, ...extra });
const ids = (boxes) => boxes.map((b) => b.id);

// The current height of each widget: the one given in `heights`, or its saved height.
const flowFrom = (boxes, heights) => (id) => heights[id] ?? boxes.find((b) => b.id === id).height;

describe('dynamic height solver: saved order', () => {
  it('[DynamicHeight-SOLVE-001] orders widgets top to bottom, then left to right', () => {
    // Ids run against the expected order, so only top and left can produce it.
    const boxes = [box('a', 50, 0, 10, 40), box('b', 0, 20, 10, 40), box('c', 0, 0, 10, 40)];
    expect(ids(sortBoxes(boxes))).toEqual(['c', 'b', 'a']);
  });

  it('[DynamicHeight-SOLVE-002] puts the most recently positioned widget last when two share a spot', () => {
    const boxes = [
      box('newer', 0, 0, 10, 40, { updatedAt: '2026-01-02T00:00:00Z' }),
      box('older', 0, 0, 10, 40, { updatedAt: '2026-01-01T00:00:00Z' }),
    ];
    expect(ids(sortBoxes(boxes))).toEqual(['older', 'newer']);
  });

  it('[DynamicHeight-SOLVE-003] falls back to the id when two widgets share a spot and a time', () => {
    const sameTime = { updatedAt: '2026-01-01T00:00:00Z' };
    expect(ids(sortBoxes([box('b', 0, 0, 10, 40, sameTime), box('a', 0, 0, 10, 40, sameTime)]))).toEqual(['a', 'b']);
    // One side has never been saved with a time: the time can't decide, the id does.
    expect(ids(sortBoxes([box('b', 0, 0, 10, 40), box('a', 0, 0, 10, 40, sameTime)]))).toEqual(['a', 'b']);
  });

  it('[DynamicHeight-SOLVE-004] gives the same order whatever order the widgets arrive in', () => {
    const boxes = [box('a', 0, 0, 10, 40), box('b', 0, 0, 10, 40), box('c', 0, 0, 10, 40)];
    expect(ids(sortBoxes([...boxes].reverse()))).toEqual(ids(sortBoxes(boxes)));
    expect(compareBoxes(boxes[0], boxes[0])).toBe(0);
  });

  it('[DynamicHeight-SOLVE-005] leaves the list it was given untouched', () => {
    const boxes = [box('b', 50, 0, 10, 40), box('a', 0, 0, 10, 40)];
    sortBoxes(boxes);
    expect(ids(boxes)).toEqual(['b', 'a']);
  });
});

describe('dynamic height solver: blockers (who can push whom)', () => {
  const blockersOf = (boxes) => {
    const blockers = buildBlockers(sortBoxes(boxes));
    return (id) => ids(blockers.get(id)).sort();
  };

  it('[DynamicHeight-SOLVE-006] blocks a widget only by the nearest widget above it in its column', () => {
    const of = blockersOf([box('a', 0, 0, 43, 40), box('b', 50, 0, 43, 40), box('c', 100, 0, 43, 40)]);
    expect(of('a')).toEqual([]);
    expect(of('b')).toEqual(['a']);
    expect(of('c')).toEqual(['b']);
  });

  it('[DynamicHeight-SOLVE-007] blocks a wide widget by every widget above it across its columns', () => {
    const of = blockersOf([box('left', 0, 0, 20, 100), box('right', 0, 23, 20, 60), box('wide', 120, 0, 43, 40)]);
    expect(of('wide')).toEqual(['left', 'right']);
  });

  it('[DynamicHeight-SOLVE-008] never blocks a widget by one in columns it does not share', () => {
    const of = blockersOf([box('a', 0, 0, 20, 40), box('b', 50, 10, 20, 40), box('c', 100, 0, 5, 40)]);
    // `b` covers columns 10-29: under `a` on the right, but not over `c` (columns 0-4).
    expect(of('b')).toEqual(['a']);
    expect(of('c')).toEqual(['a']);
  });

  it('[DynamicHeight-SOLVE-009] keeps blocking by a widget that the one below overlaps', () => {
    // `b` starts inside `a`. If `a` grows past `b`'s bottom, `c` must still clear `a`.
    const of = blockersOf([box('a', 0, 0, 43, 100), box('b', 80, 0, 43, 40), box('c', 150, 0, 43, 40)]);
    expect(of('c')).toEqual(['a', 'b']);
  });

  it('[DynamicHeight-SOLVE-010] ignores widgets that only touch at a fractional column edge', () => {
    // Saved by an older app: `a` ends at column 10.5 and `b` starts there. Both
    // land in column 10, yet they never share a column.
    const of = blockersOf([
      box('a', 0, 0, 10.5, 50),
      box('b', 60, 10.5, 10, 50),
      box('under', 120, 10, 1, 40), // column 10 only: under the right half of `a` and the left of `b`
    ]);
    expect(of('b')).toEqual([]);
    // `b` passing under `a` in column 10 does not hide `a` from what is below both.
    expect(of('under')).toEqual(['a', 'b']);
  });
});

describe('dynamic height solver: rendered tops', () => {
  // Rendered top of every widget, as { id: top }.
  const topsWith = (boxes, heights = {}) => {
    const sorted = sortBoxes(boxes);
    return Object.fromEntries(solveTops(sorted, buildBlockers(sorted), flowFrom(boxes, heights)));
  };

  it('[DynamicHeight-SOLVE-011] draws every widget at its saved top when no height changed', () => {
    const boxes = [box('a', 0, 0, 20, 100), box('b', 0, 20, 23, 50), box('c', 120, 0, 43, 40)];
    expect(topsWith(boxes)).toEqual({ a: 0, b: 0, c: 120 });
  });

  it('[DynamicHeight-SOLVE-012] pushes the widget below a grown one and keeps the gap the builder drew', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 110, 0, 43, 40)];
    expect(topsWith(boxes, { a: 140 }).b).toBe(150);
  });

  it('[DynamicHeight-SOLVE-013] carries a push down a chain of widgets', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 110, 0, 43, 40), box('c', 160, 0, 43, 40)];
    expect(topsWith(boxes, { a: 140 })).toEqual({ a: 0, b: 150, c: 200 });
    expect(topsWith(boxes, { a: 140, b: 70 }).c).toBe(230);
  });

  it('[DynamicHeight-SOLVE-014] pushes by the larger growth of side-by-side widgets, not their sum', () => {
    const boxes = [box('a', 0, 0, 20, 100), box('b', 0, 20, 23, 100), box('c', 120, 0, 43, 40)];
    expect(topsWith(boxes, { a: 200, b: 300 }).c).toBe(320);
    expect(topsWith(boxes, { a: 200, b: 100 }).c).toBe(220);
  });

  it('[DynamicHeight-SOLVE-015] lets a widget rise when the one above renders shorter than drawn', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 110, 0, 43, 40)];
    expect(topsWith(boxes, { a: 60 }).b).toBe(70);
  });

  it('[DynamicHeight-SOLVE-016] keeps overlapping widgets overlapping by the same amount', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 80, 0, 43, 40)];
    expect(topsWith(boxes, { a: 150 }).b).toBe(130);
  });

  it('[DynamicHeight-SOLVE-017] leaves widgets in other columns where they are', () => {
    const boxes = [box('a', 0, 0, 10, 100), box('b', 110, 10, 10, 40)];
    expect(topsWith(boxes, { a: 300 }).b).toBe(110);
  });

  it('[DynamicHeight-SOLVE-018] moves a widget up to the top of a collapsed widget, its gap included', () => {
    const boxes = [box('h', 0, 0, 43, 100, { collapsible: true }), box('b', 110, 0, 43, 40)];
    expect(topsWith(boxes, { h: 0 }).b).toBe(0);
    expect(topsWith(boxes, { h: 100 }).b).toBe(110);
  });

  it('[DynamicHeight-SOLVE-019] closes up a collapsed widget between two visible ones', () => {
    const boxes = [box('a', 0, 0, 43, 30), box('h', 40, 0, 43, 40, { collapsible: true }), box('b', 90, 0, 43, 40)];
    // `b` takes the collapsed widget's place, 10 px under `a` as `h` was.
    expect(topsWith(boxes, { h: 0 }).b).toBe(40);
  });

  it('[DynamicHeight-SOLVE-020] keeps a widget drawn on a collapsible widget at its offset from that widget top', () => {
    // The builder dropped `b` 50 px down while `h` was collapsed to a strip.
    const boxes = [box('h', 0, 0, 43, 100, { collapsible: true }), box('b', 50, 0, 43, 40)];
    expect(topsWith(boxes, { h: 0 }).b).toBe(50);
    expect(topsWith(boxes, { h: 100 }).b).toBe(150);
  });
});

describe('dynamic height solver: one container', () => {
  const solveWith = (boxes, heights = {}) => solveContainer(boxes, flowFrom(boxes, heights));

  it('[DynamicHeight-SOLVE-021] gives the rendered tops and the lowest rendered bottom', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 110, 0, 43, 40), box('c', 160, 0, 43, 40)];
    // The lowest widget renders taller than it was drawn too: the bottom follows its rendered height.
    const { tops, bottom } = solveWith(boxes, { a: 140, b: 70, c: 60 });
    expect(Object.fromEntries(tops)).toEqual({ a: 0, b: 150, c: 230 });
    expect(bottom).toBe(290);
  });

  it('[DynamicHeight-SOLVE-022] measures the bottom from the widget that reaches lowest, not the last one', () => {
    const boxes = [box('tall', 0, 0, 20, 300), box('short', 50, 23, 20, 40)];
    expect(solveWith(boxes).bottom).toBe(300);
  });

  it('[DynamicHeight-SOLVE-023] leaves a collapsed widget out of the bottom', () => {
    const boxes = [box('a', 0, 0, 43, 40), box('h', 50, 0, 43, 100, { collapsible: true })];
    expect(solveWith(boxes, { h: 0 }).bottom).toBe(40);
    expect(solveWith(boxes, { h: 100 }).bottom).toBe(150);
  });

  it('[DynamicHeight-SOLVE-024] has a bottom of 0 when the container is empty', () => {
    expect(solveWith([])).toEqual({ tops: new Map(), bottom: 0 });
  });

  it('[DynamicHeight-SOLVE-025] returns to the same layout whatever the order of height changes', () => {
    const boxes = [box('a', 0, 0, 20, 100), box('b', 0, 20, 23, 100), box('c', 120, 0, 43, 40)];
    const steps = [{ a: 200 }, { a: 200, b: 300 }, { a: 100, b: 300 }, { a: 100, b: 100 }];
    expect(steps.map((heights) => solveWith(boxes, heights).tops.get('c'))).toEqual([220, 320, 320, 120]);
    // Reaching the same heights by another path, or with the widgets listed in another order, changes nothing.
    expect(solveWith([...boxes].reverse(), { a: 200, b: 300 })).toEqual(solveWith(boxes, { b: 300, a: 200 }));
  });
});
