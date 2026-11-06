/**
 * @jest-environment node
 */
import { detectPinnedRow } from '../PinReorder';

// Rows are 40px tall and start at x=118, to the right of the 70px gutter the drag handle sits in.
const rect = (top) => ({ top, bottom: top + 40, left: 118, right: 1400, width: 1282, height: 40 });
const droppableRects = new Map([
  ['a', rect(100)],
  ['b', rect(140)],
  ['c', rect(180)],
]);
const droppableContainers = [...droppableRects.keys()].map((id) => ({ id }));
const detect = (pointerCoordinates) =>
  detectPinnedRow({
    active: { id: 'a' },
    collisionRect: rect(100),
    droppableRects,
    droppableContainers,
    pointerCoordinates,
  });

describe('detectPinnedRow', () => {
  test('matches on the pointer y alone, so a drag that stays over the gutter still finds a row', () => {
    const [hit, ...rest] = detect({ x: 80, y: 145 });
    expect(hit.id).toBe('b');
    expect(hit.data.side).toBe('before');
    expect(rest).toEqual([]);
  });

  test('tags the lower half of the row as after', () => {
    expect(detect({ x: 80, y: 175 })[0].data.side).toBe('after');
  });

  test('tags the exact middle of the row as after', () => {
    expect(detect({ x: 80, y: 160 })[0].data.side).toBe('after');
  });

  test('treats a row as [top, bottom): the shared edge belongs to the next row', () => {
    expect(detect({ x: 80, y: 140 })[0].id).toBe('b');
  });

  test('finds nothing when y is outside every row', () => {
    expect(detect({ x: 400, y: 50 })).toEqual([]);
    expect(detect({ x: 400, y: 220 })).toEqual([]);
  });

  test('falls back to the closest row for a keyboard drag, which has no pointer', () => {
    const [hit] = detect(null);
    expect(['a', 'b', 'c']).toContain(hit.id);
    expect(hit.data?.side).toBeUndefined();
  });
});
