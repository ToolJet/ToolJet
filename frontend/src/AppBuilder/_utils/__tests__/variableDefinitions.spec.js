import {
  validateVariableName,
  parseStaticValue,
  isExpressionValue,
  getVariableRefs,
  findVariableCycle,
  orderVariableDefinitions,
  normalizeVariableDefinition,
} from '../variableDefinitions';

const appVar = (name, value = '', fxActive = false) => ({ id: `app-${name}`, scope: 'app', name, value, fxActive });
const pageVar = (name, value = '', fxActive = false) => ({ id: `page-${name}`, scope: 'page', name, value, fxActive });

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

  test('rejects a duplicate within the same scope only', () => {
    expect(validateVariableName('lowStockThreshold', 'app', existing)).toMatch(
      /^An app variable named “lowStockThreshold” already exists/
    );
    expect(validateVariableName('lowStockThreshold', 'page', existing)).toBeNull();
  });

  test('ignores the variable being renamed when checking duplicates', () => {
    expect(validateVariableName('lowStockThreshold', 'app', existing, 'app-lowStockThreshold')).toBeNull();
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

describe('normalizeVariableDefinition', () => {
  test('reads the snake_cased fx flag the app payload returns for app variables', () => {
    expect(normalizeVariableDefinition({ id: 'v1', name: 'a', value: '{{1}}', fx_active: true })).toEqual({
      id: 'v1',
      name: 'a',
      value: '{{1}}',
      fxActive: true,
    });
  });

  test('keeps the camelCase shape and fills missing fields', () => {
    expect(normalizeVariableDefinition({ id: 'v2', name: 'b', fxActive: false })).toEqual({
      id: 'v2',
      name: 'b',
      value: '',
      fxActive: false,
    });
  });
});
