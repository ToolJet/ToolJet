import { hasCycle, hasCycleInSlices, markAcyclic } from '../cycles';

describe('hasCycle', () => {
  test('finds an object that contains itself, at any depth', () => {
    const a = { b: { c: {} } };
    a.b.c.back = a;
    expect(hasCycle(a)).toBe(true);

    const list = [{ id: 1 }];
    list[0].self = list[0];
    expect(hasCycle(list)).toBe(true);
  });

  test('a subtree shared by several parents is not a cycle', () => {
    const shared = { x: 1 };
    expect(hasCycle({ a: shared, b: shared, c: [shared, shared] })).toBe(false);
  });

  test('plain data and primitives have none', () => {
    expect(hasCycle(Array.from({ length: 1000 }, (_, i) => ({ id: i, tags: ['a'] })))).toBe(false);
    expect(hasCycle('text')).toBe(false);
    expect(hasCycle(null)).toBe(false);
  });

  test('is linear: 100k rows are checked quickly', () => {
    const rows = Array.from({ length: 100000 }, (_, i) => ({ id: i, name: `n${i}`, meta: { a: 1, b: [1, 2] } }));
    const started = Date.now();
    expect(hasCycle(rows)).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  test('with a budget, looks at that many objects only', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    rows[0].self = rows;
    expect(hasCycle(rows, 10)).toBe(true);
    const late = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    late[99].self = late[99];
    expect(hasCycle(late, 10)).toBe(false);
    expect(hasCycle(late)).toBe(true);
  });

  test('values marked acyclic are not walked', () => {
    const value = markAcyclic({ a: { b: 1 } });
    expect(hasCycle({ wrapper: value })).toBe(false);
  });
});

describe('hasCycleInSlices', () => {
  test('answers at once for a small value', () => {
    const a = {};
    a.self = a;
    expect(hasCycleInSlices(a)).toBe(true);
    expect(hasCycleInSlices({ a: 1 })).toBe(false);
  });

  test('a large value is checked over several tasks, with the same answer', async () => {
    const rows = Array.from({ length: 300000 }, (_, i) => ({ id: i, meta: { a: [i] } }));
    rows[299999].meta.back = rows;
    const answer = hasCycleInSlices(rows);
    expect(answer).toBeInstanceOf(Promise);
    await expect(answer).resolves.toBe(true);
  });

  test('a value found to hold no cycle is not walked again', async () => {
    const rows = Array.from({ length: 300000 }, (_, i) => ({ id: i }));
    await hasCycleInSlices(rows);
    expect(hasCycleInSlices(rows)).toBe(false);
  });
});
