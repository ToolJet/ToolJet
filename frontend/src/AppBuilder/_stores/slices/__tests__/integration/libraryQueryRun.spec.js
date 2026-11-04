beforeEach(() => {
  useStore.setState((state) => ({
    license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
  }));
});
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
  state().queryLibrary.setLibraryMode(appType === 'query_library');
  if (appType === 'query_library') {
    for (const query of queries)
      state().queryLibrary.updateCreatedLibraryQuery({ id: query.id, draftId: `${query.id}-draft` }, query);
    state().queryPanel.setSelectedQuery(queries[0]?.id, 'canvas', { fromServer: true });
  }
  if (appType) state().setApp({ ...state().appStore.modules.canvas.app, appType }, 'canvas');
  seedApp({});
  useStore.setState({ license: { featureAccess: { queryLibraryEnabled: true } } });
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
        HttpResponse.json({ id: 'lq1', name: 'x', kind: 'runjs', code: 'return 7' })
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

  describe('run inputs and the library transformation', () => {
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
          ...extra,
        })
      );

    it('should let each run override the inputs the app fills', async () => {
      const bodies = [];
      server.use(
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
          bodies.push(await request.json());
          return HttpResponse.json({ status: 'ok', data: [] });
        })
      );
      seedLibraryApp({ queries: [consumer({ inputs: { id: '{{1 + 41}}', region: '' } })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view', { id: 2 });
      await state().queryPanel.runQuery('c1', 'q', true, 'view', { region: 'eu', id: undefined });
      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(bodies.map((b) => b.inputs)).toEqual([{ id: 2 }, { id: 42, region: 'eu' }, { id: 42 }]);
      expect(bodies.some((b) => 'parameters' in b)).toBe(false);
    });

    it("should pass queries.x.run({ ... }) to a library query's inputs, dropping undeclared names", async () => {
      let body;
      server.use(
        http.post(`${config.apiUrl}/data-queries/c1/run-library`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ status: 'ok', data: [] });
        })
      );
      seedLibraryApp({
        queries: [
          consumer(),
          { id: 'j1', name: 'caller', kind: 'runjs', options: { code: 'await queries.q.run({ id: 7, extra: 1 })' } },
        ],
      });

      await state().queryPanel.runQuery('j1', 'caller', true, 'view');

      expect(body).toEqual({ inputs: { id: 7 } });
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
            libraryTransformation: 'return [data, input.id, input.undeclared, typeof parameters]',
            libraryScope: { input: { id: 'from-server' } },
          })
        )
      );
      seedLibraryApp({ queries: [consumer()] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view', { undeclared: 'leak' });

      // Not the raw run values: `undeclared` is not in the server's scope and `id` is the server's.
      expect(resolvedQuery('q').data).toEqual([10, 'from-server', undefined, 'undefined']);
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

    it('should run a RunJS library query with the app inputs and the run inputs', async () => {
      server.use(definition({ code: 'return input.a + input.b', inputs: [{ name: 'a' }, { name: 'b' }] }));
      seedLibraryApp({ queries: [consumer({ libraryKind: 'runjs', inputs: { a: '{{1}}', b: '' } })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view', { b: 2 });

      expect(resolvedQuery('q').data).toBe(3);
    });

    it('should apply a RunJS library transformation with the resolved input', async () => {
      server.use(
        definition({
          code: 'return 5',
          inputs: [
            { name: 'a', defaultValue: '3' },
            { name: 'b', defaultValue: '4' },
          ],
          transformation: 'return data + input.a + input.b',
        })
      );
      seedLibraryApp({ queries: [consumer({ libraryKind: 'runjs', inputs: {} })] });

      await state().queryPanel.runQuery('c1', 'q', true, 'view');

      expect(resolvedQuery('q').data).toBe('534');
    });
  });

  describe('cancelling a RunJS library query', () => {
    const jsConsumer = { ...libraryQuery, options: { ...libraryQuery.options, libraryKind: 'runjs' } };
    const definition = (code) =>
      http.post(`${config.apiUrl}/data-queries/c1/library-definition`, () =>
        HttpResponse.json({ id: 'lq1', name: 'x', kind: 'runjs', code, inputs: [] })
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
  });

  describe('inside a query library app', () => {
    const jsQuery = (id, name, code, inputs = []) => ({ id, name, kind: 'runjs', options: { code, inputs } });

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

    it('has no queries object in library RunJS', async () => {
      seedLibraryApp({
        queries: [jsQuery('j1', 'base', 'return 1'), jsQuery('j2', 'outer', 'return await queries.base.run()')],
        mode: 'edit',
        appType: 'query_library',
      });

      await state().queryPanel.runQuery('j2', 'outer', true, 'edit');

      expect(resolvedQuery('outer').error.message).toMatch(/queries is not defined/);
    });

    // Server-side library queries resolve templates with input + globals.currentUser only
    // (library-query.util.ts); the library editor must resolve them the same way.
    it('resolves SQL/REST templates in the library editor with the same names consumers get', async () => {
      let body;
      const capture = async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      };
      server.use(
        http.post(`${config.apiUrl}/query-library/queries/r1/run/:environmentId`, capture),
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
              url: 'http://x/{{input.id}}/{{typeof parameters}}/{{typeof components}}/{{typeof globals.currentUser}}',
              inputs: [{ name: 'id', defaultValue: '7' }],
            },
          },
        ],
        mode: 'edit',
        appType: 'query_library',
      });

      await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');

      expect(body.draftId).toBe('r1-draft');
      expect(body.libraryVersionId).toBeUndefined();
      // F08: draft run sends unsupplied declared defaults as inputs (queryPanelSlice.js:786, libraryQuery.js:56-66)
      expect(body.inputs ?? {}).toEqual({});
      expect(body.options.url).toContain('{{input.id}}');
    });

    describe('input and transformations', () => {
      const capture = () => {
        const state_ = { body: undefined };
        const handler = async ({ request }) => {
          state_.body = await request.json();
          return HttpResponse.json({ status: 'ok', data: [1] });
        };
        server.use(
          http.post(`${config.apiUrl}/query-library/queries/r1/run/:environmentId`, handler),
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

        // F08: draft run sends unsupplied declared defaults as inputs (queryPanelSlice.js:786, libraryQuery.js:56-66)
        expect(seen.body.inputs ?? {}).toEqual({});
      });

      // F08: unsupplied `{{constants.x}}` default sent as literal input, server skips default resolution (queryPanelSlice.js:786, :802, :1153)
      it('should leave an unsupplied constants default for the server to resolve in a draft run', async () => {
        const seen = capture();
        seedLibraryApp({
          queries: [
            restQuery({
              url: 'http://x/{{input.region}}',
              inputs: [{ name: 'region', defaultValue: '{{constants.region}}' }],
            }),
          ],
          mode: 'edit',
          appType: 'query_library',
        });

        await state().queryPanel.runQuery('r1', 'getCustomer', true, 'edit');

        expect(seen.body.draftId).toBe('r1-draft');
        expect(seen.body.inputs ?? {}).not.toHaveProperty('region');
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

        state().queryLibrary.updateLibraryDraftSnapshot('r1', 'r1-draft', {
          options: restQuery({
            enableTransformation: true,
            transformationLanguage: 'javascript',
            transformation: 'return components',
          }).options,
        });
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

it.each([undefined, false])('refuses local and consumer execution without effective access %s', async (enabled) => {
  const requests = [];
  server.use(
    http.post(`${config.apiUrl}/data-queries/c1/library-definition`, ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json({ code: 'globalThis.__libraryLicenseRuns += 1;', inputs: [] });
    })
  );
  seedLibraryApp({ queries: [{ ...libraryQuery, options: { ...libraryQuery.options, libraryKind: 'runjs' } }] });
  useStore.setState({ license: { featureAccess: { queryLibraryEnabled: enabled } } });
  globalThis.__libraryLicenseRuns = 0;
  const result = await state().queryPanel.runLibraryQuery({
    ...libraryQuery,
    options: { ...libraryQuery.options, libraryKind: 'runjs' },
  });
  const editorResult = await state().queryPanel.runLibraryEditorJS({
    options: { code: 'globalThis.__libraryLicenseRuns += 1;' },
  });
  expect(result.status).toBe('failed');
  expect(editorResult.status).toBe('failed');
  expect(requests).toHaveLength(0);
  expect(globalThis.__libraryLicenseRuns).toBe(0);
  delete globalThis.__libraryLicenseRuns;
});
