// frontend/src/AppBuilder/_utils/__tests__/libraryQuery.spec.js
import { libraryTemplateState, mergeLibraryInputs, runArgNames } from '../libraryQuery';

describe('libraryTemplateState', () => {
  it('exposes input, constants and globals.currentUser only', () => {
    expect(
      libraryTemplateState(
        { constants: { c: 1 }, globals: { currentUser: { email: 'a@b.c' }, theme: 'x' }, parameters: { p: 2 } },
        { region: 'eu' }
      )
    ).toEqual({
      input: { region: 'eu' },
      constants: { c: 1 },
      globals: { currentUser: { email: 'a@b.c' } },
    });
  });

  it('defaults input to an empty object', () => {
    expect(libraryTemplateState({}).input).toEqual({});
  });
});

describe('mergeLibraryInputs', () => {
  it('uses inputs, falls back to defaults, drops undeclared keys', () => {
    expect(
      mergeLibraryInputs(
        [
          { name: 'id', defaultValue: '1' },
          { name: 'limit', defaultValue: '10' },
        ],
        { id: 5, x: 1 }
      )
    ).toEqual({ id: 5, limit: '10' });
  });

  it('passes defaults through resolveDefault', () => {
    expect(mergeLibraryInputs([{ name: 'n', defaultValue: '{{5}}' }], {}, () => 5)).toEqual({ n: 5 });
  });

  // Stands in for the store's resolver: one template in, its value out.
  const evaluate = (template) => Function(`return (${template.slice(2, -2)})`)();

  it('should resolve a mixed-text default', () => {
    expect(
      mergeLibraryInputs(
        [
          { name: 'a', defaultValue: '{{1}}-{{2}}' },
          { name: 'b', defaultValue: 'id-{{1+1}}' },
          { name: 'c', defaultValue: 'row {{({ k: 1 })}}' },
          { name: 'd', defaultValue: '{{3}}' },
        ],
        {},
        evaluate
      )
    ).toEqual({ a: '1-2', b: 'id-2', c: 'row {"k":1}', d: 3 });
  });

  it('should keep a constants default as text', () => {
    const resolveDefault = jest.fn(evaluate);
    expect(
      mergeLibraryInputs(
        [
          { name: 'a', defaultValue: '{{constants.region}}' },
          { name: 'b', defaultValue: 'eu-{{secrets.k}}-{{1+1}}' },
        ],
        {},
        resolveDefault
      )
    ).toEqual({ a: '{{constants.region}}', b: 'eu-{{secrets.k}}-2' });
  });

  it('should ignore inherited property names', () => {
    expect(mergeLibraryInputs([{ name: 'constructor', defaultValue: 'x' }], {})).toEqual({ constructor: 'x' });
    expect(mergeLibraryInputs([{ name: 'toString', defaultValue: 'y' }], undefined)).toEqual({ toString: 'y' });
  });
});

describe('runArgNames', () => {
  it('passes a library query its inputs and any other query its parameters', () => {
    expect(runArgNames({ kind: 'library', options: { inputs: { region: '', id: '1' } } })).toEqual(['region', 'id']);
    expect(runArgNames({ kind: 'runjs', options: { parameters: [{ name: 'limit' }] } })).toEqual(['limit']);
    expect(runArgNames({ kind: 'runjs', options: {} })).toEqual([]);
  });
});
