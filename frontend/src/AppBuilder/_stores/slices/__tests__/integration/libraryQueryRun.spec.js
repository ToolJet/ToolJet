/**
 * Running a `library` query from an app: server path for SQL/REST kinds, browser path for RunJS,
 * fallback when the server says the query is client-side, and failures through the normal query
 * failure path. Real composed store + MSW at the HTTP boundary; nothing in the store is mocked.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';

const state = () => useStore.getState();

const libraryQuery = {
  id: 'c1',
  name: 'getCustomerLib',
  kind: 'library',
  options: {
    libraryAppId: 'lib-app',
    libraryQueryId: 'lq1',
    libraryKind: 'postgresql',
    libraryVersion: 'latest',
    inputs: { id: '{{1 + 41}}' },
  },
};

/** Seeds the queries through the store's public setters, in the order the app load uses. */
function seedLibraryApp({ queries, mode = 'view', appType } = {}) {
  state().dataQuery.setQueries(queries, 'canvas');
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(
    queries.map(({ id }) => id),
    'canvas'
  );
  state().setCurrentMode(mode, 'canvas');
  if (appType) state().setApp({ ...state().appStore.modules.canvas.app, appType }, 'canvas');
  seedApp({});
}

const resolvedQuery = (name) => state().getResolvedState('canvas').queries[name];

describe('library query run', () => {
  it('resolves inputs in the app and exposes the server result as queries.x.data', async () => {
    let body;
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ status: 'ok', data: [{ id: 42 }] });
      })
    );
    seedLibraryApp({ queries: [libraryQuery] });

    await state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');

    expect(body).toEqual({ inputs: { id: 42 } });
    expect(resolvedQuery('getCustomerLib').data).toEqual([{ id: 42 }]);
  });

  it('runs a RunJS library query in the browser via its definition', async () => {
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/library-definition`, () =>
        HttpResponse.json({
          id: 'lq1',
          name: 'double',
          kind: 'runjs',
          code: 'return parameters.id * 2',
          parameters: [{ name: 'id' }],
          siblings: [],
        })
      )
    );
    seedLibraryApp({
      queries: [{ ...libraryQuery, options: { ...libraryQuery.options, libraryKind: 'runjs' } }],
    });

    await state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');

    expect(resolvedQuery('getCustomerLib').data).toBe(84);
  });

  // A blank input box means "use the library default" — its placeholder says "Default: X".
  it('leaves blank inputs out of the server request so the library default applies', async () => {
    let body;
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    seedLibraryApp({
      queries: [{ ...libraryQuery, options: { ...libraryQuery.options, inputs: { id: '', limit: '{{5}}' } } }],
    });

    await state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');

    expect(body).toEqual({ inputs: { limit: 5 } });
  });

  it('uses the RunJS library default when the input box is blank', async () => {
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/library-definition`, () =>
        HttpResponse.json({
          id: 'lq1',
          name: 'echo',
          kind: 'runjs',
          code: 'return parameters.id',
          parameters: [{ name: 'id', defaultValue: '2' }],
          siblings: [],
        })
      )
    );
    seedLibraryApp({
      queries: [{ ...libraryQuery, options: { ...libraryQuery.options, libraryKind: 'runjs', inputs: { id: '' } } }],
    });

    await state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');

    expect(resolvedQuery('getCustomerLib').data).toBe('2');
  });

  it('falls back to the browser path when the server says the query is client-side', async () => {
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/run-library`, () =>
        HttpResponse.json({ statusCode: 400, message: 'LIBRARY_QUERY_IS_CLIENT_SIDE' }, { status: 400 })
      ),
      http.post(`${config.apiUrl}/data-queries/c1/library-definition`, () =>
        HttpResponse.json({ id: 'lq1', name: 'x', kind: 'runjs', code: 'return 7', parameters: [], siblings: [] })
      )
    );
    seedLibraryApp({ queries: [libraryQuery] });

    await state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');

    expect(resolvedQuery('getCustomerLib').data).toBe(7);
  });

  it('surfaces "Library query not found" through the normal failure path', async () => {
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/run-library`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Library query not found' }, { status: 404 })
      )
    );
    seedLibraryApp({ queries: [libraryQuery] });

    await state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');

    const q = resolvedQuery('getCustomerLib');
    expect(q.isLoading).toBe(false);
    expect(JSON.stringify(q.error ?? q)).toContain('Library query not found');
  });

  it('surfaces a failing browser RunJS library query as a normal failure', async () => {
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/library-definition`, () =>
        HttpResponse.json({
          id: 'lq1',
          name: 'boom',
          kind: 'runjs',
          code: 'throw new Error("kaboom")',
          parameters: [],
          siblings: [],
        })
      )
    );
    seedLibraryApp({
      queries: [{ ...libraryQuery, options: { ...libraryQuery.options, libraryKind: 'runjs' } }],
    });

    await state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');

    const q = resolvedQuery('getCustomerLib');
    expect(q.isLoading).toBe(false);
    expect(q.error.message).toContain('kaboom');
  });

  it('previews a library query through the same server path', async () => {
    let body;
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ status: 'ok', data: [{ id: 42 }] });
      })
    );
    seedLibraryApp({ queries: [libraryQuery] });

    const result = await state().queryPanel.previewQuery(libraryQuery, true);

    expect(body).toEqual({ inputs: { id: 42 } });
    expect(result).toEqual({ status: 'ok', data: [{ id: 42 }] });
  });

  describe('inside a query library app', () => {
    const jsQuery = (id, name, code, parameters = []) => ({ id, name, kind: 'runjs', options: { code, parameters } });

    it('runs RunJS with the restricted scope (no components)', async () => {
      seedLibraryApp({
        queries: [jsQuery('j1', 'double', 'return components.x')],
        mode: 'edit',
        appType: 'query_library',
      });

      await state().queryPanel.runQuery('j1', 'double', true, 'edit');

      const q = resolvedQuery('double');
      expect(q.isLoading).toBe(false);
      expect(q.error.message).toMatch(/components is not defined/);
    });

    it('merges parameter defaults and runs runjs siblings with their own defaults', async () => {
      seedLibraryApp({
        queries: [
          jsQuery('j1', 'base', 'return parameters.n * 2', [{ name: 'n', defaultValue: '3' }]),
          jsQuery('j2', 'outer', 'return (await queries.base.run({ n: 5 })) + 1'),
          jsQuery('j3', 'withDefault', 'return await queries.base.run()'),
        ],
        mode: 'edit',
        appType: 'query_library',
      });

      await state().queryPanel.runQuery('j2', 'outer', true, 'edit');
      expect(resolvedQuery('outer').data).toBe(11);

      await state().queryPanel.runQuery('j3', 'withDefault', true, 'edit');
      expect(resolvedQuery('withDefault').data).toBe(6);
    });

    it('caps sibling nesting (a <-> b) with the nesting error, not a stack overflow', async () => {
      seedLibraryApp({
        queries: [
          jsQuery('j1', 'a', 'await Promise.resolve(); return await queries.b.run()'),
          jsQuery('j2', 'b', 'await Promise.resolve(); return await queries.a.run()'),
        ],
        mode: 'edit',
        appType: 'query_library',
      });

      await state().queryPanel.runQuery('j1', 'a', true, 'edit');

      const message = resolvedQuery('a').error.message;
      expect(message).toBe('Library query nesting is too deep');
      expect(message).not.toMatch(/call stack/i);
    });

    // Server-side library queries resolve templates with parameters + globals.currentUser only
    // (library-query.util.ts); the library editor must resolve them the same way.
    it('resolves SQL/REST templates in the library editor with the same names consumers get', async () => {
      let body;
      const capture = async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      };
      server.use(
        http.post(`${config.apiUrl}/data-queries/r1/versions/:versionId/run/:environmentId`, capture),
        http.post(`${config.apiUrl}/data-queries/r1/versions/:versionId/run`, capture),
        http.post(`${config.apiUrl}/data-queries/r1/run`, capture)
      );
      seedLibraryApp({
        queries: [
          {
            id: 'r1',
            name: 'getCustomer',
            kind: 'restapi',
            options: {
              url: 'http://x/{{parameters.id}}/{{typeof components}}/{{typeof globals.currentUser}}',
              parameters: [{ name: 'id', defaultValue: '7' }],
            },
          },
        ],
        mode: 'edit',
        appType: 'query_library',
      });

      await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');

      expect(body.resolvedOptions).toMatchObject({
        '{{parameters.id}}': '7',
        '{{typeof components}}': 'undefined',
        '{{typeof globals.currentUser}}': 'object',
      });
    });

    it('previews RunJS with the restricted scope', async () => {
      const query = jsQuery('j1', 'peek', 'return components.x');
      seedLibraryApp({ queries: [query], mode: 'edit', appType: 'query_library' });

      const result = await state().queryPanel.previewQuery(query, true);

      expect(result.status).toBe('failed');
      expect(JSON.stringify(result)).toMatch(/components is not defined/);
    });
  });
});
