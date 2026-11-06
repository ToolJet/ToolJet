beforeEach(() => {
  useStore.setState((state) => ({
    license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
  }));
});
import '@/test/setupMsw';
import React from 'react';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';
import DataSourcePicker from '../../DataSourcePicker';

const queryId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const draftId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const savedId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const sourceId = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
let requests;
let originalSession;
beforeEach(() => {
  originalSession = authenticationService.currentSessionValue;
  authenticationService.updateCurrentSession({ ...originalSession, current_organization_id: 'workspace-a' });
  window.public_config = { TOOLJET_EDITION: 'ee' };
  const state = useStore.getState();
  state.queryLibrary.endLibrarySession();
  state.setApp({ ...state.appStore.modules.canvas.app, appId: 'app1', organizationId: 'workspace-a' });
  state.setCurrentVersionId('version1');
  useStore.setState({ selectedEnvironment: { id: 'development' } });
  requests = [];
  server.use(
    http.get(`${config.apiUrl}/query-library/static-data-sources`, () =>
      HttpResponse.json([{ id: 'runjs-id', kind: 'runjs', type: 'static' }])
    ),
    http.get(`${config.apiUrl}/data-sources/:workspace/environments/:environment/versions/:version`, () =>
      HttpResponse.json({ data_sources: [{ id: sourceId, kind: 'library', type: 'static' }] })
    ),
    http.get(`${config.apiUrl}/query-library/catalog`, () =>
      HttpResponse.json({
        queries: [
          {
            id: queryId,
            name: 'Customer lookup',
            versions: [{ id: savedId, name: 'Stable', kind: 'runjs', inputs: [] }],
            drafts: [{ id: draftId, name: 'Experiment', kind: 'runjs', inputs: [] }],
          },
        ],
      })
    ),
    http.post(`${config.apiUrl}/data-queries/data-sources/:source/versions/:version`, async ({ request }) => {
      const body = await request.json();
      requests.push(body);
      return HttpResponse.json({ ...body, id: 'consumer-id' }, { status: 201 });
    })
  );
});
afterEach(() => {
  authenticationService.updateCurrentSession(originalSession);
  delete window.public_config;
});
const open = async () => {
  render(<DataSourcePicker darkMode={false} />);
  await userEvent.click(document.querySelector('[data-cy="library-add-query-card"]'));
};
it.each([
  ['Stable', savedId],
  ['Experiment · Draft (testing only)', draftId],
])('creates only after choosing the explicit %s pin', async (label, pin) => {
  await open();
  expect(requests).toEqual([]);
  expect(useStore.getState().dataQuery.queries.modules.canvas).toEqual([]);
  await userEvent.click(await screen.findByText('Select a query'));
  await userEvent.click(await screen.findByRole('option', { name: 'Customer lookup' }));
  if (pin === draftId) {
    await userEvent.click(await screen.findByText('Stable'));
    await userEvent.click(await screen.findByRole('option', { name: label }));
  }
  expect(requests).toEqual([]);
  await userEvent.click(screen.getByRole('button', { name: 'Create query' }));
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0].data_source_id).toBe(sourceId);
  expect(requests[0].options).toMatchObject({
    libraryQueryId: queryId,
    libraryQueryVersionId: pin,
    libraryKind: 'runjs',
    inputs: {},
  });
  expect(requests[0].options).not.toHaveProperty('libraryVersion');
  await waitFor(() => expect(useStore.getState().queryPanel.selectedQuery.id).toBe('consumer-id'));
});
it('cancels without persisting a provisional query', async () => {
  await open();
  await screen.findByText('Select a query');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(requests).toEqual([]);
  expect(useStore.getState().dataQuery.queries.modules.canvas).toEqual([]);
  expect(document.querySelector('[data-cy="library-add-query-card"]')).toBeInTheDocument();
});
it('keeps creation disabled for an empty catalog', async () => {
  server.use(http.get(`${config.apiUrl}/query-library/catalog`, () => HttpResponse.json({ queries: [] })));
  await open();
  await screen.findByText('No queries in the query library yet');
  expect(screen.getByRole('button', { name: 'Create query' })).toBeDisabled();
  expect(requests).toEqual([]);
});

it('waits for an authorized Library source ID when the app source list has not supplied one', async () => {
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  server.use(
    http.get(`${config.apiUrl}/data-sources/:workspace/environments/:environment/versions/:version`, async () => {
      await pending;
      return HttpResponse.json({ data_sources: [{ id: sourceId, kind: 'library', type: 'static' }] });
    })
  );
  await open();
  await userEvent.click(await screen.findByText('Select a query'));
  await userEvent.click(await screen.findByRole('option', { name: 'Customer lookup' }));
  const disabledBeforeSource = screen.getByRole('button', { name: 'Create query' }).disabled;
  finish();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create query' })).toBeEnabled());
  await userEvent.click(screen.getByRole('button', { name: 'Create query' }));
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(disabledBeforeSource).toBe(true);
  expect(requests[0].data_source_id).toBe(sourceId);
});

it('blocks creation when the authorized source becomes unavailable before confirmation', async () => {
  await open();
  await userEvent.click(await screen.findByText('Select a query'));
  await userEvent.click(await screen.findByRole('option', { name: 'Customer lookup' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create query' })).toBeEnabled());
  server.use(
    http.get(`${config.apiUrl}/data-sources/:workspace/environments/:environment/versions/:version`, () =>
      HttpResponse.json({ data_sources: [] })
    )
  );
  await userEvent.click(screen.getByRole('button', { name: 'Create query' }));
  await screen.findByRole('alert');
  expect(requests).toEqual([]);
  expect(screen.getByRole('button', { name: 'Create query' })).toBeDisabled();
});
