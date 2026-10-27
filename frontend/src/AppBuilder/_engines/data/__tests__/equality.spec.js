import { isEqual } from 'lodash';
import { sameValue, sameExposedValue } from '../equality';
import { deepFreeze } from '../freeze';

describe('sameValue', () => {
  const pairs = [
    [1, 1],
    [NaN, NaN],
    [0, -0],
    ['a', 'a'],
    [null, undefined],
    [{ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }],
    [{ a: 1 }, { a: 1, b: undefined }],
    [
      [1, 2],
      [2, 1],
    ],
    [new Date(0), new Date(0)],
    [{ d: new Date(0) }, { d: new Date(1) }],
    [[], {}],
  ];

  test.each(pairs.map((pair, i) => [i, ...pair]))("answers as lodash's isEqual (%i)", (_, a, b) => {
    expect(sameValue(a, b)).toBe(isEqual(a, b));
  });

  test('remembers frozen pairs found equal, without walking them again', () => {
    let reads = 0;
    const row = (id) => ({
      get id() {
        reads += 1;
        return id;
      },
    });
    const a = Object.freeze(Array.from({ length: 50 }, (_, i) => Object.freeze(row(i))));
    const b = Object.freeze(Array.from({ length: 50 }, (_, i) => Object.freeze(row(i))));
    expect(sameValue(a, b)).toBe(true);
    const walked = reads;
    expect(sameValue(a, b)).toBe(true);
    expect(reads).toBe(walked);
  });

  test('unfrozen values are compared afresh every time', () => {
    const a = { x: 1 };
    const b = { x: 1 };
    expect(sameValue(a, b)).toBe(true);
    b.x = 2;
    expect(sameValue(a, b)).toBe(false);
    expect(sameValue(deepFreeze({ x: 1 }), deepFreeze({ x: 2 }))).toBe(false);
  });
});

describe('sameExposedValue', () => {
  test('small values compare by content, as before', () => {
    expect(sameExposedValue({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(sameExposedValue([{ id: 1 }], [{ id: 1 }])).toBe(true);
    expect(sameExposedValue([{ id: 1 }], [{ id: 2 }])).toBe(false);
    expect(sameExposedValue(NaN, NaN)).toBe(true);
  });

  test('a large array is unchanged when it holds the same rows, without reading their content', () => {
    let reads = 0;
    const rows = Array.from({ length: 5000 }, (_, id) => ({
      get id() {
        reads += 1;
        return id;
      },
    }));
    expect(sameExposedValue(rows.slice(), rows)).toBe(true);
    expect(reads).toBe(0);
  });

  test('a large array with any other row, or another length, is changed', () => {
    const rows = Array.from({ length: 2000 }, (_, id) => ({ id }));
    const copy = rows.slice();
    copy[1500] = { id: 1501 };
    expect(sameExposedValue(copy, rows)).toBe(false);
    expect(sameExposedValue(rows.slice(1), rows)).toBe(false);
  });

  test("answers as lodash's isEqual: new rows with the same content are unchanged", () => {
    const rows = Array.from({ length: 2000 }, (_, id) => ({ id, tags: [id] }));
    const rebuilt = rows.map((row) => ({ ...row, tags: [...row.tags] }));
    expect(sameExposedValue(rebuilt, rows)).toBe(isEqual(rebuilt, rows));
    expect(sameExposedValue([0], [-0])).toBe(isEqual([0], [-0]));
    expect(sameExposedValue([NaN], [NaN])).toBe(isEqual([NaN], [NaN]));
  });
});
