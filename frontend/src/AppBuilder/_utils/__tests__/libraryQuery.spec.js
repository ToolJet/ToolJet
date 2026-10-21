// frontend/src/AppBuilder/_utils/__tests__/libraryQuery.spec.js
import { executeLibraryJS, mergeLibraryParameters, MAX_LIBRARY_DEPTH } from '../libraryQuery';

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
});

describe('executeLibraryJS', () => {
  it('sees parameters and lodash', async () => {
    const res = await executeLibraryJS({ code: 'return _.sum(parameters.ids)', parameters: { ids: [1, 2, 3] } });
    expect(res).toEqual({ status: 'ok', data: 6 });
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
