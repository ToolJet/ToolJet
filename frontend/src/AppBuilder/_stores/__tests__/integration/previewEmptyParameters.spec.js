/**
 * Preview runs a query on its own, with its parameters' default values. The store records which declared parameters
 * ran empty, and Preview names them, so a 0 from `status ilike {{parameters.status}}` is not read as lost data.
 * Query semantics stay as they were: the same defaults are sent.
 *
 * Also: "Create a query" on a blank app expands a query panel that was folded for the visit while the remembered
 * preference is still "open".
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { dataqueryService } from '@/_services';

const state = () => useStore.getState();

const countQuery = {
  id: 'q-count',
  name: 'expenses_count',
  kind: 'restapi',
  options: {
    url: 'https://example.test/count?status={{parameters.status}}&month={{parameters.month}}',
    parameters: [
      { name: 'status', defaultValue: '' },
      { name: 'month', defaultValue: '2026-11' },
    ],
  },
};

beforeEach(() => {
  seedApp({});
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  state().dataQuery.setQueries([countQuery], 'canvas');
  state().setQueryMapping('canvas');
  jest.spyOn(dataqueryService, 'preview').mockResolvedValue({ status: 'ok', data: [{ count: 0 }] });
});

afterEach(() => jest.restoreAllMocks());

test('a Preview with an empty default names that parameter, and sends the defaults as before', async () => {
  await state().queryPanel.previewQuery(countQuery, false, undefined, 'canvas');
  expect(state().queryPanel.previewEmptyParameters).toEqual(['status']);
  // The resolved variables sent with the query: the empty default is still sent as empty.
  const variables = dataqueryService.preview.mock.calls[0][1];
  expect(variables['{{parameters.status}}']).toBe('');
  expect(variables['{{parameters.month}}']).toBe('2026-11');
});

test('a Preview where every parameter has a value names none', async () => {
  const withValues = {
    ...countQuery,
    options: { ...countQuery.options, parameters: [{ name: 'status', defaultValue: 'open' }] },
  };
  await state().queryPanel.previewQuery(withValues, false, undefined, 'canvas');
  expect(state().queryPanel.previewEmptyParameters).toEqual([]);
});

test('expandQueryPaneIfNeeded opens a panel folded in the store while the preference says open', () => {
  localStorage.setItem('queryManagerPreferences', JSON.stringify({ isExpanded: true, queryPanelHeight: 55 }));
  state().queryPanel.setIsQueryPaneExpanded(false);
  expect(state().queryPanel.expandQueryPaneIfNeeded()).toBe(true);
  expect(state().queryPanel.isQueryPaneExpanded).toBe(true);
  // The remembered height is the user's; it is not reset to the default.
  expect(JSON.parse(localStorage.getItem('queryManagerPreferences')).queryPanelHeight).toBe(55);
  expect(state().queryPanel.expandQueryPaneIfNeeded()).toBe(false);
});
