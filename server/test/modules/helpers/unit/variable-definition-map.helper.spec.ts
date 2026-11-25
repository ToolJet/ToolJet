/**
 * @group platform
 *
 * assertVariableDefinitionMap (src/helpers/variable-definition-map.helper.ts): the page update and
 * global settings routes save a declared-variables map as sent, and the editor cannot load one with
 * a malformed entry, so a malformed map is rejected with a 400 before it is saved.
 */
import { BadRequestException } from '@nestjs/common';
import { assertVariableDefinitionMap } from 'src/helpers/variable-definition-map.helper';

const valid = { id: 'v1', name: 'threshold', value: '5', fxActive: false };

describe('assertVariableDefinitionMap', () => {
  it('accepts a map of well-formed definitions, an empty map, and null or undefined', () => {
    expect(() => assertVariableDefinitionMap({ v1: valid }, 'variables')).not.toThrow();
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
    ['missing its id', { ...valid, id: undefined }],
    ['an empty id', { ...valid, id: '' }],
    ['a non-string name', { ...valid, name: 5 }],
    ['a non-string value', { ...valid, value: 5 }],
    ['a non-boolean fxActive', { ...valid, fxActive: 'yes' }],
  ])('rejects an entry that is %s and names the entry', (_label, entry) => {
    expect(() => assertVariableDefinitionMap({ v1: valid, bad: entry }, 'globalSettings.variables')).toThrow(
      'globalSettings.variables.bad'
    );
  });
});
