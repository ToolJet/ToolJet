import _ from 'lodash';
import { create, is } from 'superstruct';
import { generateSchemaFromValidationDefinition } from '@/AppBuilder/_utils/component-properties-validation';
import { fitsDefinition } from '../shape';

// A value the quick check keeps must be what superstruct's `create` gives (only copied); one it rejects is invalid or
// would be converted by `create`.
const definitions = [
  { type: 'array', element: { type: 'object' } },
  { type: 'array', element: { type: 'object' }, optional: true },
  { type: 'array' },
  { type: 'object' },
  { type: 'array', element: { type: 'array', element: { type: 'object' } } },
  { type: 'array', element: { type: 'string' } },
  {
    type: 'union',
    schemas: [
      { type: 'array', element: { type: 'object' } },
      { type: 'array', element: { type: 'string' } },
    ],
  },
  {
    type: 'union',
    schemas: [
      { type: 'array', element: { type: 'object' } },
      { type: 'array', element: { type: 'array' } },
    ],
  },
  { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'object' }] },
];
const values = [
  [],
  [{ id: 1 }, { id: 2 }],
  [{ id: 1 }, null],
  [{ id: 1 }, 'text'],
  ['a', 'b'],
  [[1], { a: 1 }],
  [[1], [2]],
  [[{ a: 1 }], []],
  [new Date(), Object.create(null)],
  [Object.create(null)],
  {},
  { length: 1, 0: {} },
  new Date(),
  null,
  undefined,
  'text',
  42,
  NaN,
  true,
];

// Equal content and the same kind of object at every level (lodash's isEqual doesn't tell a null-prototype object
// from a plain one).
const same = (a, b) =>
  _.isEqualWith(a, b, (x, y) =>
    x && y && typeof x === 'object' && typeof y === 'object' && Object.getPrototypeOf(x) !== Object.getPrototypeOf(y)
      ? false
      : undefined
  );

const createOrError = (value, schema) => {
  try {
    return { value: create(value, schema) };
  } catch {
    return { error: true };
  }
};

// superstruct throws while describing some invalid values (a null-prototype object can't be printed).
const accepts = (value, schema) => {
  try {
    return is(value, schema);
  } catch {
    return false;
  }
};

describe('fitsDefinition', () => {
  test.each(definitions.map((d) => [JSON.stringify(d), d]))('agrees with superstruct for %s', (_name, definition) => {
    const schema = generateSchemaFromValidationDefinition(definition);
    for (const value of values) {
      const fits = fitsDefinition(definition, value);
      expect(fits).not.toBeNull();
      const created = createOrError(value, schema);
      if (fits === true) expect([value, same(created.value, value)]).toEqual([value, true]);
      else expect([value, !accepts(value, schema) || !same(created.value, value)]).toEqual([value, true]);
    }
  });

  test('keeps the rows of a dataset by reference', () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(fitsDefinition(definitions[6], rows)).toBe(true);
  });

  test('leaves other definitions to superstruct', () => {
    expect(fitsDefinition({ type: 'string' }, 'a')).toBeNull();
    expect(fitsDefinition({ type: 'object', object: { a: { type: 'string' } } }, {})).toBeNull();
    expect(fitsDefinition({ type: 'array', element: { type: 'object' }, size: { min: 1 } }, [])).toBeNull();
    expect(fitsDefinition({ type: 'array', element: { type: 'string', pattern: 'a' } }, ['a'])).toBeNull();
    expect(fitsDefinition({ type: 'union', schemas: [{ type: 'array' }, { type: 'undefined' }] }, [])).toBeNull();
    expect(fitsDefinition(undefined, [])).toBeNull();
  });
});

describe('fitsDefinition on frozen values', () => {
  test('answers once per value and definition, then from memory', () => {
    const definition = { type: 'array', element: { type: 'object' } };
    let reads = 0;
    const rows = Object.freeze(
      Array.from({ length: 10 }, () => {
        const row = {};
        Object.defineProperty(row, 'id', { enumerable: true, get: () => (reads += 1) });
        return Object.freeze(row);
      })
    );
    const proto = Object.getPrototypeOf;
    let protoCalls = 0;
    Object.getPrototypeOf = (value) => {
      protoCalls += 1;
      return proto(value);
    };
    try {
      expect(fitsDefinition(definition, rows)).toBe(true);
      const first = protoCalls;
      expect(fitsDefinition(definition, rows)).toBe(true);
      expect(protoCalls).toBe(first);
    } finally {
      Object.getPrototypeOf = proto;
    }
    expect(reads).toBe(0);
  });
});
