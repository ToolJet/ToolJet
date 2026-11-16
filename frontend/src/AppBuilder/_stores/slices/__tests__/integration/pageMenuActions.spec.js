/**
 * Page actions behind the page configuration panel and the page row menu: hide, disable, mark as
 * home, delete. Each one must change the page in the editor and send the matching save.
 */
import '@/test/setupMsw';
import { act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { drainExposedValueBatch } from '@/test/app-builder';

const VERSION_URL = 'http://localhost:3000/api/v2/apps/app-1/versions/version-1';
const state = () => useStore.getState();
const page = (id) => state().modules.canvas.pages.find((item) => item.id === id);
const hop = () => new Promise((resolve) => setTimeout(resolve, 0));
const settle = async () => {
  for (let i = 0; i < 5; i++) await hop();
};

let saves;

beforeEach(() => {
  saves = [];
  const record =
    (method) =>
    async ({ request }) => {
      saves.push({
        method,
        path: new URL(request.url).pathname.split('/versions/version-1')[1],
        body: await request.json(),
      });
      return HttpResponse.json({});
    };
  server.use(
    http.put(`${VERSION_URL}/pages`, record('PUT')),
    http.delete(`${VERSION_URL}/pages`, record('DELETE')),
    http.put(`${VERSION_URL}/`, record('PUT'))
  );
  const s = state();
  s.initializeDependencySlice('canvas');
  s.setPages(
    [
      { id: 'home-1', handle: 'home', name: 'Home', components: {} },
      { id: 'second-1', handle: 'second', name: 'Second', components: {} },
    ],
    'canvas'
  );
  s.setCurrentPageId('home-1', 'canvas');
  s.setComponentNameIdMapping('canvas');
  s.initDependencyGraph('canvas');
  s.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'home-1', slug: 'slug-app-1' }, 'canvas');
  s.setCurrentVersionId('version-1');
});

afterEach(() => drainExposedValueBatch());

test('hiding a page marks it hidden and saves the change', async () => {
  await act(async () => {
    state().updatePageVisibility('second-1', { value: true });
    await settle();
  });

  expect(page('second-1').hidden).toEqual({ value: true });
  expect(saves).toEqual([
    {
      method: 'PUT',
      path: '/pages',
      body: expect.objectContaining({ pageId: 'second-1', diff: { hidden: { value: true } } }),
    },
  ]);
});

test('disabling a page marks it disabled and saves the change', async () => {
  await act(async () => {
    state().disableOrEnablePage('second-1', true);
    await settle();
  });

  expect(page('second-1').disabled).toBe(true);
  expect(saves).toEqual([
    { method: 'PUT', path: '/pages', body: expect.objectContaining({ pageId: 'second-1', diff: { disabled: true } }) },
  ]);
});

test('marking a page as home changes the home page and saves it', async () => {
  act(() => state().setEditingPage(page('second-1')));

  await act(async () => {
    await state().markAsHomePage('second-1');
  });

  expect(state().getHomePageId('canvas')).toBe('second-1');
  expect(saves).toHaveLength(1);
  expect(saves[0].body).toEqual(expect.objectContaining({ homePageId: 'second-1' }));
});

test('deleting a page removes it and saves the deletion', async () => {
  await act(async () => {
    await state().deletePage('second-1');
  });

  expect(page('second-1')).toBeUndefined();
  expect(saves).toEqual([{ method: 'DELETE', path: '/pages', body: expect.objectContaining({ pageId: 'second-1' }) }]);
});

test('the only page of an app cannot be deleted', async () => {
  await act(async () => {
    await state().deletePage('second-1');
  });
  saves = [];

  await act(async () => {
    await state().deletePage('home-1');
  });

  expect(page('home-1')).toBeDefined();
  expect(saves).toEqual([]);
});
