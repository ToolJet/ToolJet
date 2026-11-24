import { buildBlockers, renderedTopFor, savedTopForVisibleTop, solveContainer, solveTops, sortBoxes } from '../solver';

const box = (id, top, left, width, height, extra = {}) => ({ id, top, left, width, height, ...extra });

const solveWith = (boxes, heights) => {
  const flowOf = (id) => heights[id] ?? boxes.find((b) => b.id === id).height;
  return solveContainer(boxes, flowOf);
};

describe('dynamic height solver', () => {
  it('keeps every widget at its saved top when no height changed', () => {
    const boxes = [box('a', 0, 0, 20, 100), box('b', 0, 20, 23, 50), box('c', 120, 0, 43, 40)];
    const { tops } = solveWith(boxes, {});
    expect(Object.fromEntries(tops)).toEqual({ a: 0, b: 0, c: 120 });
  });

  it('pushes a widget below a grown one and keeps the drawn gap', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 110, 0, 43, 40), box('c', 160, 0, 43, 40)];
    const { tops } = solveWith(boxes, { a: 140 });
    expect(tops.get('b')).toBe(150);
    expect(tops.get('c')).toBe(200);
  });

  it('takes the larger push from side-by-side widgets, not their sum', () => {
    const boxes = [box('a', 0, 0, 20, 100), box('b', 0, 20, 23, 100), box('c', 120, 0, 43, 40)];
    expect(solveWith(boxes, { a: 200, b: 300 }).tops.get('c')).toBe(320);
    expect(solveWith(boxes, { a: 200, b: 100 }).tops.get('c')).toBe(220);
  });

  it('returns to the same layout after any sequence of height changes', () => {
    const boxes = [box('a', 0, 0, 20, 100), box('b', 0, 20, 23, 100), box('c', 120, 0, 43, 40)];
    const steps = [{ a: 200 }, { a: 200, b: 300 }, { a: 100, b: 300 }, { a: 100, b: 100 }];
    const results = steps.map((heights) => solveWith(boxes, heights).tops.get('c'));
    expect(results).toEqual([220, 320, 320, 120]);
  });

  it('moves a widget up to the top of a collapsed hidden widget, gap included', () => {
    const boxes = [box('h', 0, 0, 43, 100, { collapsible: true }), box('b', 110, 0, 43, 40)];
    expect(solveWith(boxes, { h: 0 }).tops.get('b')).toBe(0);
    expect(solveWith(boxes, { h: 100 }).tops.get('b')).toBe(110);
  });

  it('closes up a run of collapsed hidden widgets under a visible one', () => {
    const boxes = [box('a', 0, 0, 43, 30), box('h', 40, 0, 43, 40, { collapsible: true }), box('b', 90, 0, 43, 40)];
    expect(solveWith(boxes, { h: 0 }).tops.get('b')).toBe(40);
  });

  it('keeps the offset of a widget drawn inside a collapsible widget area', () => {
    const boxes = [box('h', 0, 0, 43, 100, { collapsible: true }), box('b', 50, 0, 43, 40)];
    expect(solveWith(boxes, { h: 0 }).tops.get('b')).toBe(50);
    expect(solveWith(boxes, { h: 100 }).tops.get('b')).toBe(150);
  });

  it('lets a widget rise when the one above renders shorter than drawn', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 110, 0, 43, 40)];
    expect(solveWith(boxes, { a: 60 }).tops.get('b')).toBe(70);
  });

  it('carries a push down a chain of widgets', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 110, 0, 43, 40), box('c', 160, 0, 43, 40)];
    const { tops, bottom } = solveWith(boxes, { a: 140, b: 70 });
    expect(tops.get('c')).toBe(230);
    expect(bottom).toBe(270);
  });

  it('only pushes widgets that share a column', () => {
    const boxes = [box('a', 0, 0, 10, 100), box('b', 110, 10, 10, 40)];
    expect(solveWith(boxes, { a: 300 }).tops.get('b')).toBe(110);
  });

  it('keeps overlapping widgets overlapping by the same amount', () => {
    const boxes = [box('a', 0, 0, 43, 100), box('b', 80, 0, 43, 40)];
    expect(solveWith(boxes, { a: 150 }).tops.get('b')).toBe(130);
  });

  it('does not treat widgets that only touch at a fractional column edge as stacked', () => {
    // Saved from an older app: `a` ends at column 10.5 and `b` starts there.
    // They never share a column, so `a` growing must not move `b`.
    const boxes = [box('a', 0, 0, 10.5, 50), box('b', 60, 10.5, 10, 50)];
    expect(solveWith(boxes, { a: 150 }).tops.get('b')).toBe(60);
  });

  it('builds blockers from the nearest widget in each column', () => {
    const sorted = sortBoxes([box('a', 0, 0, 43, 40), box('b', 50, 0, 43, 40), box('c', 100, 0, 43, 40)]);
    const blockers = buildBlockers(sorted);
    expect(blockers.get('c').map((b) => b.id)).toEqual(['b']);
    expect(solveTops(sorted, blockers, () => 40).get('c')).toBe(100);
  });
});

// Editor POC: the inverse used for drops, pastes and sticky siblings.
describe('saved top for a visible drop position', () => {
  const siblingsFor = (boxes, heights) => {
    const flowOf = (id) => heights[id] ?? boxes.find((b) => b.id === id).height;
    const { tops } = solveContainer(boxes, flowOf);
    return { siblings: boxes, tops, flowOf };
  };

  it('subtracts the push above the drop location', () => {
    const context = siblingsFor([box('a', 0, 0, 43, 100)], { a: 140 });
    const saved = savedTopForVisibleTop({ visibleTop: 200, left: 0, width: 10, height: 40, ...context });
    expect(saved).toBe(160);
    expect(
      renderedTopFor({ top: saved, left: 0, width: 10, height: 40 }, context.siblings, context.tops, context.flowOf)
    ).toBe(200);
  });

  it('uses the larger of two side-by-side pushes', () => {
    const context = siblingsFor([box('d1', 0, 0, 20, 100), box('d2', 0, 20, 23, 100)], { d1: 160, d2: 140 });
    expect(savedTopForVisibleTop({ visibleTop: 280, left: 0, width: 43, height: 40, ...context })).toBe(220);
  });

  it('clamps a drop inside a grown widget strip to just below it', () => {
    const context = siblingsFor([box('a', 0, 0, 43, 100)], { a: 140 });
    const saved = savedTopForVisibleTop({ visibleTop: 20, left: 0, width: 43, height: 40, ...context });
    expect(saved).toBe(0);
    expect(
      renderedTopFor({ top: saved, left: 0, width: 43, height: 40 }, context.siblings, context.tops, context.flowOf)
    ).toBe(40);
  });

  it('saves a drop under a collapsed widget inside its area, so it is pushed below it when shown', () => {
    const hidden = box('h', 0, 0, 43, 100, { collapsible: true });
    const context = siblingsFor([hidden], { h: 0 });
    const saved = savedTopForVisibleTop({ visibleTop: 10, left: 0, width: 43, height: 40, ...context });
    expect(saved).toBe(10);
    const shown = siblingsFor([hidden], { h: 100 });
    expect(
      renderedTopFor({ top: saved, left: 0, width: 43, height: 40 }, shown.siblings, shown.tops, shown.flowOf)
    ).toBe(110);
  });

  it('keeps the visible top when nothing is above the drop', () => {
    const context = siblingsFor([box('a', 0, 0, 10, 100)], { a: 300 });
    expect(savedTopForVisibleTop({ visibleTop: 50, left: 20, width: 10, height: 40, ...context })).toBe(50);
  });
});
