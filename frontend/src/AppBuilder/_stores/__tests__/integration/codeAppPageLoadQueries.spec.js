/**
 * A code app's screens run the page-load queries they read when they open (codeAppHooks.ts), so opening the app does
 * not run every query marked to run on load: a detail query with no id would only fail. The host still runs the ones a
 * component on a visual page reads, and every one for a visual app.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { dataqueryService } from '@/_services';
import { addCodeAppReader, markCodeAppRun } from '@/AppBuilder/_helpers/codeAppReaders';

const state = () => useStore.getState();

const query = (id, name) => ({
  id,
  name,
  kind: 'restapi',
  data_source_id: 'ds-1',
  options: { url: `https://example.test/${name}`, runOnPageLoad: true },
});
const list = query('q-list', 'orders_page');
const detail = query('q-detail', 'order_detail');

const setup = (buildMode) => {
  seedApp({});
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1', buildMode });
  useStore.setState((s) => {
    s.currentVersionId = 'version-1';
  });
  state().dataQuery.setQueries([list, detail], 'canvas');
  state().setQueryMapping('canvas');
  jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: [] });
};

afterEach(() => jest.restoreAllMocks());

const ran = () => dataqueryService.run.mock.calls.map((call) => call[0]);

test('a code app runs no page-load query on open that nothing on a visual page reads', async () => {
  setup('code');
  await state().dataQuery.runOnLoadQueries('canvas', [list, detail]);
  expect(dataqueryService.run).not.toHaveBeenCalled();
});

test('a code app re-runs, on a later call, the page-load result an open screen shows', async () => {
  setup('code');
  const release = addCodeAppReader('canvas', list.id);
  markCodeAppRun('canvas', list.id);
  await new Promise((resolve) => setTimeout(resolve, 5));
  await state().dataQuery.runOnLoadQueries('canvas', [list, detail]);
  release();
  expect(ran()).toEqual([list.id]);
});

test('a visual app runs every page-load query, as before', async () => {
  setup('visual');
  await state().dataQuery.runOnLoadQueries('canvas', [list, detail]);
  expect(ran().sort()).toEqual([detail.id, list.id].sort());
});
