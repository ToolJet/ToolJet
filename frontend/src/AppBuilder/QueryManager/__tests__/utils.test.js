/**
 * @jest-environment node
 */

const { resolveQueryEditor } = require('@/AppBuilder/QueryManager/utils');

// A query as the server actually returns it. `data_queries` has no plugin_id column and
// neither serializer emits one, so the plugin binding is reachable only via the data source.
const existingMarketplaceQuery = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  name: 'getAccounts',
  kind: 'xero',
  data_source_id: 'ab9a0fc9-d989-4dd3-ae05-2162aed92409',
  options: {},
};

const marketplaceDataSource = {
  id: 'ab9a0fc9-d989-4dd3-ae05-2162aed92409',
  kind: 'xero',
  plugin_id: 'xero',
  plugin: { operations_file: { data: { properties: {} } } },
};

describe('resolveQueryEditor', () => {
  // The defect: after a reload the query carries no plugin_id, so routing on it fell through to
  // allSources['Xero'] — undefined, because marketplace kinds are not in the client-side built-in
  // bundle — and the editor body rendered nothing.
  test('picks the plugin editor for an existing marketplace-plugin query', () => {
    expect(
      resolveQueryEditor({
        selectedDataSource: marketplaceDataSource,
        selectedQuery: existingMarketplaceQuery,
      })
    ).toEqual({ type: 'plugin' });
  });

  // Guard: routing must not regress to the query's plugin_id. Restoring `selectedQuery?.plugin_id`
  // would still pass the test above (the store fakes plugin_id on create) but fail this one.
  test('picks the plugin editor for a marketplace query created in-session', () => {
    const optimisticQuery = {
      ...existingMarketplaceQuery,
      plugin_id: 'xero',
      plugin: marketplaceDataSource.plugin,
    };
    expect(
      resolveQueryEditor({
        selectedDataSource: marketplaceDataSource,
        selectedQuery: optimisticQuery,
      })
    ).toEqual({
      type: 'plugin',
    });
  });

  // Guard: built-ins have no plugin_id, so they must keep routing to the bundled editor.
  // Returning { type: 'plugin' } unconditionally, or capitalising differently, fails this.
  test('picks the built-in editor, capitalised, for a built-in data source', () => {
    expect(
      resolveQueryEditor({
        selectedDataSource: { id: 'ds-pg', kind: 'postgresql' },
        selectedQuery: {
          id: 'q2',
          kind: 'postgresql',
          data_source_id: 'ds-pg',
        },
      })
    ).toEqual({ type: 'builtin', componentName: 'Postgresql' });
  });

  // Guard: defaultSources stubs are { kind, id, name } only — no plugin_id — and must stay built-in.
  test('picks the built-in editor for a default-source stub', () => {
    expect(
      resolveQueryEditor({
        selectedDataSource: {
          kind: 'runjs',
          id: 'runjs',
          name: 'Run JavaScript code',
        },
        selectedQuery: { id: 'q3', kind: 'runjs', data_source_id: 'runjs' },
      })
    ).toEqual({ type: 'builtin', componentName: 'Runjs' });
  });

  // Guard: resolveDataSourceForQuery returns null when the data source is not in the loaded lists
  // (RBAC-filtered, or the frame before the lists land). Reading kind from the data source instead
  // of the query yields `undefined + undefined` → NaN → allSources[NaN] → a blank editor.
  test('falls back to the query kind when the data source has not resolved', () => {
    expect(
      resolveQueryEditor({
        selectedDataSource: null,
        selectedQuery: {
          id: 'q4',
          kind: 'postgresql',
          data_source_id: 'ds-pg',
        },
      })
    ).toEqual({ type: 'builtin', componentName: 'Postgresql' });
  });

  // Guard: a dummy data source must render nothing — mounting an editor over stub options crashes.
  test('renders no editor for a dummy data source', () => {
    expect(
      resolveQueryEditor({
        selectedDataSource: { ...marketplaceDataSource, is_dummy: true },
        selectedQuery: existingMarketplaceQuery,
      })
    ).toEqual({ type: 'none' });
  });
});
