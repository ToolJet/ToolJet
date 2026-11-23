/**
 * An on-load query that asks for confirmation queues a popup. If the popup is still unanswered when the page's
 * on-load queries run again (the person leaves the page and comes back), the query must stay waiting for an answer:
 * it must not run, and it must not be queued twice.
 *
 * NO MOCKS. The observable is the real store side effect of runQuery: it writes `{ isLoading: true }` into
 * exposedValues.queries[id] when the query starts executing.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();

const didRun = (queryId = 'q1') =>
  state().resolvedStore.modules.canvas.exposedValues.queries?.[queryId]?.isLoading === true;

const queued = () => state().dataQuery.queryConfirmationList.map((q) => q.queryId);

const runOnLoad = (confirmed) =>
  state().queryPanel.runQuery('q1', 'loadOrders', confirmed, 'view', {}, undefined, undefined, false, true);

describe('a confirmation popup that is still unanswered when the page is revisited', () => {
  beforeEach(() => {
    const query = {
      id: 'q1',
      name: 'loadOrders',
      kind: 'restapi',
      options: { url: 'https://example.test/orders', requestConfirmation: true },
    };
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });
    state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
    state().dataQuery.setQueries([query], 'canvas');
    state().setQueryMapping('canvas');
    useStore.setState((s) => ({ dataQuery: { ...s.dataQuery, queryConfirmationList: [] } }));
  });

  // Break this catches: the second on-load run finds the query already queued, skips the queueing, and falls through
  // to run it without an answer.
  it('keeps the query waiting instead of running it', () => {
    runOnLoad(undefined);
    expect(queued()).toEqual(['q1']);

    runOnLoad(undefined);

    expect(didRun()).toBe(false);
    expect(queued()).toEqual(['q1']);
  });

  // Break this catches: answering Yes no longer running the query.
  it('still runs the query once it is confirmed', () => {
    runOnLoad(undefined);

    runOnLoad(true);

    expect(didRun()).toBe(true);
  });
});
