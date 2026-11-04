/**
 * Choosing Query library from the query panel's Plus menu in an app. Real store; MSW at the HTTP boundary.
 */
import '@/test/setupMsw';
import React from 'react';
import { act, render, userEvent } from '@/test/test-utils';
import { VirtuosoMockContext } from 'react-virtuoso';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import DataSourceSelect from '../../DataSourceSelect';
import DataSourcePicker from '../../DataSourcePicker';

// External icon package adapter: the shared lucide stub in __mocks__ can't render icons from this lucide version.
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));

const libraryStaticId = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
let creates;
beforeEach(() => {
  const state = useStore.getState();
  state.queryLibrary.endLibrarySession();
  state.setApp({ ...state.appStore.modules.canvas.app, appId: 'app1', appType: 'front-end' }, 'canvas');
  state.setCurrentVersionId('version1');
  useStore.setState((s) => ({
    license: { featureAccess: { ...s.license.featureAccess, queryLibraryEnabled: true } },
    globalDataSources: [
      { id: 'rest-static', kind: 'restapi', name: 'restapidefault', type: 'static' },
      { id: libraryStaticId, kind: 'library', name: 'librarydefault', type: 'static' },
    ],
  }));
  creates = [];
  server.use(
    http.get(`${config.apiUrl}/data-sources/:workspace/environments/:environment/versions/:version`, () =>
      HttpResponse.json({ data_sources: [{ id: libraryStaticId, kind: 'library', type: 'static' }] })
    ),
    http.get(`${config.apiUrl}/query-library/catalog`, () => HttpResponse.json({ queries: [] })),
    // Mirrors server/src/modules/query-library/locking.ts: a library consumer needs both pins.
    http.post(`${config.apiUrl}/data-queries/data-sources/:source/versions/:version`, async ({ request }) => {
      const body = await request.json();
      creates.push(body);
      if (body.kind === 'library' && !body.options?.libraryQueryId)
        return HttpResponse.json(
          { statusCode: 400, message: 'A library query ID is required', error: 'Bad Request' },
          { status: 400 }
        );
      if (body.kind === 'library' && !body.options?.libraryQueryVersionId)
        return HttpResponse.json(
          { statusCode: 400, message: 'A library query version ID is required', error: 'Bad Request' },
          { status: 400 }
        );
      return HttpResponse.json({ ...body, id: 'created-id' }, { status: 201 });
    })
  );
});

// F02: DataSourceSelect.jsx:83-99 calls createDataQuery(librarySource, ...) with options {inputs:{}} and no
// libraryQueryId/libraryQueryVersionId; the body card (DataSourcePicker.jsx:70-78,199-207) stages the choice instead.
it('does not create a library consumer without a query and version when picked from the Plus menu', async () => {
  // The query panel body shows DataSourcePicker while no query is selected.
  render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 32 }}>
      <DataSourceSelect closePopup={jest.fn()} />
      <DataSourcePicker darkMode={false} />
    </VirtuosoMockContext.Provider>
  );
  expect(document.querySelector('[data-cy="library-consumer-picker"]')).toBeNull();

  await userEvent.click(document.querySelector('[data-cy="ds-librarydefault"]'));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  expect(
    creates.filter(
      (body) => body.kind === 'library' && !(body.options?.libraryQueryId && body.options?.libraryQueryVersionId)
    )
  ).toEqual([]);
  // Routed into the body card's staged query/version selection instead.
  expect(useStore.getState().queryPanel.selectedQuery).toBeNull();
  expect(document.querySelector('[data-cy="library-consumer-picker"]')).not.toBeNull();
});

// Component and folder "Add query" menus pass onQueryCreate and can't wait for the staged picker, so they omit Query library.
it('omits Query library from callback-driven Add query menus', () => {
  render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 32 }}>
      <DataSourceSelect closePopup={jest.fn()} onQueryCreate={jest.fn()} />
    </VirtuosoMockContext.Provider>
  );
  expect(document.querySelector('[data-cy="ds-restapidefault"]')).not.toBeNull();
  expect(document.querySelector('[data-cy="ds-librarydefault"]')).toBeNull();
});
