import { orderByDependencies } from '@modules/tooljet-db/services/tooljet-db-promote.service';

describe('orderByDependencies', () => {
  const deps = (entries: Record<string, string[]>) => new Map(Object.entries(entries));

  it('puts a table after the table it references, whatever order it arrives in', () => {
    expect(orderByDependencies(['actions', 'observations'], deps({ actions: ['observations'] }))).toEqual([
      'observations',
      'actions',
    ]);
  });

  it('orders a chain parents first', () => {
    expect(orderByDependencies(['a', 'b', 'c'], deps({ a: ['b'], b: ['c'] }))).toEqual(['c', 'b', 'a']);
  });

  it('keeps the incoming order for tables that do not depend on each other', () => {
    expect(orderByDependencies(['sites', 'marks', 'actions'], deps({}))).toEqual(['sites', 'marks', 'actions']);
  });

  it('returns every table once when two tables reference each other, leaving the server gate to reject them', () => {
    const ordered = orderByDependencies(['x', 'y', 'z'], deps({ x: ['y'], y: ['x'] }));
    expect(ordered).toHaveLength(3);
    expect([...ordered].sort()).toEqual(['x', 'y', 'z']);
    expect(ordered[0]).toBe('z');
  });

  it('ignores a dependency that is not in the list', () => {
    expect(orderByDependencies(['a'], deps({ a: ['elsewhere'] }))).toEqual(['a']);
  });
});
