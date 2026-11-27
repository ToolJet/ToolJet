/**
 * @group platform
 *
 * Declared-variable maps (src/helpers/variable-definition-map.helper.ts) are keyed by variable name:
 * `{ [name]: { value, fxActive } }`. The page and global settings routes save a map as sent, and the
 * editor cannot load a malformed one, so `assertVariableDefinitionMap` rejects it with a 400.
 * Imports and Git pulls use the same name-keyed shape. ID-keyed development definitions never
 * shipped and are rejected rather than migrated.
 */
import { BadRequestException } from '@nestjs/common';
import { assertVariableDefinitionMap, readVariableDefinitionMap } from 'src/helpers/variable-definition-map.helper';

const valid = { value: '5', fxActive: false };

describe('assertVariableDefinitionMap', () => {
  it('accepts a name-keyed map, an empty map, and null or undefined', () => {
    expect(() =>
      assertVariableDefinitionMap(
        { threshold: valid, selectedOrderID: valid, user_name: valid, $total: valid, _x: valid },
        'variables'
      )
    ).not.toThrow();
    expect(() => assertVariableDefinitionMap({}, 'variables')).not.toThrow();
    expect(() => assertVariableDefinitionMap(null, 'variables')).not.toThrow();
    expect(() => assertVariableDefinitionMap(undefined, 'variables')).not.toThrow();
  });

  it.each([
    ['a string', 'x'],
    ['an array', [valid]],
    ['a number', 5],
  ])('rejects a map that is %s', (_label, map) => {
    expect(() => assertVariableDefinitionMap(map, 'variables')).toThrow(BadRequestException);
  });

  it.each([
    ['null', null],
    ['a string', 'x'],
    ['an array', []],
    ['a non-string value', { ...valid, value: 5 }],
    ['a non-boolean fxActive', { ...valid, fxActive: 'yes' }],
    ['an entry carrying an old definition id', { ...valid, id: 'v1' }],
    ['an entry carrying a name field', { ...valid, name: 'bad' }],
  ])('rejects an entry that is %s and names the entry', (_label, entry) => {
    expect(() => assertVariableDefinitionMap({ threshold: valid, bad: entry }, 'globalSettings.variables')).toThrow(
      'globalSettings.variables.bad'
    );
  });

  it.each([
    ['a key that is not an identifier', '05688c6c-efd3-4726-b6c5-bfde3a2f32c9'],
    ['a dotted key', 'a.b'],
    ['an object-prototype name', 'constructor'],
  ])('rejects %s', (_label, key) => {
    expect(() => assertVariableDefinitionMap({ [key]: valid }, 'variables')).toThrow(BadRequestException);
  });

  // `variables` is a plain object at runtime, so these names already resolve to inherited methods.
  it.each(Object.getOwnPropertyNames(Object.prototype))('rejects the inherited name %s', (key) => {
    expect(() => assertVariableDefinitionMap({ [key]: valid }, 'variables')).toThrow('is a reserved name');
  });

  it('accepts names that only start like an inherited one', () => {
    expect(() => assertVariableDefinitionMap({ toStringValue: valid, valueOfOrder: valid }, 'variables')).not.toThrow();
  });
});

describe('readVariableDefinitionMap', () => {
  it('passes a name-keyed map through unchanged', () => {
    const map = { selectedOrderID: valid, user_name: { value: '{{1}}', fxActive: true } };
    expect(readVariableDefinitionMap(map, 'variables')).toEqual(map);
  });

  it.each(['old-id', 'source'])('rejects ID-keyed definitions under %s with a clear format error', (key) => {
    expect(() => readVariableDefinitionMap({ [key]: { id: 'old-id', name: 'source', ...valid } }, 'variables')).toThrow(
      'ID-keyed variable definitions are not supported'
    );
  });

  it('keeps null and undefined as they are', () => {
    expect(readVariableDefinitionMap(null, 'variables')).toBeNull();
    expect(readVariableDefinitionMap(undefined, 'variables')).toBeUndefined();
  });

  it('rejects an imported variable named after an inherited method', () => {
    expect(() => readVariableDefinitionMap({ toString: valid }, 'variables')).toThrow(
      'variables.toString is a reserved name'
    );
  });

  it('rejects a malformed map instead of importing it', () => {
    expect(() => readVariableDefinitionMap({ bad: null }, 'variables')).toThrow('variables.bad');
  });
});
