/**
 * Starting a run only sets `isLoading: true`. It no longer clears data, rawData, request,
 * response, responseHeaders, metadata or error first, so bound components keep the previous
 * result until the run settles. How a run settles is unchanged:
 *
 *   success → every result field replaced together (empty data and absent metadata included)
 *   failure → error set; REST API failures still report their request/response/metadata at the
 *             top level as before, and data/rawData are untouched
 *   abort   → isLoading false, nothing else touched, no failure event
 *   reset   → result cleared
 *
 * NO MOCKS: the real store and runQuery, with the run endpoint answered through MSW. The
 * observable is exposedValues.queries[id], what `{{queries.<name>.*}}` bindings read.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { resetAllStores } from '@/AppBuilder/_stores/utils';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const s = () => useStore.getState();
const RUN_URL = '*/data-queries/:queryId/run';

const query = (options = {}) => ({
  id: 'q1',
  name: 'query1',
  kind: 'restapi',
  options: { url: 'https://example.test', ...options },
});
const exposed = () => s().resolvedStore.modules.canvas.exposedValues.queries.q1;
const variables = () => s().resolvedStore.modules.canvas.exposedValues.variables;

const FIRST = {
  status: 'ok',
  data: [{ name: 'alpha' }, { name: 'bravo' }],
  metadata: {
    request: { url: 'https://example.test/first' },
    response: { statusCode: 200 },
    responseHeaders: { 'x-run': 'first' },
  },
};

const FAILED = {
  status: 'failed',
  message: 'Query could not be completed',
  description: 'Service unavailable',
  data: {
    requestObject: { url: 'https://example.test/failed' },
    responseObject: { statusCode: 503 },
    responseHeaders: { 'x-run': 'failed' },
  },
  metadata: {
    request: { url: 'https://example.test/failed' },
    response: { statusCode: 503 },
  },
};

/** Answers runs in order: each entry is a response body, or a held response released later. */
function serveRuns(...bodies) {
  const queue = [...bodies];
  server.use(
    http.post(RUN_URL, async () => {
      const next = queue.shift();
      const body = next?.held ? await next.held : next;
      return HttpResponse.json(body);
    })
  );
}

/** A response the test releases by hand, so the run stays in flight until then. */
function heldResponse() {
  let release;
  const held = new Promise((resolve) => (release = resolve));
  return { held, release: (body) => release(body) };
}

function seedQuery(options, { components = {} } = {}) {
  const q = query(options);
  // Mapping first: it is what lets `queries.query1` bindings register their edges.
  s().dataQuery.setQueries([q], 'canvas');
  s().setQueryMapping('canvas');
  seedApp(components);
  s().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  s().setEditorLoading(false, 'canvas');
  s().setCurrentMode('view', 'canvas');
  // What app load does for every query: the initial empty state.
  s().initialiseResolvedQuery([q.id], 'canvas');
  return q;
}

const run = () => s().queryPanel.runQuery('q1', 'query1', undefined, 'view');

/** Query event that records which outcome fired, through a public variable. */
const recordOutcome = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: 'q1',
  name: eventId,
  target: 'data_query',
  event: { eventId, actionId: 'set-custom-variable', key, value: 'fired' },
});

const firstResult = {
  data: FIRST.data,
  rawData: FIRST.data,
  metadata: FIRST.metadata,
  request: FIRST.metadata.request,
  response: FIRST.metadata.response,
  responseHeaders: FIRST.metadata.responseHeaders,
};

describe('a query re-run keeps its previous result', () => {
  afterEach(() => resetAllStores());

  test('QR-1 first execution: the initial empty state stays while the first run loads', async () => {
    // Break this catches: the start of a run dropping the initial `[]` for undefined, which
    // turns `{{queries.query1.data.length}}` into an error on the first load.
    const pending = heldResponse();
    serveRuns(pending);
    seedQuery();

    const finished = run();

    expect(exposed()).toEqual(expect.objectContaining({ isLoading: true, data: [], rawData: [] }));
    pending.release(FIRST);
    await finished;
    expect(exposed()).toEqual(expect.objectContaining({ isLoading: false, ...firstResult }));
  });

  test('QR-2 rerun start: only isLoading changes; the previous result and error stay', async () => {
    // Break this catches: the run start clearing any result field (or the error), which blanks
    // every component bound to the query for the whole run.
    const pending = heldResponse();
    serveRuns(FIRST, FAILED, pending);
    seedQuery();
    await run();
    await run();
    const before = { ...exposed() };
    expect(before.error).toBeDefined();

    const finished = run();

    expect(exposed()).toEqual({ ...before, isLoading: true });
    pending.release(FIRST);
    await finished;
  });

  test('QR-3 successful refresh: every result field is replaced with the new run', async () => {
    const second = {
      status: 'ok',
      data: [{ name: 'charlie' }],
      metadata: {
        request: { url: 'https://example.test/second' },
        response: { statusCode: 201 },
        responseHeaders: { 'x-run': 'second' },
      },
    };
    serveRuns(FIRST, second);
    seedQuery();
    await run();

    await run();

    expect(exposed()).toEqual(
      expect.objectContaining({
        isLoading: false,
        error: undefined,
        data: [{ name: 'charlie' }],
        rawData: [{ name: 'charlie' }],
        metadata: second.metadata,
        request: { url: 'https://example.test/second' },
        response: { statusCode: 201 },
        responseHeaders: { 'x-run': 'second' },
      })
    );
  });

  test('QR-4 empty success: genuinely empty data replaces the previous rows', async () => {
    // Break this catches: "keep the previous result" implemented as "ignore empty results",
    // which would show stale rows after a filter that matches nothing.
    serveRuns(FIRST, { status: 'ok', data: [], metadata: FIRST.metadata });
    seedQuery();
    await run();

    await run();

    expect(exposed().data).toEqual([]);
    expect(exposed().rawData).toEqual([]);
  });

  test('QR-5 success without metadata: the previous request, response and metadata are cleared', async () => {
    // Break this catches: merging the new result into the old one, so a response without
    // metadata reports the previous run's request and status code as its own.
    serveRuns(FIRST, { status: 'ok', data: [{ name: 'charlie' }] });
    seedQuery();
    await run();

    await run();

    expect(exposed()).toEqual(
      expect.objectContaining({
        data: [{ name: 'charlie' }],
        metadata: undefined,
        request: undefined,
        response: undefined,
        responseHeaders: undefined,
      })
    );
  });

  test('QR-6 failure: data stays, and the failure reports as it did before', async () => {
    // Break this catches: a failure clearing the data (the blank state the run start used to
    // cause), or a change to how a REST API failure reports its request/response and error.
    serveRuns(FIRST, FAILED);
    seedQuery();
    await run();

    await run();

    expect(exposed()).toEqual(
      expect.objectContaining({
        isLoading: false,
        data: FIRST.data,
        rawData: FIRST.data,
        metadata: FAILED.metadata,
        request: { url: 'https://example.test/failed' },
        response: { statusCode: 503 },
        responseHeaders: { 'x-run': 'failed' },
        error: FAILED,
      })
    );
  });

  test('QR-7 transformation failure: data stays and error is populated', async () => {
    serveRuns(FIRST, { status: 'ok', data: { broken: true } });
    seedQuery({
      enableTransformation: true,
      transformationLanguage: 'javascript',
      transformations: { javascript: 'if (data.broken) throw new Error("bad shape"); return data;' },
    });
    await run();

    await run();

    expect(exposed()).toEqual(expect.objectContaining({ isLoading: false, data: FIRST.data, rawData: FIRST.data }));
    // A transformation failure keeps its existing error shape: the message sits under `data`.
    expect(exposed().error).toEqual(
      expect.objectContaining({ status: 'failed', data: expect.objectContaining({ message: 'bad shape' }) })
    );
  });

  test('QR-8 abort: the previous result stays, loading ends and no failure event fires', async () => {
    // Break this catches: an abort blanking the data, or being reported as a query failure.
    const pending = heldResponse();
    serveRuns(FIRST, pending);
    seedQuery();
    s().eventsSlice.setEvents([recordOutcome('onDataQueryFailure', 'failed')], 'canvas');
    await run();

    const finished = run();
    s().queryPanel.abortQuery('q1', 'canvas');

    await expect(finished).resolves.toEqual({ status: 'aborted' });
    expect(exposed()).toEqual(expect.objectContaining({ isLoading: false, ...firstResult }));
    expect(variables().failed).toBeUndefined();
    pending.release(FIRST);
  });

  test('QR-9 explicit reset still clears the result', async () => {
    serveRuns(FIRST, FAILED);
    seedQuery();
    await run();
    await run();

    s().queryPanel.resetQuery('q1', 'canvas');

    expect(exposed()).toEqual({
      isLoading: false,
      id: 'q1',
      data: [],
      rawData: [],
      metadata: undefined,
      request: undefined,
      response: undefined,
      responseHeaders: undefined,
      error: undefined,
    });
  });

  test('QR-10 success and failure events still fire', async () => {
    serveRuns(FIRST, FAILED);
    seedQuery();
    s().eventsSlice.setEvents(
      [recordOutcome('onDataQuerySuccess', 'succeeded'), recordOutcome('onDataQueryFailure', 'failed')],
      'canvas'
    );

    await run();
    await waitFor(() => expect(variables().succeeded).toBe('fired'));
    expect(variables().failed).toBeUndefined();

    await run();
    await waitFor(() => expect(variables().failed).toBe('fired'));
  });

  test('QR-11 a component bound to the data keeps its value while the query reruns', async () => {
    // Break this catches: the run start propagating an empty `data` through the dependency
    // graph, which re-renders every bound component blank until the run settles.
    const pending = heldResponse();
    serveRuns(FIRST, pending);
    seedQuery(
      {},
      {
        components: {
          t1: componentDefinition('t1', 'text1', 'Text', { text: binding('{{queries.query1.data.length}}') }),
        },
      }
    );
    const shownText = () => s().getResolvedComponent('t1')?.properties?.text;
    await run();
    await waitFor(() => expect(shownText()).toBe('2'));

    const finished = run();

    expect(exposed().isLoading).toBe(true);
    expect(shownText()).toBe('2');
    pending.release({ status: 'ok', data: [{ name: 'charlie' }] });
    await finished;
    await waitFor(() => expect(shownText()).toBe('1'));
  });
});
