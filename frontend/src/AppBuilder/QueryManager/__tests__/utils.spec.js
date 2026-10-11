/**
 * @jest-environment node
 */

const {
  resolveQueryEditor,
  resolveNamedQueryParameters,
  normalizeQueryDefaults,
  changeQueryOperation,
  getQueryInputValue,
} = require('@/AppBuilder/QueryManager/utils');

describe('query editor input values', () => {
  test('passes an explicit empty string to the editor when an operation clears Parameters JSON', () => {
    const schema = require('../../../../../marketplace/plugins/gitlab/lib/operations.json');
    const updated = changeQueryOperation(
      schema,
      { operation: 'list_projects', parameters: '{"page":2}' },
      'list_users'
    );
    expect(getQueryInputValue(updated.parameters, undefined)).toBe('');
  });

  test('uses the schema initial value only when the option is absent', () => {
    expect(getQueryInputValue(undefined, '{}')).toBe('{}');
    expect(getQueryInputValue({ page: 2 }, '{}')).toBe('{"page":2}');
  });
});

describe('GitLab operation changes', () => {
  const schema = require('../../../../../marketplace/plugins/gitlab/lib/operations.json');
  const options = {
    operation: 'create_issue',
    project_id: 'team/project',
    title: 'Old title',
    parameters: '{"state":"opened"}',
    body: '{"labels":"bug"}',
    query_timeout: 10000,
    enableTransformation: true,
  };

  test('clears operation inputs, including shared and hidden fields, but keeps query settings', () => {
    const updated = changeQueryOperation(schema, options, 'get_project');
    expect(updated.operation).toBe('get_project');
    for (const key of ['project_id', 'title', 'parameters', 'body']) expect(updated[key]).toBe('');
    expect(updated.query_timeout).toBe(10000);
    expect(updated.enableTransformation).toBe(true);
    expect(options.title).toBe('Old title');
  });

  test('selecting the same operation preserves entered values', () => {
    expect(changeQueryOperation(schema, options, 'create_issue')).toEqual(options);
  });
});

describe('query operation defaults', () => {
  const schema = {
    defaults: { operation: { value: 'list_projects' } },
    properties: { operation: { type: 'dropdown-component-flip' } },
  };

  test('initializes a runnable operation from a legacy installed plugin schema', () => {
    expect(normalizeQueryDefaults(schema)).toEqual({ operation: 'list_projects' });
    expect(schema.defaults.operation).toEqual({ value: 'list_projects' });
  });

  test('repairs saved wrapped selections while preserving JSON request options', () => {
    expect(
      normalizeQueryDefaults(schema, { operation: { value: 'list_projects' }, parameters: '{invalid JSON' })
    ).toEqual({ operation: 'list_projects', parameters: '{invalid JSON' });
  });

  test('preserves explicitly selected operations', () => {
    expect(normalizeQueryDefaults(schema, { operation: 'list_users' })).toEqual({ operation: 'list_users' });
  });
});

describe('named query parameters used by the editor and query execution', () => {
  test.each(['{"membership":true}', '{invalid JSON', { membership: true }, null, undefined])(
    'preserves plugin request parameters without trying to resolve them as named inputs: %p',
    (parameters) => {
      const resolveValue = jest.fn();
      expect(resolveNamedQueryParameters(parameters, resolveValue)).toEqual({});
      expect(resolveValue).not.toHaveBeenCalled();
    }
  );

  test('resolves defaults for named inputs', () => {
    expect(resolveNamedQueryParameters([{ name: 'page', defaultValue: '{{1 + 1}}' }], () => 2)).toEqual({ page: 2 });
  });
});

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
