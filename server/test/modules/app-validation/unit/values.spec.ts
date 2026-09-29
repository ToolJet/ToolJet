import {
  compiledCodeUnits,
  findBrokenBraces,
  getDynamicVariables,
  hasBraces,
  plainValueFit,
  removeNestedDoubleCurlyBraces,
} from '@modules/app-validation/values';

describe('app-validation values', () => {
  describe('ported resolver helpers (must match frontend/src/AppBuilder/_stores/utils.js)', () => {
    it('finds each {{ }} segment, across newlines', () => {
      expect(getDynamicVariables('Hello {{name}}, {{city}}')).toEqual(['{{name}}', '{{city}}']);
      expect(getDynamicVariables('{{\n  a + b\n}}')).toEqual(['{{\n  a + b\n}}']);
      expect(getDynamicVariables('plain')).toBeNull();
    });

    it('strips outer braces but keeps nested object braces', () => {
      expect(removeNestedDoubleCurlyBraces('{{ queries.q1.data }}')).toBe('queries.q1.data');
      expect(removeNestedDoubleCurlyBraces('{{ {a: 1} }}')).toBe('{a: 1}');
    });

    it('compiles each segment of a template string, or the whole value for JS code', () => {
      expect(compiledCodeUnits('Hi {{a}} and {{b}}')).toEqual(['a', 'b']);
      expect(compiledCodeUnits('{{a}}')).toEqual(['a']);
      expect(compiledCodeUnits('{{a ? 1 : 2}}')).toEqual(['a ? 1 : 2']);
    });
  });

  describe('hasBraces', () => {
    it.each([
      ['{{true}}', true],
      ['Hello {{name}}', true],
      ['primary', false],
      [42, false],
      [null, false],
    ])('%p -> %p', (value, expected) => expect(hasBraces(value)).toBe(expected));
  });

  describe('findBrokenBraces', () => {
    it.each([
      ['{{queries.q1.data}}'],
      ['Hello {{components.text1.value}}!'],
      ['{{ {a: 1, b: [1, 2]} }}'],
      ['{{`${a}-${b}`}}'],
      ['{{\n  (() => {\n    return 1;\n  })()\n}}'],
      ['{{a ?? b}}'],
      ['{{rowData?.status === "open"}}'],
      ['plain text'],
      [42],
    ])('accepts %p', (value) => expect(findBrokenBraces(value)).toBeUndefined());

    it('flags an unclosed {{', () => {
      expect(findBrokenBraces('{{queries.q1.data')).toEqual({ unclosed: true, syntaxError: undefined });
      expect(findBrokenBraces('{{a}} and {{b')).toMatchObject({ unclosed: true });
    });

    it('skips an oversized segment but still checks the rest of the value', () => {
      const huge = `{{${'a'.repeat(100_001)}}}`;
      expect(findBrokenBraces(huge)).toBeUndefined();
      expect(findBrokenBraces(`${huge} and {{b(}}`)?.syntaxError?.code).toBe('b(');
    });

    it('flags code that is not valid JavaScript', () => {
      const result = findBrokenBraces('{{queries.q1.data(}}');
      expect(result?.unclosed).toBe(false);
      expect(result?.syntaxError?.code).toBe('queries.q1.data(');
    });
  });

  describe('plainValueFit (loose: ToolJet itself stores numbers as text)', () => {
    it.each([
      [10, { type: 'number' }, 'ok'],
      ['10', { type: 'number' }, 'ok'],
      ['', { type: 'number' }, 'ok'],
      ['{{10}}', { type: 'number' }, 'ok'],
      ['ten', { type: 'number' }, 'scalar-mismatch'],
      [{ value: 10 }, { type: 'number' }, 'structure-mismatch'],
      ['false', { type: 'boolean' }, 'ok'],
      ['yes', { type: 'boolean' }, 'scalar-mismatch'],
      [['a'], { type: 'string' }, 'structure-mismatch'],
      [7, { type: 'string' }, 'ok'],
      [[1], { type: 'array' }, 'ok'],
      [{ a: 1 }, { type: 'array' }, 'structure-mismatch'],
      ['5', { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, 'ok'],
      [{ a: 1 }, { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, 'structure-mismatch'],
      ['anything', undefined, 'ok'],
    ])('%p against %p -> %s', (value, schema, expected) => expect(plainValueFit(value, schema)).toBe(expected));
  });
});
