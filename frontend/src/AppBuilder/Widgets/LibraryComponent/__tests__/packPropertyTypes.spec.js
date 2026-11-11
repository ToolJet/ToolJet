import fs from 'fs';
import path from 'path';
import { acceptedTypes, toPropertyType, typedPackProps } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';

// A built-in pack property gets a value of the type its manifest declares, converted as a native widget's property
// is, or the type's empty value with an error when it has no such reading (QA items 14-17).

const as = (value, ...types) => toPropertyType(value, types);

describe('a bound value as its property type', () => {
  it.each([
    ['text', 'string', 'Ada', 'Ada'],
    ['a number for text', 'string', 42, '42'],
    ['a boolean for text', 'string', true, 'true'],
    ['a number', 'number', 7, 7],
    ['numeric text for a number', 'number', ' 1,200.5 ', 1200.5],
    ['a percentage for a number', 'number', '45%', 45],
    ['a boolean', 'boolean', false, false],
    ["'false' for a boolean", 'boolean', 'false', false],
    ["'TRUE' for a boolean", 'boolean', 'TRUE', true],
    ['0 for a boolean', 'boolean', 0, false],
    ['an array', 'array', [1, 2], [1, 2]],
    ['JSON text for an array', 'array', '["a","b"]', ['a', 'b']],
    ['an object', 'object', { a: 1 }, { a: 1 }],
    ['rows for an object (a Key-Value data)', 'object', [{ label: 'a' }], [{ label: 'a' }]],
    ['JSON text for an object', 'object', '{"a":1}', { a: 1 }],
    ['an option for an enumeration', 'enumeration', 'outlined', 'outlined'],
    ['a role look for an enumeration', 'enumeration', { variant: 'outlined' }, { variant: 'outlined' }],
    ['a number for an enumeration', 'enumeration', 2, '2'],
  ])('takes %s', (_, type, value, expected) => {
    expect(as(value, type)).toEqual({ value: expected });
  });

  it.each([
    ['a query row for text', 'string', { id: 1 }, ''],
    ["a query's rows for text", 'string', [{ id: 1 }], ''],
    ['a list for text', 'string', ['a', 'b'], ''],
    ['words for a number', 'number', 'abc', null],
    ['a boolean for a number', 'number', true, null],
    ['an object for a number', 'number', { n: 1 }, null],
    ['words for a boolean', 'boolean', 'yes', false],
    ['text for an array', 'array', 'a, b', []],
    ['an object for an array', 'array', { a: 1 }, []],
    ['text for an object', 'object', 'abc', {}],
    ['a list for an enumeration', 'enumeration', ['a'], ''],
  ])('empties %s, and says why', (_, type, value, expected) => {
    const result = as(value, type);
    expect(result.value).toEqual(expected);
    expect(result.error).toMatch(new RegExp(`^Expected a value of type ${type}, but received`));
  });

  it.each([
    ['null', 'number', null, null],
    ['null', 'string', null, ''],
    ['null', 'array', null, []],
    ['blank text', 'number', '  ', null],
    ['NaN (a query not loaded yet)', 'number', NaN, null],
  ])('empties %s for a %s without an error, as an empty binding', (_, type, value, expected) => {
    expect(as(value, type)).toEqual({ value: expected });
  });

  it("shows only the start of a query's rows in the error, not every row", () => {
    const rows = Array.from({ length: 10000 }, (_, id) => ({ id }));
    expect(as(rows, 'string').error).toBe(
      'Expected a value of type string, but received [{"id":0},{"id":1},{"id":2}] … (10000 items)'
    );
    expect(as('x'.repeat(500), 'number').error.length).toBeLessThan(260);
  });

  it('keeps blank text for text', () => {
    expect(as('', 'string')).toEqual({ value: '' });
  });

  it('leaves an unset value to the component', () => {
    expect(as(undefined, 'number')).toEqual({ value: undefined });
  });

  describe('a property that takes more than one type', () => {
    it('keeps a value of any of them as it is', () => {
      expect(as([20, 80], 'number', 'array')).toEqual({ value: [20, 80] });
      expect(as(5, 'number', 'array')).toEqual({ value: 5 });
      expect(as(1234, 'string', 'number')).toEqual({ value: 1234 });
      expect(as('a, b', 'array', 'string')).toEqual({ value: 'a, b' });
    });

    it('converts another to the first that takes it', () => {
      expect(as('5', 'number', 'array')).toEqual({ value: 5 });
      expect(as('[20,80]', 'number', 'array')).toEqual({ value: [20, 80] });
    });

    it('empties a value none of them takes, as the declared type', () => {
      const result = as({ a: 1 }, 'number', 'array');
      expect(result.value).toBeNull();
      expect(result.error).toMatch(/^Expected a value of type one of number, array, but received/);
    });
  });
});

describe('the types a pack property takes', () => {
  it('is its declared type, or what the pack lists for it', () => {
    expect(acceptedTypes('shadcn', 'Input', { name: 'label', type: 'string' })).toEqual(['string']);
    expect(acceptedTypes('shadcn', 'Slider', { name: 'value', type: 'number' })).toEqual(['number', 'array']);
    expect(acceptedTypes('antd', 'Column', { name: 'yField', type: 'array' })).toEqual(['array', 'string']);
  });

  it('is none for a type it does not know, which reaches the component as bound', () => {
    expect(acceptedTypes('shadcn', 'X', { name: 'icon', type: 'icon' })).toBeNull();
  });
});

describe("a pack component's props", () => {
  const manifestProps = [
    { name: 'label', type: 'string' },
    { name: 'count', type: 'number' },
  ];

  it('are each converted, with an error per value that has no reading', () => {
    const { props, errors } = typedPackProps('shadcn', 'Input', manifestProps, {
      label: { a: 1 },
      count: '3',
      extra: { kept: true },
    });
    expect(props).toEqual({ label: '', count: 3, extra: { kept: true } });
    expect(errors).toEqual([expect.objectContaining({ property: 'label', value: { a: 1 }, effective: '' })]);
  });

  it('leave a row template as it is', () => {
    const { props } = typedPackProps('shadcn', 'Input', manifestProps, { count: '{{rowData.n}}' }, new Set(['count']));
    expect(props.count).toBe('{{rowData.n}}');
  });
});

// Every built pack's own defaults are values of the types it takes: a property whose sample is another type than its
// hook's (a range's [20, 80] on a number) is one the pack takes more than one type for, and must be listed. Runs on the
// packs built here (dist/manifest.json), as the pack fuzz does.
const PACKS_DIR = path.resolve(__dirname, '../../../../../../packs');
const built = ['shadcn', 'antd', 'mui'].filter((pack) =>
  fs.existsSync(path.join(PACKS_DIR, pack, 'dist/manifest.json'))
);

(built.length ? describe : describe.skip)('the built packs', () => {
  it.each(built)("%s: every property's own default is taken as it is", (pack) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, pack, 'dist/manifest.json'), 'utf8'));
    const changed = [];
    Object.entries(manifest.components).forEach(([component, entry]) => {
      (entry.props ?? []).forEach((prop) => {
        if (prop.default === undefined || prop.default === null) return;
        const types = acceptedTypes(pack, component, prop);
        if (!types) return;
        const result = toPropertyType(prop.default, types);
        if (result.error || JSON.stringify(result.value) !== JSON.stringify(prop.default))
          changed.push(`${component}.${prop.name}: ${JSON.stringify(prop.default)} -> ${JSON.stringify(result.value)}`);
      });
    });
    expect(changed).toEqual([]);
  });
});
