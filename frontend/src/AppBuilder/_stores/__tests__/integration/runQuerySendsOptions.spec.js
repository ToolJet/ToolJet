/**
 * The server saves the options a query run sends (an authoring convenience of the query panel). A run from anywhere
 * else (page load, an event, a component, a code page's run()) carries this editor's copy of the query, which can be
 * older than the stored one when an AI turn or another tab changed the query: sending it silently put the old query
 * back. Only a run from the query panel sends the options; every run still sends its resolved values.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { dataqueryService } from '@/_services';

const state = () => useStore.getState();

const pageQuery = {
  id: 'q-page',
  name: 'expenses_page',
  kind: 'restapi',
  options: {
    url: 'https://example.test/expenses?status={{parameters.status}}',
    parameters: [{ name: 'status', defaultValue: '' }],
  },
};

beforeEach(() => {
  seedApp({});
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1', buildMode: 'code' });
  useStore.setState((s) => {
    s.currentVersionId = 'version-1';
  });
  state().dataQuery.setQueries([pageQuery], 'canvas');
  state().setQueryMapping('canvas');
  jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: [] });
});

afterEach(() => jest.restoreAllMocks());

const sentOptions = () => dataqueryService.run.mock.calls[0][2];
const sentResolved = () => dataqueryService.run.mock.calls[0][1];

test('in an app built in code, a page-load, event or code run sends no options, so the stored query is left as it is', async () => {
  await state().queryPanel.runQuery(pageQuery.id, pageQuery.name, undefined, 'edit', { status: 'open' });
  expect(dataqueryService.run).toHaveBeenCalledTimes(1);
  expect(sentOptions()).toBeUndefined();
  expect(sentResolved()['{{parameters.status}}']).toBe('open');
});

test('a run from the query panel still sends the options it shows', async () => {
  await state().queryPanel.runQuery(pageQuery.id, pageQuery.name, undefined, 'edit', {}, true, undefined, true);
  expect(dataqueryService.run).toHaveBeenCalledTimes(1);
  expect(sentOptions()).toEqual(pageQuery.options);
});

test('a visual app keeps sending its options on every run, as before', async () => {
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1', buildMode: 'visual' });
  await state().queryPanel.runQuery(pageQuery.id, pageQuery.name, undefined, 'edit', { status: 'open' });
  expect(dataqueryService.run).toHaveBeenCalledTimes(1);
  expect(sentOptions()).toEqual(pageQuery.options);
});
