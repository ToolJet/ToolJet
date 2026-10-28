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
import { queryAbortControllers } from '@/AppBuilder/_utils/queryAbort';

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
          code: 'return input.id * 2',
          inputs: [{ name: 'id' }],
          parameters: [],
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
          code: 'return input.id',
          inputs: [{ name: 'id', defaultValue: '2' }],
          parameters: [],
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

  it('previews without sending a default naming constants or secrets', async () => {
    let body;
    server.use(
      http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    const query = {
      ...libraryQuery,
      options: {
        ...libraryQuery.options,
        parameters: [
          { name: 'key', defaultValue: '{{constants.a}}-{{ constants.b }}' },
          { name: 'token', defaultValue: 'Bearer {{ secrets.token }}' },
          { name: 'limit', defaultValue: '{{5 * 2}}' },
        ],
      },
    };
    seedLibraryApp({ queries: [query] });

    await state().queryPanel.previewQuery(query, true);

    expect(body.parameters).toEqual({ limit: 10 });
  });

  describe('runtime parameters, inputs and the library transformation', () => {
    const consumer = (extra = {}) => ({
      ...libraryQuery,
      name: 'q',
      id: 'c1',
      options: { ...libraryQuery.options, ...extra },
    });
    const definition = (extra = {}) =>
      http.post(`${config.apiUrl}/data-queries/c1/library-definition`, () =>
        HttpResponse.json({
          id: 'lq1',
          name: 'x',
          kind: 'runjs',
          code: 'return 1',
          inputs: [],
          parameters: [],
          siblings: [],
          ...extra,
        })
      );

    it('should send each run its own runtime parameters', async () => {
      const bodies = [];
      server.use(
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
          bodies.push(await request.json());
          return HttpResponse.json({ status: 'ok', data: [] });
        })
      );
      seedLibraryApp({ queries: [consumer({ parameters: [{ name: 'limit', defaultValue: '10' }] })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view', { limit: 2 });
      await state().queryPanel.runQuery('c1', 'q', true, 'view', { limit: 5 });

      expect(bodies.map((b) => b.parameters.limit)).toEqual([2, 5]);
      expect(bodies.map((b) => b.inputs)).toEqual([{ id: 42 }, { id: 42 }]);
    });

    it('should leave a default naming constants or secrets for the server to resolve', async () => {
      let body;
      server.use(
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ status: 'ok', data: [] });
        })
      );
      seedLibraryApp({
        queries: [
          consumer({
            parameters: [
              { name: 'key', defaultValue: '{{constants.a}}-{{ constants.b }}' },
              { name: 'token', defaultValue: 'Bearer {{ secrets.token }}' },
              { name: 'limit', defaultValue: '{{5 * 2}}' },
            ],
          }),
        ],
      });

      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(body.parameters).toEqual({ limit: 10 });
    });

    it('should apply the library transformation before the app transformation', async () => {
      server.use(
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, () =>
          HttpResponse.json({ status: 'ok', data: [1, 2, 3], libraryTransformation: 'return data.length' })
        )
      );
      seedLibraryApp({
        queries: [
          consumer({
            enableTransformation: true,
            transformationLanguage: 'javascript',
            transformation: 'return data * 10',
          }),
        ],
      });

      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(resolvedQuery('q').data).toBe(30);
    });

    it('should run a server library transformation with the scope the server resolved', async () => {
      server.use(
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, () =>
          HttpResponse.json({
            status: 'ok',
            data: 10,
            libraryTransformation: 'return [data, input.id, parameters.limit, parameters.undeclared]',
            libraryScope: { input: { id: 'from-server' }, parameters: { limit: 5 } },
          })
        )
      );
      seedLibraryApp({ queries: [consumer({ parameters: [{ name: 'limit', defaultValue: '5' }] })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view', { undeclared: 'leak' });

      // Not the raw runtime values: `undeclared` is not in the server's scope and `id` is the server's.
      expect(resolvedQuery('q').data).toEqual([10, 'from-server', 5, undefined]);
    });

    it('should run a sibling transformation with the scope the server resolved', async () => {
      server.use(
        definition({
          code: 'return queries.rel.run({ n: 1, extra: 2 })',
          siblings: [{ id: 's1', name: 'rel', kind: 'postgresql', released: true }],
        }),
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, () =>
          HttpResponse.json({
            status: 'ok',
            data: 'rows',
            libraryTransformation: 'return [data, parameters.n, parameters.extra]',
            libraryScope: { input: {}, parameters: { n: 1 } },
          })
        )
      );
      seedLibraryApp({ queries: [consumer({ libraryKind: 'runjs' })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(resolvedQuery('q').data).toEqual(['rows', 1, undefined]);
    });

    it('should fail the query when the library transformation touches the app', async () => {
      server.use(
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, () =>
          HttpResponse.json({ status: 'ok', data: [1], libraryTransformation: 'return components' })
        )
      );
      seedLibraryApp({ queries: [consumer()] });
      const onEvent = jest.fn();
      useStore.setState({ eventsSlice: { ...state().eventsSlice, onEvent } });

      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(JSON.stringify(resolvedQuery('q').error)).toMatch(/components is not defined/);
      expect(onEvent.mock.calls.map(([name]) => name)).toContain('onDataQueryFailure');
    });

    it('should run a RunJS library query with input and parameters', async () => {
      server.use(
        definition({ code: 'return input.a + parameters.b', inputs: [{ name: 'a' }], parameters: [{ name: 'b' }] })
      );
      seedLibraryApp({ queries: [consumer({ libraryKind: 'runjs', inputs: { a: '{{1}}' } })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view', { b: 2 });

      expect(resolvedQuery('q').data).toBe(3);
    });

    it('should apply a RunJS library transformation with the resolved input and parameters', async () => {
      server.use(
        definition({
          code: 'return 5',
          inputs: [{ name: 'a', defaultValue: '3' }],
          parameters: [{ name: 'b', defaultValue: '4' }],
          transformation: 'return data + input.a + parameters.b',
        })
      );
      seedLibraryApp({ queries: [consumer({ libraryKind: 'runjs', inputs: {} })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(resolvedQuery('q').data).toBe('534');
    });

    it('should run a sibling with only its parameters and refuse an unreleased one', async () => {
      const bodies = [];
      server.use(
        definition({
          code: 'return [await queries.rel.run({ n: 1 }), await queries.draftOnly.run().catch((e) => e.message)]',
          siblings: [
            { id: 's1', name: 'rel', kind: 'postgresql', released: true },
            { id: 's2', name: 'draftOnly', kind: 'postgresql', released: false },
          ],
        }),
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
          bodies.push(await request.json());
          return HttpResponse.json({ status: 'ok', data: 'rows' });
        })
      );
      seedLibraryApp({ queries: [consumer({ libraryKind: 'runjs' })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(bodies).toEqual([{ inputs: {}, parameters: { n: 1 }, libraryQueryId: 's1' }]);
      expect(resolvedQuery('q').data).toEqual(['rows', 'Library query "draftOnly" has no released version']);
    });
  });

  describe('cancelling a RunJS library query', () => {
    const jsConsumer = { ...libraryQuery, options: { ...libraryQuery.options, libraryKind: 'runjs' } };
    const definition = (code, siblings = []) =>
      http.post(`${config.apiUrl}/data-queries/c1/library-definition`, () =>
        HttpResponse.json({ id: 'lq1', name: 'x', kind: 'runjs', code, inputs: [], parameters: [], siblings })
      );
    const waitFor = async (check) => {
      for (let i = 0; i < 100 && !check(); i++) await new Promise((r) => setTimeout(r, 10));
      expect(check()).toBe(true);
    };

    it('should cancel a RunJS library query that is still running', async () => {
      server.use(definition('await new Promise(() => {})'));
      seedLibraryApp({ queries: [jsConsumer] });
      const onEvent = jest.fn();
      useStore.setState({ eventsSlice: { ...state().eventsSlice, onEvent } });

      const run = state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');
      await waitFor(() => queryAbortControllers.has('c1'));
      await new Promise((r) => setTimeout(r, 50)); // user code is now awaiting
      state().queryPanel.abortQuery('c1');

      await expect(run).resolves.toEqual({ status: 'aborted' });
      expect(resolvedQuery('getCustomerLib').isLoading).toBe(false);
      expect(onEvent.mock.calls.map(([name]) => name)).not.toContain('onDataQuerySuccess');
    });

    it('should abort an in-flight sibling request', async () => {
      let started = false;
      let signalAborted = false;
      server.use(
        definition('return await queries.rel.run()', [{ id: 's1', name: 'rel', kind: 'postgresql', released: true }]),
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
          started = true;
          request.signal.addEventListener('abort', () => (signalAborted = true));
          await new Promise((r) => setTimeout(r, 300));
          return HttpResponse.json({ status: 'ok', data: 'rows' });
        })
      );
      seedLibraryApp({ queries: [jsConsumer] });

      const run = state().queryPanel.runQuery('c1', 'getCustomerLib', true, 'view');
      await waitFor(() => started);
      state().queryPanel.abortQuery('c1');

      await expect(run).resolves.toEqual({ status: 'aborted' });
      await waitFor(() => signalAborted);
    });
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

    describe('input and transformations', () => {
      const capture = () => {
        const state_ = { body: undefined };
        const handler = async ({ request }) => {
          state_.body = await request.json();
          return HttpResponse.json({ status: 'ok', data: [1] });
        };
        server.use(
          http.post(`${config.apiUrl}/data-queries/r1/versions/:versionId/run/:environmentId`, handler),
          http.post(`${config.apiUrl}/data-queries/r1/versions/:versionId/run`, handler),
          http.post(`${config.apiUrl}/data-queries/r1/run`, handler)
        );
        return state_;
      };
      const restQuery = (options) => ({
        id: 'r1',
        name: 'getCustomer',
        kind: 'restapi',
        options: { url: 'http://x', inputs: [{ name: 'x', defaultValue: '9' }], ...options },
      });

      it('should resolve {{input.x}} with its default in the library editor', async () => {
        const seen = capture();
        seedLibraryApp({
          queries: [restQuery({ url: 'http://x/{{input.x}}' })],
          mode: 'edit',
          appType: 'query_library',
        });

        await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');

        expect(seen.body.resolvedOptions).toMatchObject({ '{{input.x}}': '9' });
      });

      it('should run the library transformation with input and the restricted scope', async () => {
        capture();
        seedLibraryApp({
          queries: [
            restQuery({
              enableTransformation: true,
              transformationLanguage: 'javascript',
              transformation: 'return data[0] + Number(input.x)',
            }),
          ],
          mode: 'edit',
          appType: 'query_library',
        });

        await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');
        expect(resolvedQuery('getCustomer').data).toBe(10);

        useStore.getState().dataQuery.setQueries(
          [
            restQuery({
              enableTransformation: true,
              transformationLanguage: 'javascript',
              transformation: 'return components',
            }),
          ],
          'canvas'
        );
        await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');
        expect(JSON.stringify(resolvedQuery('getCustomer').error)).toMatch(/components is not defined/);
      });

      it('should log a failed library transformation to the debugger like a normal transformation', async () => {
        capture();
        seedLibraryApp({
          queries: [
            restQuery({
              enableTransformation: true,
              transformationLanguage: 'javascript',
              transformation: 'return components',
            }),
          ],
          mode: 'edit',
          appType: 'query_library',
        });

        await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');

        const entry = state().debugger.logs.find((log) => log.isTransformation);
        expect(entry).toMatchObject({
          logLevel: 'error',
          type: 'transformation',
          kind: 'restapi',
          errorTarget: 'Queries',
        });
        expect(entry.error.message).toMatch(/components is not defined/);
      });

      it('should fail a Python transformation', async () => {
        capture();
        seedLibraryApp({
          queries: [
            restQuery({ enableTransformation: true, transformationLanguage: 'python', transformation: 'return data' }),
          ],
          mode: 'edit',
          appType: 'query_library',
        });

        await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');

        expect(JSON.stringify(resolvedQuery('getCustomer').error)).toContain(
          'Library transformations must be JavaScript'
        );
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
