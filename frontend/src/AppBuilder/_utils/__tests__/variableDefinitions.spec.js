import {
  validateVariableName,
  parseStaticValue,
  isExpressionValue,
  getVariableRefs,
  findVariableCycle,
  orderVariableDefinitions,
  normalizeVariableDefinition,
  normalizeVariableDefinitionMap,
  readVariableDefinitionMap,
  definitionsOf,
  variableKey,
} from '../variableDefinitions';

const appVar = (name, value = '', fxActive = false) => ({ scope: 'app', name, value, fxActive });
const pageVar = (name, value = '', fxActive = false) => ({ scope: 'page', name, value, fxActive });

describe('validateVariableName', () => {
  const existing = [appVar('lowStockThreshold'), pageVar('selectedCategory')];

  test('accepts a valid identifier', () => {
    expect(validateVariableName('selectedOrderId', 'app', existing)).toBeNull();
  });

  test('accepts namespace words and JS keywords, because variables are always read through a namespace', () => {
    ['variables', 'page', 'queries', 'class', 'delete', 'return'].forEach((name) => {
      expect(validateVariableName(name, 'app', existing)).toBeNull();
    });
  });

  test('rejects an empty name', () => {
    expect(validateVariableName('  ', 'app', existing)).toBe('Enter a name.');
  });

  test('rejects a leading digit with a suggestion', () => {
    expect(validateVariableName('1st', 'app', existing)).toMatch(/can’t start with a number/);
  });

  test('rejects dots, spaces and dashes', () => {
    ['a.b', 'my var', 'my-var'].forEach((name) => {
      expect(validateVariableName(name, 'app', existing)).toMatch(/letters, numbers, _ or \$/);
    });
  });

  test('rejects object-prototype names', () => {
    ['__proto__', 'constructor', 'prototype'].forEach((name) => {
      expect(validateVariableName(name, 'app', existing)).toMatch(/can’t be used as a variable name/);
    });
  });

  // `variables` is a plain object, so these names already resolve to inherited functions such as
  // Object.prototype.toString; a variable with one of them reads as a function until it is set.
  test.each(Object.getOwnPropertyNames(Object.prototype))('rejects the inherited name %s', (name) => {
    expect(validateVariableName(name, 'app', existing)).toMatch(/can’t be used as a variable name/);
    expect(validateVariableName(name, 'page', existing)).toMatch(/can’t be used as a variable name/);
  });

  test('still accepts names that only start like an inherited one', () => {
    ['toStringValue', 'valueOfOrder', 'hasOwnPropertyFlag'].forEach((name) => {
      expect(validateVariableName(name, 'app', existing)).toBeNull();
    });
  });

  test('rejects a duplicate within the same scope only', () => {
    expect(validateVariableName('lowStockThreshold', 'app', existing)).toMatch(
      /^An app variable named “lowStockThreshold” already exists/
    );
    expect(validateVariableName('lowStockThreshold', 'page', existing)).toBeNull();
  });

  test('ignores the variable being renamed when checking duplicates', () => {
    expect(validateVariableName('lowStockThreshold', 'app', existing, 'lowStockThreshold')).toBeNull();
  });

  test('a rename still clashes with another variable of the same scope', () => {
    const both = [...existing, appVar('minStock')];
    expect(validateVariableName('minStock', 'app', both, 'lowStockThreshold')).toMatch(/already exists/);
  });
});

describe('parseStaticValue', () => {
  test.each([
    ['', ''],
    ['5', 5],
    ['-2.5', -2.5],
    ['true', true],
    ['false', false],
    ['null', null],
    ['[1,2]', [1, 2]],
    ['{"a":1}', { a: 1 }],
    ['open', 'open'],
    ['  padded  ', '  padded  '],
    ['0', 0],
    ['0.5', 0.5],
    ['02134', '02134'],
    ['007', '007'],
    ['"true"', 'true'],
    ['"5"', '5'],
    ['"a \\"quoted\\" word"', 'a "quoted" word'],
  ])('%j parses to %j', (input, expected) => {
    expect(parseStaticValue(input)).toEqual({ ok: true, value: expected });
  });

  test('reports an unterminated quoted string as invalid JSON', () => {
    expect(parseStaticValue('"open" extra"')).toEqual({
      ok: false,
      error: 'Not valid JSON. Use double quotes around keys and strings.',
    });
  });

  test('reports invalid JSON', () => {
    expect(parseStaticValue('{a:1}')).toEqual({
      ok: false,
      error: 'Not valid JSON. Use double quotes around keys and strings.',
    });
  });
});

describe('isExpressionValue', () => {
  test('fx flag or a {{ }} value is an expression', () => {
    expect(isExpressionValue({ value: '5', fxActive: true })).toBe(true);
    expect(isExpressionValue({ value: '{{1 + 1}}', fxActive: false })).toBe(true);
    expect(isExpressionValue({ value: '5', fxActive: false })).toBe(false);
  });
});

describe('getVariableRefs', () => {
  test('finds app and page variable refs, deduplicated', () => {
    expect(getVariableRefs('{{variables.a + variables.a + page.variables.b + queries.q.data.length}}')).toEqual([
      { scope: 'app', name: 'a' },
      { scope: 'page', name: 'b' },
    ]);
  });

  test('finds bracket-literal and optional-chaining refs', () => {
    expect(getVariableRefs('{{variables["a"] ?? variables?.b}}')).toEqual([
      { scope: 'app', name: 'a' },
      { scope: 'app', name: 'b' },
    ]);
  });

  test('returns nothing for a static value', () => {
    expect(getVariableRefs('variables.a')).toEqual([]);
  });
});

describe('findVariableCycle', () => {
  test('no cycle', () => {
    expect(findVariableCycle([appVar('a', '{{variables.b}}'), appVar('b', '5')])).toBeNull();
  });

  test('self reference is a cycle', () => {
    expect(findVariableCycle([appVar('a', '{{variables.a + 1}}')])).toEqual(['a', 'a']);
  });

  test('two-variable cycle names the full path', () => {
    expect(findVariableCycle([appVar('a', '{{variables.b}}'), appVar('b', '{{variables.a}}')])).toEqual([
      'a',
      'b',
      'a',
    ]);
  });

  test('mixed-scope cycle uses page. prefix for page variables', () => {
    expect(findVariableCycle([appVar('a', '{{page.variables.p}}'), pageVar('p', '{{variables.a}}')])).toEqual([
      'a',
      'page.p',
      'a',
    ]);
  });

  test('refs to undeclared variables are not edges', () => {
    expect(findVariableCycle([appVar('a', '{{variables.runtimeOnly}}')])).toBeNull();
  });
});

describe('orderVariableDefinitions', () => {
  test('dependencies come before dependents', () => {
    const { ordered, cyclic } = orderVariableDefinitions([
      appVar('c', '{{variables.b * 2}}'),
      appVar('b', '{{variables.a + 1}}'),
      appVar('a', '1'),
    ]);
    expect(ordered.map((d) => d.name)).toEqual(['a', 'b', 'c']);
    expect(cyclic).toEqual([]);
  });

  test('cyclic variables are excluded and reported; others still ordered', () => {
    const { ordered, cyclic } = orderVariableDefinitions([
      appVar('x', '{{variables.y}}'),
      appVar('y', '{{variables.x}}'),
      appVar('ok', '3'),
      appVar('dependsOnCycle', '{{variables.x}}'),
    ]);
    expect(ordered.map((d) => d.name)).toEqual(['ok']);
    expect(cyclic.map((d) => d.name).sort()).toEqual(['dependsOnCycle', 'x', 'y']);
  });
});

// Saved maps are keyed by variable name; a definition stores only its value and the legacy fx flag.
describe('normalizeVariableDefinition', () => {
  test('reads the snake_cased fx flag and keeps only the stored fields', () => {
    expect(normalizeVariableDefinition({ value: '{{1}}', fx_active: true })).toEqual({
      value: '{{1}}',
      fxActive: true,
    });
  });

  test('fills missing fields and drops any old id or name field', () => {
    expect(normalizeVariableDefinition({ id: 'v2', name: 'b', fxActive: false })).toEqual({
      value: '',
      fxActive: false,
    });
  });

  test.each([
    ['zero', '0'],
    ['false', 'false'],
    ['null', 'null'],
    ['a blank string', ''],
    ['JSON', '{"a":[1]}'],
    ['an identifier string', 'selectedOrderID'],
  ])('keeps a %s value as typed', (_label, value) => {
    expect(normalizeVariableDefinition({ value }).value).toBe(value);
  });
});

describe('normalizeVariableDefinitionMap', () => {
  const stored = (value) => ({ value, fxActive: false });

  test('keeps name keys exactly, including uppercase, _ and $', () => {
    const map = { selectedOrderID: stored('1'), user_name: stored('a'), $total: stored('2'), _x: stored('') };
    expect(normalizeVariableDefinitionMap(map)).toEqual(map);
  });

  test('re-keys a development map saved under definition ids by name', () => {
    const legacy = {
      '05688c6c-efd3-4726-b6c5-bfde3a2f32c9': {
        id: '05688c6c-efd3-4726-b6c5-bfde3a2f32c9',
        name: 'selectedOrderID',
        value: '42',
        fxActive: false,
      },
      '05688c6cEfd34726B6c5Bfde3a2f32c9': { id: 'e7', name: 'total', value: '{{1}}', fx_active: true },
    };
    expect(normalizeVariableDefinitionMap(legacy)).toEqual({
      selectedOrderID: { value: '42', fxActive: false },
      total: { value: '{{1}}', fxActive: true },
    });
  });

  test.each([
    ['null', null],
    ['a string', 'x'],
    ['a number', 5],
    ['an array', []],
  ])('skips an entry that is %s and keeps the valid ones', (_label, bad) => {
    expect(normalizeVariableDefinitionMap({ bad, threshold: stored('5') })).toEqual({ threshold: stored('5') });
  });

  test.each([
    ['a key that is not an identifier', '1st'],
    ['a dotted key', 'a.b'],
    ['an object-prototype name', 'constructor'],
    ['an inherited method name', 'toString'],
    ['another inherited method name', 'hasOwnProperty'],
  ])('skips %s', (_label, key) => {
    expect(normalizeVariableDefinitionMap({ [key]: stored('1'), threshold: stored('5') })).toEqual({
      threshold: stored('5'),
    });
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'str'],
    ['an array of nulls', [null]],
  ])('reads a map that is %s as empty', (_label, map) => {
    expect(normalizeVariableDefinitionMap(map)).toEqual({});
  });
});

describe('readVariableDefinitionMap', () => {
  test('reports development entries that share a name instead of dropping one silently', () => {
    const { definitions, duplicates } = readVariableDefinitionMap({
      a1: { id: 'a1', name: 'count', value: '1', fxActive: false },
      a2: { id: 'a2', name: 'count', value: '2', fxActive: false },
      b1: { id: 'b1', name: 'other', value: '3', fxActive: false },
    });
    expect(definitions).toEqual({
      count: { value: '1', fxActive: false },
      other: { value: '3', fxActive: false },
    });
    expect(duplicates).toEqual(['count']);
  });

  test('a name-keyed map has no duplicates', () => {
    expect(readVariableDefinitionMap({ count: { value: '1', fxActive: false } }).duplicates).toEqual([]);
  });
});

describe('definitionsOf and variableKey', () => {
  test('lists a map as scoped definitions carrying their names', () => {
    expect(definitionsOf({ count: { value: '1', fxActive: false } }, 'page')).toEqual([
      { scope: 'page', name: 'count', value: '1', fxActive: false },
    ]);
  });

  test('app and page variables with the same name have different keys', () => {
    expect(variableKey('app', 'count')).not.toBe(variableKey('page', 'count'));
  });
});
