import { freeze as immerFreeze } from 'immer';
import { deepFreeze, deepFreezeInSlices } from '../freeze';

class Point {
  constructor() {
    this.at = { x: 1 };
  }
}

// A value with every kind of thing Immer's deep freeze treats differently.
const sample = () => {
  const shared = { s: 1 };
  const cyclic = { name: 'c' };
  cyclic.self = cyclic;
  return {
    rows: [
      { id: 1, address: { city: 'a' }, tags: ['x'] },
      { id: 2, nested: [[{ deep: true }]] },
    ],
    shared: [shared, shared],
    cyclic,
    date: new Date(0),
    point: new Point(),
    map: new Map([['k', { v: 1 }]]),
    set: new Set([{ v: 2 }]),
    nothing: null,
    text: 'text',
  };
};

// Which objects in a value are frozen, by path (Map/Set entries included).
const frozenPaths = (value, path = '$', seen = new Set(), out = {}) => {
  if (value === null || typeof value !== 'object' || seen.has(value)) return out;
  seen.add(value);
  out[path] = Object.isFrozen(value);
  const entries =
    value instanceof Map
      ? [...value.entries()]
      : value instanceof Set
        ? [...value].map((v, i) => [i, v])
        : Object.entries(value);
  entries.forEach(([key, child]) => frozenPaths(child, `${path}.${String(key)}`, seen, out));
  return out;
};

describe('deepFreeze', () => {
  test("freezes exactly what Immer's deep freeze does", () => {
    expect(frozenPaths(deepFreeze(sample()))).toEqual(frozenPaths(immerFreeze(sample(), true)));
  });

  test('writes into a frozen value are ignored, at any depth', () => {
    const value = deepFreeze({ rows: [{ id: 1, address: { city: 'a' } }] });
    expect(() => {
      'use strict';
      value.rows[0].address.city = 'b';
    }).toThrow(TypeError);
    expect(value.rows[0].address.city).toBe('a');
  });

  test('a value already frozen is taken as it is, at once', () => {
    const rows = deepFreeze(Array.from({ length: 1000 }, (_, i) => ({ id: i })));
    const filtered = rows.filter((row) => row.id % 2);
    deepFreeze(filtered);
    expect(Object.isFrozen(filtered)).toBe(true);
    expect(filtered[0]).toBe(rows[1]);
  });
});

describe('deepFreezeInSlices', () => {
  test('freezes what deepFreeze freezes', async () => {
    const value = sample();
    const pending = deepFreezeInSlices(value);
    if (pending) await pending;
    expect(frozenPaths(value)).toEqual(frozenPaths(deepFreeze(sample())));
  });

  test('finishes inline (null) when small, in later tasks when large', async () => {
    expect(deepFreezeInSlices([{ id: 1 }])).toBeNull();
    const rows = Array.from({ length: 300000 }, (_, i) => ({ id: i, address: { city: 'c' }, tags: ['t'] }));
    const pending = deepFreezeInSlices(rows);
    expect(pending).toBeInstanceOf(Promise);
    await pending;
    expect(Object.isFrozen(rows) && Object.isFrozen(rows[299999].address) && Object.isFrozen(rows[0].tags)).toBe(true);
  });

  test('a long array inside itself, or shared, is walked once and frozen', async () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
    rows.push(rows);
    const value = { a: rows, b: rows };
    const pending = deepFreezeInSlices(value);
    if (pending) await pending;
    expect([Object.isFrozen(value), Object.isFrozen(rows), Object.isFrozen(rows[4999])]).toEqual([true, true, true]);
  });

  test('between slices, a frozen row is frozen throughout, and the long array once all its rows are', async () => {
    const rows = Array.from({ length: 300000 }, (_, i) => ({ id: i, address: { city: 'c' } }));
    const pending = deepFreezeInSlices(rows);
    expect(Object.isFrozen(rows)).toBe(false);
    rows.forEach((row) => {
      if (Object.isFrozen(row)) expect(Object.isFrozen(row.address)).toBe(true);
    });
    expect(rows.some((row) => !Object.isFrozen(row))).toBe(true);
    await pending;
    expect(rows.every((row) => Object.isFrozen(row))).toBe(true);
  });
});
