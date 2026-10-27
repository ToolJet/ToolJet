import { boundedSnapshot, stringifyBounded } from '../bounded';

describe('boundedSnapshot', () => {
  test('a small value is kept whole, as is', () => {
    const value = { rows: [{ id: 1 }, { id: 2 }], name: 'x' };
    expect(boundedSnapshot(value)).toBe(value);
    expect(boundedSnapshot('text')).toBe('text');
    expect(boundedSnapshot(null)).toBe(null);
  });

  test('a large value keeps its first entries and says what was left out', () => {
    const rows = Array.from({ length: 5000 }, (_, id) => ({ id }));
    const snapshot = boundedSnapshot({ data: rows });
    expect(snapshot).not.toBe(rows);
    expect(snapshot.data).toHaveLength(101);
    expect(snapshot.data[0]).toEqual({ id: 0 });
    expect(snapshot.data[100]).toBe('… 4900 more items');
  });

  test('a large array of numbers is bounded too', () => {
    const snapshot = boundedSnapshot(Array.from({ length: 5000 }, (_, i) => i));
    expect(snapshot).toHaveLength(101);
  });

  test('cycles and depth are bounded', () => {
    const deep = { a: { b: { c: { d: { e: { f: 1 } } } } }, filler: Array.from({ length: 3000 }, () => 1) };
    deep.self = deep;
    const snapshot = boundedSnapshot(deep);
    expect(snapshot.self).toBe('[Circular]');
    expect(snapshot.a.b.c.d.e).toBe('[Object]');
  });
});

describe('stringifyBounded', () => {
  test('writes JSON up to the limit', () => {
    expect(stringifyBounded({ a: [1, 2] }, 100)).toEqual({ text: '{"a":[1,2]}', truncated: false });
    expect(stringifyBounded({ a: [1, 2] }, 5)).toEqual({ text: '{"a":', truncated: true });
  });
});
