// frontend/src/AppBuilder/_utils/__tests__/libraryQuery.spec.js
import {
  executeLibraryJS,
  runLibraryTransformation,
  libraryTemplateState,
  mergeLibraryParameters,
  MAX_LIBRARY_DEPTH,
  LIBRARY_DRAFT,
} from '../libraryQuery';

describe('libraryTemplateState', () => {
  it('exposes input, parameters, constants and globals.currentUser only', () => {
    expect(
      libraryTemplateState(
        { constants: { c: 1 }, globals: { currentUser: { email: 'a@b.c' }, theme: 'x' } },
        { p: 2 },
        { region: 'eu' }
      )
    ).toEqual({
      input: { region: 'eu' },
      parameters: { p: 2 },
      constants: { c: 1 },
      globals: { currentUser: { email: 'a@b.c' } },
    });
  });

  it('defaults input to an empty object', () => {
    expect(libraryTemplateState({}, {}).input).toEqual({});
  });
});

describe('LIBRARY_DRAFT', () => {
  it('is the draft pin sentinel', () => {
    expect(LIBRARY_DRAFT).toBe('draft');
  });
});

describe('mergeLibraryParameters', () => {
  it('uses inputs, falls back to defaults, drops undeclared keys', () => {
    expect(
      mergeLibraryParameters(
        [
          { name: 'id', defaultValue: '1' },
          { name: 'limit', defaultValue: '10' },
        ],
        { id: 5, x: 1 }
      )
    ).toEqual({ id: 5, limit: '10' });
  });

  it('passes defaults through resolveDefault', () => {
    expect(mergeLibraryParameters([{ name: 'n', defaultValue: '{{5}}' }], {}, () => 5)).toEqual({ n: 5 });
  });

  // Stands in for the store's resolver: one template in, its value out.
  const evaluate = (template) => Function(`return (${template.slice(2, -2)})`)();

  it('should resolve a mixed-text default', () => {
    expect(
      mergeLibraryParameters(
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
      mergeLibraryParameters(
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
    expect(mergeLibraryParameters([{ name: 'constructor', defaultValue: 'x' }], {})).toEqual({ constructor: 'x' });
    expect(mergeLibraryParameters([{ name: 'toString', defaultValue: 'y' }], undefined)).toEqual({ toString: 'y' });
  });
});

describe('executeLibraryJS', () => {
  it('sees parameters and lodash', async () => {
    const res = await executeLibraryJS({ code: 'return _.sum(parameters.ids)', parameters: { ids: [1, 2, 3] } });
    expect(res).toEqual({ status: 'ok', data: 6 });
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

  it('runs a sibling and returns its data', async () => {
    const runSibling = jest.fn().mockResolvedValue([{ id: 1, mrr: 9000 }]);
    const res = await executeLibraryJS({
      code: 'const rows = await queries.getCustomer.run({ id: 1 }); return rows[0].mrr > 5000;',
      siblings: [{ id: 's1', name: 'getCustomer', kind: 'postgresql' }],
      runSibling,
    });
    expect(res).toEqual({ status: 'ok', data: true });
    expect(runSibling).toHaveBeenCalledWith({ id: 's1', name: 'getCustomer', kind: 'postgresql' }, { id: 1 }, 1);
  });

  it('reports a failing sibling as a failed run', async () => {
    const res = await executeLibraryJS({
      code: 'return await queries.bad.run()',
      siblings: [{ id: 's2', name: 'bad', kind: 'restapi' }],
      runSibling: () => Promise.reject(new Error('boom')),
    });
    expect(res).toEqual({ status: 'failed', data: { message: 'boom', description: 'boom' } });
  });

  it('stops runaway nesting', async () => {
    const res = await executeLibraryJS({ code: 'return 1', depth: MAX_LIBRARY_DEPTH + 1 });
    expect(res.data.message).toBe('Library query nesting is too deep');
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

  it('reads input, parameters, constants, globals.currentUser and lodash', async () => {
    const res = await runLibraryTransformation({
      code: 'return [input.region, parameters.n, constants.c, globals.currentUser.email, _.sum(data)]',
      data: [1, 2],
      input: { region: 'eu' },
      parameters: { n: 3 },
      constants: { c: 'k' },
      currentUser: { email: 'a@b.c' },
    });
    expect(res).toEqual({ status: 'ok', data: ['eu', 3, 'k', 'a@b.c', 3] });
  });
});
