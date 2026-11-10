beforeEach(() => {
  useStore.setState((state) => ({
    license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
  }));
});
/**
 * "Add to query library": the store flushes any pending save, posts the stored options to the server and
 * swaps the query in place to the converted library row. Real composed store + MSW at the HTTP boundary.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { toast } from 'react-hot-toast';
import { normalizeQueryTransformationOptions } from '@/AppBuilder/_stores/utils/appDataCaseConversion';

const state = () => useStore.getState();

const appQuery = {
  id: 'q1',
  name: 'getCustomer',
  kind: 'restapi',
  data_source_id: 'ds-rest',
  options: { method: 'get', url: '/customers/{{components.input1.value}}', runOnPageLoad: false },
};

const addUrl = `${config.apiUrl}/data-queries/q1/versions/v1/add-to-library`;
const patchUrl = `${config.apiUrl}/data-queries/q1/versions/v1`;

const converted = {
  query: {
    id: 'q1',
    name: 'getCustomer',
    kind: 'library',
    data_source_id: 'static-lib-ds',
    options: { libraryQueryId: 'lq1', libraryQueryVersionId: 'lv1', libraryKind: 'restapi', inputs: { id: '{{1}}' } },
  },
  libraryQueryId: 'lq1',
  libraryVersionId: 'lv1',
};

const body = {
  name: 'getCustomer',
  libraryOptions: { description: 'd' },
  inputs: { id: '{{components.input1.value}}' },
};

function seed(queries = [appQuery]) {
  server.use(http.patch(patchUrl, () => HttpResponse.json({ updated_at: 'now' })));
  state().dataQuery.setQueries(queries, 'canvas');
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(
    queries.map(({ id }) => id),
    'canvas'
  );
  state().setCurrentMode('edit', 'canvas');
  seedApp({});
  useStore.setState({ currentVersionId: 'v1' });
  state().queryPanel.setSelectedQuery('q1', 'canvas');
}

const stored = () => state().dataQuery.queries.modules.canvas.find((q) => q.id === 'q1');

describe('addQueryToLibrary', () => {
  it('swaps the query in place to the converted library row and keeps it selected', async () => {
    server.use(http.post(addUrl, () => HttpResponse.json(converted, { status: 201 })));
    seed();

    await state().dataQuery.addQueryToLibrary('q1', body, 'canvas');

    expect(stored()).toMatchObject({ id: 'q1', name: 'getCustomer', kind: 'library', data_source_id: 'static-lib-ds' });
    expect(stored().options).toMatchObject({ libraryQueryId: 'lq1', libraryQueryVersionId: 'lv1' });
    expect(state().queryPanel.selectedQuery.kind).toBe('library');
  });

  it('posts the stored options as sourceOptions and forwards name, libraryOptions and inputs', async () => {
    let sent;
    server.use(
      http.post(addUrl, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(converted, { status: 201 });
      })
    );
    seed();

    await state().dataQuery.addQueryToLibrary('q1', body, 'canvas');

    expect(sent).toEqual({ ...body, sourceOptions: appQuery.options });
  });

  it('flushes the latest pending throttled save, then persists the store options, before the add request', async () => {
    const calls = [];
    seed();
    server.use(
      http.patch(patchUrl, async ({ request }) => {
        calls.push(['PATCH', (await request.json()).options]);
        return HttpResponse.json({ updated_at: 'now' });
      }),
      http.post(addUrl, () => {
        calls.push(['POST']);
        return HttpResponse.json(converted, { status: 201 });
      })
    );
    const latest = { ...appQuery.options, url: '/latest' };
    // The first throttled call runs right away; the second is held until the throttle window ends.
    state().dataQuery.saveData(appQuery, 'canvas');
    state().dataQuery.saveData({ ...appQuery, options: latest }, 'canvas');

    await state().dataQuery.addQueryToLibrary('q1', body, 'canvas');

    expect(calls).toEqual([['PATCH', appQuery.options], ['PATCH', latest], ['PATCH', appQuery.options], ['POST']]);
  });

  it('persists the store options first so a legacy snake_case row cannot cause a permanent 409', async () => {
    const calls = [];
    const legacy = normalizeQueryTransformationOptions({
      ...appQuery,
      options: { method: 'get', url: '/c', run_on_page_load: true },
    });
    seed([legacy]);
    server.use(
      http.patch(patchUrl, async ({ request }) => {
        calls.push(['PATCH', (await request.json()).options]);
        return HttpResponse.json({ updated_at: 'now' });
      }),
      http.post(addUrl, async ({ request }) => {
        calls.push(['POST', (await request.json()).sourceOptions]);
        return HttpResponse.json(converted, { status: 201 });
      })
    );

    await state().dataQuery.addQueryToLibrary('q1', body, 'canvas');

    const camel = { method: 'get', url: '/c', runOnPageLoad: true };
    expect(calls).toEqual([
      ['PATCH', camel],
      ['POST', camel],
    ]);
  });

  it('leaves the store unchanged, toasts once and rejects when the server answers 409', async () => {
    const toastError = jest.spyOn(toast, 'error').mockImplementation(() => {});
    server.use(
      http.post(addUrl, () => HttpResponse.json({ message: 'This query changed, try again.' }, { status: 409 }))
    );
    seed();
    const before = stored();

    await expect(state().dataQuery.addQueryToLibrary('q1', body, 'canvas')).rejects.toMatchObject({
      error: 'This query changed, try again.',
    });

    expect(stored()).toEqual(before);
    expect(state().queryPanel.selectedQuery.kind).toBe('restapi');
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('This query changed, try again.');
    toastError.mockRestore();
  });

  it('toasts the server message once and never posts when the direct options update fails', async () => {
    const toastError = jest.spyOn(toast, 'error').mockImplementation(() => {});
    let posted = false;
    seed();
    server.use(
      http.patch(patchUrl, () => HttpResponse.json({ message: 'Not allowed' }, { status: 403 })),
      http.post(addUrl, () => {
        posted = true;
        return HttpResponse.json(converted, { status: 201 });
      })
    );
    const before = stored();

    await expect(state().dataQuery.addQueryToLibrary('q1', body, 'canvas')).rejects.toMatchObject({
      error: 'Not allowed',
    });

    expect(posted).toBe(false);
    expect(stored()).toEqual(before);
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('Not allowed');
    toastError.mockRestore();
  });

  it('rejects without a second toast when the flushed save fails (saveData already toasted)', async () => {
    const toastError = jest.spyOn(toast, 'error').mockImplementation(() => {});
    seed();
    server.use(http.patch(patchUrl, () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    state().dataQuery.saveData(appQuery, 'canvas');
    state().dataQuery.saveData({ ...appQuery, options: { ...appQuery.options, url: '/x' } }, 'canvas');
    const before = stored();

    await expect(state().dataQuery.addQueryToLibrary('q1', body, 'canvas')).rejects.toBeDefined();
    await new Promise((r) => setTimeout(r, 100));

    expect(stored()).toEqual(before);
    expect(toastError.mock.calls.filter(([m]) => m === 'App could not be saved.').length).toBeGreaterThan(0);
    expect(toastError.mock.calls.filter(([m]) => m !== 'App could not be saved.')).toHaveLength(0);
    toastError.mockRestore();
  });

  it('updates the row but does not steal the selection when another query is selected', async () => {
    server.use(http.post(addUrl, () => HttpResponse.json(converted, { status: 201 })));
    const other = { id: 'q2', name: 'other', kind: 'restapi', data_source_id: 'ds-rest', options: {} };
    seed([appQuery, other]);
    state().queryPanel.setSelectedQuery('q2', 'canvas');

    await state().dataQuery.addQueryToLibrary('q1', body, 'canvas');

    expect(stored()).toMatchObject({ kind: 'library', dataSourceId: 'static-lib-ds', data_source_id: 'static-lib-ds' });
    expect(state().queryPanel.selectedQuery.id).toBe('q2');
  });

  it('re-registers dependencies for the converted query when runOnDependencyChange is on', async () => {
    const depConverted = {
      ...converted,
      query: {
        ...converted.query,
        options: {
          ...converted.query.options,
          runOnDependencyChange: true,
          inputs: { id: '{{components.input1.value}}' },
        },
      },
    };
    server.use(http.post(addUrl, () => HttpResponse.json(depConverted, { status: 201 })));
    seed();
    const graph = () => state().dependencyGraph.modules.canvas?.graph;
    expect(graph()?.hasNode('queries.q1.__options__') ?? false).toBe(false);

    await state().dataQuery.addQueryToLibrary('q1', body, 'canvas');

    expect(graph().hasNode('queries.q1.__options__')).toBe(true);
  });
});
