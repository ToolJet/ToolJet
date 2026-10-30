// frontend/src/AppBuilder/_utils/__tests__/libraryQuery.spec.js
import {
  executeLibraryJS,
  runLibraryTransformation,
  libraryTemplateState,
  mergeLibraryInputs,
  LIBRARY_DRAFT,
  runArgNames,
} from '../libraryQuery';

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

describe('LIBRARY_DRAFT', () => {
  it('is the draft pin sentinel', () => {
    expect(LIBRARY_DRAFT).toBe('draft');
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

describe('executeLibraryJS', () => {
  it('sees lodash and no parameters', async () => {
    const res = await executeLibraryJS({ code: 'return [_.sum([1, 2, 3]), typeof parameters]' });
    expect(res).toEqual({ status: 'ok', data: [6, 'undefined'] });
  });

  it('sees input', async () => {
    const res = await executeLibraryJS({ code: 'return input.region', input: { region: 'eu' } });
    expect(res).toEqual({ status: 'ok', data: 'eu' });
  });

  it('has no access to app state', async () => {
    const res = await executeLibraryJS({ code: 'return components.table1.data' });
    expect(res.status).toBe('failed');
    expect(res.data.message).toMatch(/components is not defined/);
  });

  it('exposes globals.currentUser only', async () => {
    const res = await executeLibraryJS({
      code: 'return [globals.currentUser.email, globals.theme]',
      currentUser: { email: 'a@b.c' },
    });
    expect(res.data).toEqual(['a@b.c', undefined]);
  });

  it('has no queries object', async () => {
    const res = await executeLibraryJS({ code: 'return typeof queries' });
    expect(res).toEqual({ status: 'ok', data: 'undefined' });
  });
});

describe('runLibraryTransformation', () => {
  it('transforms data', async () => {
    const res = await runLibraryTransformation({ code: 'return data.map(r => r.id)', data: [{ id: 1 }] });
    expect(res).toEqual({ status: 'ok', data: [1] });
  });

  it('has no access to variables', async () => {
    const res = await runLibraryTransformation({ code: 'return variables.x', data: [] });
    expect(res.status).toBe('failed');
    expect(res.data.message).toMatch(/variables is not defined/);
  });

  it('has no queries object', async () => {
    const res = await runLibraryTransformation({ code: 'return queries', data: [] });
    expect(res.status).toBe('failed');
    expect(res.data.message).toMatch(/queries is not defined/);
  });

  it('reads input, constants, globals.currentUser and lodash', async () => {
    const res = await runLibraryTransformation({
      code: 'return [input.region, constants.c, globals.currentUser.email, _.sum(data)]',
      data: [1, 2],
      input: { region: 'eu' },
      constants: { c: 'k' },
      currentUser: { email: 'a@b.c' },
    });
    expect(res).toEqual({ status: 'ok', data: ['eu', 'k', 'a@b.c', 3] });
  });
});
