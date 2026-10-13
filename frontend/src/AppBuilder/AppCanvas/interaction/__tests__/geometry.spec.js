import {
  COLUMNS,
  ROW,
  canvasBounds,
  keepInside,
  landAt,
  convertWidth,
  resizeBox,
  resizeGroup,
  moveGroup,
  boundingBox,
  intersects,
  rectFromPoints,
  pastThreshold,
  HANDLES,
} from '../geometry';

const GW = 20; // px per column
const box = { left: 10, top: 100, width: 5, height: 40 };

describe('landAt', () => {
  it('snaps the top-left corner to the nearest column and row', () => {
    expect(landAt({ x: 109, y: 54 }, { width: 5, height: 40 }, GW)).toEqual({ left: 5, top: 50, width: 5, height: 40 });
    expect(landAt({ x: 111, y: 56 }, { width: 5, height: 40 }, GW)).toEqual({ left: 6, top: 60, width: 5, height: 40 });
  });

  it('never leaves the canvas: left, right, top', () => {
    expect(landAt({ x: -500, y: -500 }, { width: 5, height: 40 }, GW)).toMatchObject({ left: 0, top: 0 });
    expect(landAt({ x: 10_000, y: 0 }, { width: 5, height: 40 }, GW)).toMatchObject({ left: COLUMNS - 5 });
  });

  it('stays on a row line above a bottom that is not on one', () => {
    expect(landAt({ x: 0, y: 500 }, { width: 5, height: 40 }, GW, canvasBounds(81))).toMatchObject({ top: 40 });
    expect(resizeBox(box, 's', { dx: 0, dy: 500 }, GW, canvasBounds(207))).toMatchObject({ top: 100, height: 100 });
  });

  it('stays above a bounded canvas bottom', () => {
    expect(landAt({ x: 0, y: 990 }, { width: 5, height: 40 }, GW, canvasBounds(1000))).toMatchObject({ top: 960 });
  });
});

describe('keepInside', () => {
  it('narrows a box wider than the canvas', () => {
    expect(keepInside({ left: 3, top: 0, width: 60, height: 10 })).toEqual({
      left: 0,
      top: 0,
      width: COLUMNS,
      height: 10,
    });
  });
  it('pins a box taller than a bounded canvas to the top', () => {
    expect(keepInside({ left: 0, top: 30, width: 1, height: 500 }, canvasBounds(100))).toMatchObject({ top: 0 });
  });
});

describe('convertWidth', () => {
  it('keeps the pixel width across grids', () => {
    expect(convertWidth(10, 20, 10)).toBe(20);
    expect(convertWidth(10, 10, 20)).toBe(5);
  });
  it('stays between one column and all of them', () => {
    expect(convertWidth(1, 5, 100)).toBe(1);
    expect(convertWidth(43, 30, 10)).toBe(COLUMNS);
  });
  it('is unchanged on the same grid', () => {
    expect(convertWidth(7, 20, 20)).toBe(7);
  });
});

describe('resizeBox', () => {
  it('moves only the grabbed edges, snapped to the grid', () => {
    expect(resizeBox(box, 'e', { dx: 47, dy: 999 }, GW)).toEqual({ left: 10, width: 7, top: 100, height: 40 });
    expect(resizeBox(box, 's', { dx: 999, dy: 14 }, GW)).toEqual({ left: 10, width: 5, top: 100, height: 50 });
    expect(resizeBox(box, 'nw', { dx: -41, dy: -26 }, GW)).toEqual({ left: 8, width: 7, top: 70, height: 70 });
  });

  it('stops each edge at the canvas boundary without pushing the opposite edge', () => {
    expect(resizeBox(box, 'w', { dx: -10_000, dy: 0 }, GW)).toEqual({ left: 0, width: 15, top: 100, height: 40 });
    expect(resizeBox(box, 'e', { dx: 10_000, dy: 0 }, GW)).toEqual({
      left: 10,
      width: COLUMNS - 10,
      top: 100,
      height: 40,
    });
    expect(resizeBox(box, 'n', { dx: 0, dy: -10_000 }, GW)).toEqual({ left: 10, width: 5, top: 0, height: 140 });
    expect(resizeBox(box, 's', { dx: 0, dy: 10_000 }, GW, canvasBounds(200))).toEqual({
      left: 10,
      width: 5,
      top: 100,
      height: 100,
    });
  });

  it('keeps at least one column and one row', () => {
    expect(resizeBox(box, 'e', { dx: -10_000, dy: 0 }, GW)).toMatchObject({ left: 10, width: 1 });
    expect(resizeBox(box, 'w', { dx: 10_000, dy: 0 }, GW)).toMatchObject({ left: 14, width: 1 });
    expect(resizeBox(box, 's', { dx: 0, dy: -10_000 }, GW)).toMatchObject({ top: 100, height: ROW });
    expect(resizeBox(box, 'n', { dx: 0, dy: 10_000 }, GW)).toMatchObject({ top: 130, height: ROW });
  });

  it('is the identity for a zero move on every handle', () => {
    for (const handle of HANDLES) expect(resizeBox(box, handle, { dx: 0, dy: 0 }, GW)).toEqual(box);
  });
});

describe('groups', () => {
  const a = { id: 'a', left: 0, top: 0, width: 4, height: 40 };
  const b = { id: 'b', left: 6, top: 20, width: 4, height: 40 };

  it('bounds the members', () => {
    expect(boundingBox([a, b])).toEqual({ left: 0, top: 0, width: 10, height: 60 });
  });

  it('moves every member by the same amount', () => {
    expect(moveGroup([a, b], { left: 3, top: 50 })).toEqual([
      { ...a, left: 3, top: 50 },
      { ...b, left: 9, top: 70 },
    ]);
  });

  it('scales members with the group and keeps them on the grid', () => {
    const [ra, rb] = resizeGroup([a, b], 'e', { dx: 200, dy: 0 }, GW);
    expect(ra).toMatchObject({ left: 0, width: 8 });
    expect(rb).toMatchObject({ left: 12, width: 8 });
    expect(ra.top).toBe(0);
    expect(rb.top).toBe(20);
  });

  it('keeps every member at least one column and one row', () => {
    for (const member of resizeGroup([a, b], 'se', { dx: -10_000, dy: -10_000 }, GW)) {
      expect(member.width).toBeGreaterThanOrEqual(1);
      expect(member.height).toBeGreaterThanOrEqual(ROW);
    }
  });
});

describe('marquee helpers', () => {
  it('builds a rectangle from two points in any order', () => {
    expect(rectFromPoints({ x: 10, y: 50 }, { x: 0, y: 5 })).toEqual({ left: 0, top: 5, right: 10, bottom: 50 });
  });
  it('counts overlap, not touching', () => {
    const r = { left: 0, top: 0, right: 10, bottom: 10 };
    expect(intersects(r, { left: 9, top: 9, right: 20, bottom: 20 })).toBe(true);
    expect(intersects(r, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(false);
  });
  it('treats a small wobble as a click', () => {
    expect(pastThreshold({ x: 0, y: 0 }, { x: 3, y: -3 })).toBe(false);
    expect(pastThreshold({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true);
  });
});
