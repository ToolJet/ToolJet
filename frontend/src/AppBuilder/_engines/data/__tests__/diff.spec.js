import { diff } from '../diff';

// Plain objects to compare results with toEqual (diff's own results have no prototype).
const plain = (value) => JSON.parse(JSON.stringify(value === undefined ? null : value, (_, v) => v ?? null));

const cases = [
  [{ a: 1 }, { a: 1 }],
  [{ a: 1 }, { a: 2 }],
  [{ a: 1, b: 2 }, { a: 1 }],
  [{ a: 1 }, { a: 1, b: { c: 3 } }],
  [{ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }],
  [{ a: [1, 2, 3] }, { a: [1, 5] }],
  [{ a: {} }, { a: {} }],
  [{ a: { x: 1 } }, { a: {} }],
  [{ a: {} }, { a: { x: 1 } }],
  [{ d: new Date(0) }, { d: new Date(0) }],
  [{ d: new Date(0) }, { d: new Date(5) }],
  [1, 2],
  ['a', 'a'],
  [null, { a: 1 }],
  [{ a: null }, { a: undefined }],
  [
    [1, 2],
    [1, 2, 3],
  ],
];

describe('diff', () => {
  test('results as documented', () => {
    expect(plain(diff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 }))).toEqual({ b: 3, c: 4 });
    expect('b' in diff({ a: 1, b: 2 }, { a: 1 })).toBe(true);
    expect(diff({ a: 1, b: 2 }, { a: 1 }).b).toBeUndefined();
    expect(Object.getPrototypeOf(diff({ a: 1 }, { a: 2 }))).toBeNull();
    expect(diff({ a: 1 }, { a: 1 })).toEqual({});
    expect(diff(1, 2)).toBe(2);
    const later = new Date(5);
    expect(diff(new Date(0), later)).toBe(later);
  });

  let reference = null;
  try {
    reference = require('deep-object-diff').diff;
  } catch {
    // The package has been removed: the documented results above still hold.
  }

  (reference ? test.each : test.skip.each)(cases.map((pair, i) => [i, ...pair]))(
    'gives deep-object-diff’s result (%i)',
    (_, lhs, rhs) => {
      const ours = diff(lhs, rhs);
      const theirs = reference(lhs, rhs);
      expect(Object.getPrototypeOf(ours)).toBe(Object.getPrototypeOf(theirs));
      expect(ours).toEqual(theirs);
      if (ours && typeof ours === 'object') expect(Object.keys(ours)).toEqual(Object.keys(theirs));
    }
  );
});
