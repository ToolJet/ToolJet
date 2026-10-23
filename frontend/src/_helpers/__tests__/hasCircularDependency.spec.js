import { hasCircularDependency } from '@/_helpers/utils';

describe('hasCircularDependency', () => {
  test('finds an object that contains itself, at any depth', () => {
    const a = { b: { c: {} } };
    a.b.c.back = a;
    expect(hasCircularDependency(a)).toBe(true);

    const list = [{ id: 1 }];
    list[0].self = list[0];
    expect(hasCircularDependency(list)).toBe(true);
  });

  test('a subtree shared by several parents is not a cycle', () => {
    const shared = { x: 1 };
    expect(hasCircularDependency({ a: shared, b: shared, c: [shared, shared] })).toBe(false);
  });

  test('plain data and primitives have none', () => {
    expect(hasCircularDependency(Array.from({ length: 1000 }, (_, i) => ({ id: i, tags: ['a'] })))).toBe(false);
    expect(hasCircularDependency('text')).toBe(false);
    expect(hasCircularDependency(null)).toBe(false);
  });

  test('is linear: 100k rows are checked quickly', () => {
    const rows = Array.from({ length: 100000 }, (_, i) => ({ id: i, name: `n${i}`, meta: { a: 1, b: [1, 2] } }));
    const started = Date.now();
    expect(hasCircularDependency(rows)).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  test('with a budget, looks at that many objects only', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    rows[0].self = rows;
    expect(hasCircularDependency(rows, 10)).toBe(true);
    const late = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    late[99].self = late[99];
    expect(hasCircularDependency(late, 10)).toBe(false);
    expect(hasCircularDependency(late)).toBe(true);
  });
});
