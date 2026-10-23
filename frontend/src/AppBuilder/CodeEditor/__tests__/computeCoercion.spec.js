import { computeCoercion, COERCION_PREVIEW_LIMIT, validateComponentProperty } from '../utils';

// The code editor's preview under a property shows whether validation changed the resolved value. It compared the two
// values' JSON: four full serializations of a dataset per edit, and past ~500 MB of JSON a RangeError that crashed the
// Inspector's Properties tab (binding a Table's data to a multi-million-row query).
describe('computeCoercion', () => {
  test('a value kept as is is unchanged, however large', () => {
    const rows = new Array(5000000).fill({ id: 1, title: 'x'.repeat(100), url: 'https://example.com/'.repeat(3) });
    const start = performance.now();
    expect(computeCoercion(rows, rows)).toEqual(['', 'array', 'array']);
    expect(computeCoercion(rows, rows.slice())).toEqual(['', 'array', 'array']);
    expect(performance.now() - start).toBeLessThan(2000);
  });

  test('a changed value is previewed, cut short when large', () => {
    expect(computeCoercion('5', 5)).toEqual([' → 5', 'number', 'string']);
    expect(computeCoercion(['a'], ['b'])).toEqual([' → ["b"]', 'array', 'array']);
    expect(computeCoercion({ a: 1 }, undefined)).toEqual([' → undefined', 'undefined', 'object']);
    const [preview] = computeCoercion(
      'many',
      Array.from({ length: 100000 }, (_, i) => i)
    );
    expect(preview.length).toBeLessThanOrEqual(COERCION_PREVIEW_LIMIT + 4);
    expect(preview.startsWith(' → [0,1,2')).toBe(true);
    expect(preview.endsWith('…')).toBe(true);
  });

  test('values equal as JSON are unchanged', () => {
    expect(computeCoercion(NaN, null)[0]).toBe(' → null');
    expect(computeCoercion([1, { a: 'x' }], [1, { a: 'x' }])[0]).toBe('');
    expect(computeCoercion([NaN], [null])[0]).toBe('');
    expect(computeCoercion({ a: undefined, b: 1 }, { b: 1 })[0]).toBe('');
  });
});

describe('validateComponentProperty', () => {
  test('keeps a dataset that fits as the same array', () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const [valid, errors, value] = validateComponentProperty(rows, {
      schema: { type: 'array', element: { type: 'object' } },
    });
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
    expect(value).toBe(rows);
  });

  test('still validates values that do not fit', () => {
    const [valid] = validateComponentProperty('text', { schema: { type: 'array', element: { type: 'object' } } });
    expect(valid).toBe(false);
  });
});
