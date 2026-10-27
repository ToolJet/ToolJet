import {
  ANCHOR_STEP,
  ROOM_VIEWPORTS,
  anchorOf,
  createScrollModel,
  itemTop,
  listShape,
  windowTop,
} from '../scrollModel';

const viewport = 500;
// 5M rows of 46 px in an element capped at 30M px: scaled about 7.7×.
const scaled = listShape(5000000 * 46, viewport, 30000000);
const fits = listShape(1000 * 46, viewport, 30000000);

// Where item `offsetOf` shows on screen, relative to the viewport, given what's rendered for this state.
const onScreen = (shape, model, anchor, offsetOf) => {
  const start = offsetOf - anchor;
  const containerTop = shape.scale === 1 ? 0 : parseFloat(windowTop(model.top, model.offset, anchor));
  return containerTop + start - model.top;
};

describe('listShape', () => {
  test('scales only when the items are taller than the element can be', () => {
    expect(fits.scale).toBe(1);
    expect(fits.height).toBe(46000);
    expect(scaled.height).toBe(30000000);
    expect(scaled.scale).toBeCloseTo((5000000 * 46 - viewport) / (30000000 - viewport), 9);
    expect(scaled.maxOffset).toBe(5000000 * 46 - viewport);
  });
});

describe('a list that fits', () => {
  test('the offset is the scroll position', () => {
    const model = createScrollModel();
    expect(model.follow(fits, 1234)).toBe(1234);
    expect(model.follow(fits, 0)).toBe(0);
    expect(model.resync(fits, viewport)).toBeNull();
    expect(itemTop(fits, 920)).toBe('920px');
    expect(anchorOf(fits, 123456)).toBe(0);
  });
});

describe('a scaled list', () => {
  test('wheel and keys move the items 1:1, however far each step goes', () => {
    const model = createScrollModel();
    model.scrollTo(scaled, 7654321, viewport);
    const from = { top: model.top, offset: model.offset };
    // A slow step, and a long one (a blocked main thread coalesces many wheel events into one scroll event).
    expect(model.follow(scaled, from.top + 120)).toBe(from.offset + 120);
    expect(model.follow(scaled, from.top + 120 + 9000)).toBe(from.offset + 9120);
    expect(model.follow(scaled, from.top - 300)).toBe(from.offset - 300);
  });

  test('items never move on screen while scrolling 1:1', () => {
    const model = createScrollModel();
    model.scrollTo(scaled, 50000000, viewport);
    const anchor = anchorOf(scaled, model.offset);
    const item = model.offset + 200; // an item 200 px below the top of the viewport
    const before = onScreen(scaled, model, anchor, item);
    model.follow(scaled, model.top + 37);
    expect(onScreen(scaled, model, anchor, item)).toBeCloseTo(before - 37, 6);
  });

  test('a scrollbar drag maps proportionally from where it started, ends to ends', () => {
    const model = createScrollModel();
    model.scrollTo(scaled, 50000000, viewport);
    const start = { top: model.top, offset: model.offset };
    model.beginDrag();
    // No leap when the drag starts.
    expect(model.follow(scaled, start.top)).toBe(start.offset);
    expect(model.follow(scaled, start.top / 2)).toBeCloseTo(start.offset / 2, 3);
    expect(model.follow(scaled, 0)).toBe(0);
    expect(model.follow(scaled, scaled.maxTop)).toBe(scaled.maxOffset);
    const halfway = start.top + (scaled.maxTop - start.top) / 2;
    expect(model.follow(scaled, halfway)).toBeCloseTo(start.offset + (scaled.maxOffset - start.offset) / 2, 3);
    model.endDrag();
    expect(model.follow(scaled, halfway + 10)).toBeCloseTo(
      start.offset + (scaled.maxOffset - start.offset) / 2 + 10,
      3
    );
  });

  test('the very top and bottom are the first and last items (Home, End, setting the scroll position)', () => {
    const model = createScrollModel();
    model.scrollTo(scaled, 50000000, viewport);
    expect(model.follow(scaled, 0)).toBe(0);
    model.scrollTo(scaled, 50000000, viewport);
    expect(model.follow(scaled, scaled.maxTop)).toBe(scaled.maxOffset);
  });

  test('near an end, wheeling reaches it together with the items: no leap at the end', () => {
    const room = ROOM_VIEWPORTS * viewport;
    const wheel = (model, step) => {
      let largest = 0;
      for (let guard = 0; guard < 1e6; guard++) {
        const top = Math.max(0, Math.min(scaled.maxTop, model.top + step));
        if (top === model.top) break;
        const before = model.offset;
        largest = Math.max(largest, Math.abs(model.follow(scaled, top) - before));
      }
      return largest;
    };
    for (const target of [3000, room / 2, room - 1]) {
      const model = createScrollModel();
      model.scrollTo(scaled, target, viewport);
      expect(wheel(model, -120)).toBeLessThanOrEqual(120);
      expect(model.offset).toBe(0);
    }
    for (const target of [scaled.maxOffset - 3000, scaled.maxOffset - room / 2]) {
      const model = createScrollModel();
      model.scrollTo(scaled, target, viewport);
      expect(wheel(model, 120)).toBeLessThanOrEqual(120);
      expect(model.offset).toBe(scaled.maxOffset);
    }
  });

  test('a resync moves the thumb, never the items on screen', () => {
    const model = createScrollModel();
    model.scrollTo(scaled, 5000000, viewport);
    // Drag the thumb near the start: the items are then further from it than the thumb is (short of 1:1 room).
    model.beginDrag();
    model.follow(scaled, 1000);
    model.endDrag();
    expect(model.offset).toBeGreaterThan(model.top);
    const anchor = anchorOf(scaled, model.offset);
    const item = model.offset + 123;
    const before = onScreen(scaled, model, anchor, item);
    const next = model.resync(scaled, viewport);
    expect(next).not.toBeNull();
    // The resync's own scroll event changes nothing.
    expect(model.follow(scaled, next)).toBe(model.offset);
    expect(onScreen(scaled, model, anchor, item)).toBeCloseTo(before, 6);
    expect(model.resync(scaled, viewport)).toBeNull();
  });

  test('no resync in the middle of the list, or during a drag', () => {
    const model = createScrollModel();
    model.scrollTo(scaled, 100000000, viewport);
    model.follow(scaled, model.top + 5000);
    expect(model.resync(scaled, viewport)).toBeNull();
    model.beginDrag();
    model.follow(scaled, 10);
    expect(model.resync(scaled, viewport)).toBeNull();
  });

  test('items are placed against an anchor in steps, so positions stay small', () => {
    expect(anchorOf(scaled, ANCHOR_STEP * 3 + 17)).toBe(ANCHOR_STEP * 3);
    expect(itemTop(scaled, 920)).toBe('calc(var(--tj-window-top, 0px) + 920px)');
  });

  test('items above the view changing height keep the items in view still', () => {
    const model = createScrollModel();
    model.scrollTo(scaled, 50000000, viewport);
    expect(model.adjust(scaled, 54)).toBeNull();
    expect(model.offset).toBe(50000054);
    const list = createScrollModel();
    list.follow(fits, 1000);
    expect(list.adjust(fits, 54)).toBe(1054);
    expect(list.follow(fits, 1054)).toBe(1054);
  });
});
