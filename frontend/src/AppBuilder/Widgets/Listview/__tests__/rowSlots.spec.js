import { assignSlots, NO_SLOTS } from '../rowSlots';

describe('assignSlots', () => {
  test('rows take slots in order the first time', () => {
    expect(assignSlots(NO_SLOTS, [4, 5, 6])).toEqual({ slots: [4, 5, 6], items: [4, 5, 6], reset: [], changed: true });
  });

  test('a row keeps its slot while it stays; rows coming in take the freed slots', () => {
    const first = assignSlots(NO_SLOTS, [4, 5, 6]);
    const next = assignSlots(first, [5, 6, 7]);
    expect(next.slots).toEqual([7, 5, 6]);
    expect(next.items).toEqual([7, 5, 6]);
    expect(next.reset).toEqual([0]);
  });

  test('a freed slot keeps the listItem of the row it showed', () => {
    const first = assignSlots(NO_SLOTS, [1, 2, 3]);
    const next = assignSlots(first, [1, 3]);
    expect(next.slots).toEqual([1, -1, 3]);
    expect(next.items).toEqual([1, 2, 3]);
    expect(next.changed).toBe(true);
  });

  test('free slots at the end are dropped', () => {
    const first = assignSlots(NO_SLOTS, [1, 2, 3]);
    expect(assignSlots(first, [1]).slots).toEqual([1]);
  });

  test('the same rows change nothing', () => {
    const first = assignSlots(NO_SLOTS, [8, 9]);
    expect(assignSlots(first, [9, 8])).toEqual({ ...first, reset: [], changed: false });
  });

  test('pinned rows far from the window keep their slots', () => {
    let state = assignSlots(NO_SLOTS, [0, 1, 2, 500]);
    for (let top = 1; top < 50; top++) state = assignSlots(state, [top, top + 1, top + 2, 500]);
    expect(state.slots[3]).toBe(500);
    expect(state.slots).toHaveLength(4);
  });
});
