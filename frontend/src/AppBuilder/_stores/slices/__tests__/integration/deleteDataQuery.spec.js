/**
 * Deleting a query: the dependency graph only forgets the query once the server has accepted the delete.
 *
 * The server can refuse (409 "Used by...", 403). The query then stays in the list, so a component
 * bound to it must keep updating when it runs again. Real composed store + MSW at the HTTP boundary.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

const query = {
  id: 'q1',
  name: 'getCustomer',
  kind: 'library',
  options: { libraryAppId: 'lib-app', libraryQueryId: 'lq1', libraryKind: 'postgresql', libraryVersion: 'latest' },
};

function seedBoundText() {
  state().dataQuery.setQueries([query], 'canvas');
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(['q1'], 'canvas');
  state().setCurrentMode('view', 'canvas');
  useStore.setState({ license: { featureAccess: { queryLibraryEnabled: true } } });
  seedApp({
    t1: componentDefinition('t1', 'text1', 'Text', { text: binding('{{queries.getCustomer.data}}') }),
  });
}

const runReturning = (data) =>
  server.use(
    http.post(`${config.apiUrl}/data-queries/q1/run-library`, () => HttpResponse.json({ status: 'ok', data }))
  );
const refuseDelete = (status, message) =>
  server.use(
    http.delete(`${config.apiUrl}/data-queries/q1/versions/:versionId`, () =>
      HttpResponse.json({ statusCode: status, message }, { status })
    )
  );
const textValue = () => state().getResolvedComponent('t1')?.properties?.text;
const inGraph = () => state().dependencyGraph.modules.canvas.graph.hasNode('queries.q1');
const deleteSettled = () => waitFor(() => expect(state().dataQuery.isDeletingQueryInProcess).toBe(false));

describe('deleteDataQueries', () => {
  it('should keep the query in the dependency graph when the server refuses the delete', async () => {
    seedBoundText();
    runReturning('first');
    await state().queryPanel.runQuery('q1', 'getCustomer', true, 'view');
    expect(textValue()).toBe('first');

    refuseDelete(409, 'Used by 2 apps');
    state().dataQuery.deleteDataQueries('q1');
    await deleteSettled();

    expect(state().dataQuery.queries.modules.canvas.map(({ id }) => id)).toEqual(['q1']);
    expect(inGraph()).toBe(true);

    runReturning('second');
    await state().queryPanel.runQuery('q1', 'getCustomer', true, 'view');
    expect(textValue()).toBe('second');
  });

  it('should remove the query from the dependency graph once the server accepts the delete', async () => {
    seedBoundText();
    expect(inGraph()).toBe(true);
    server.use(
      http.delete(`${config.apiUrl}/data-queries/q1/versions/:versionId`, () => HttpResponse.json({}, { status: 200 }))
    );

    state().dataQuery.deleteDataQueries('q1');
    await deleteSettled();

    expect(state().dataQuery.queries.modules.canvas).toEqual([]);
    expect(inGraph()).toBe(false);
  });
});
