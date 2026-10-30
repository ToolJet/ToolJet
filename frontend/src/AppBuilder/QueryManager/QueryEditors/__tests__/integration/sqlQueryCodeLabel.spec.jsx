/**
 * A SQL query (PostgreSQL first, then every SQL data source) gets the same code box treatment as RunJS / RunPython: a "Code" label
 * with the open-in-new-tab button at its right, and no "pop out code editor" popup on the SQL box.
 */
import React from 'react';
import { act, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import DynamicForm from '@/_components/DynamicForm';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { buildQuery } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

// Icon adapter only (external package): the shared lucide mock crashes any ui/Button with an icon.
jest.mock('lucide-react/dynamic.mjs', () => ({ __esModule: true, DynamicIcon: () => null, iconNames: [] }));

const controls = createAppBuilderControls();

// Trimmed copy of plugins/packages/postgresql/lib/operations.json: Jest doesn't load the plugins package.
const postgresSchema = {
  defaults: { mode: 'sql' },
  properties: {
    mode: {
      key: 'mode',
      type: 'dropdown-component-flip',
      list: [
        { name: 'SQL mode', value: 'sql' },
        { name: 'GUI mode', value: 'gui' },
      ],
    },
    sql: {
      query: {
        key: 'query',
        type: 'codehinter',
        description: 'Enter query',
        height: '150px',
        editorType: 'multiline',
        placeholder: 'SELECT * FROM users',
      },
    },
    gui: {
      table: { key: 'table', label: 'Table', type: 'codehinter', editorType: 'basic' },
    },
  },
};
const postgres = { id: 'ds-pg', kind: 'postgresql', name: 'postgres', options: {} };
const query = buildQuery({
  id: 'q-pg',
  name: 'pgQuery',
  kind: 'postgresql',
  options: { mode: 'sql', query: 'SELECT 1' },
});

const renderPostgres = (options) =>
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <DynamicForm
        schema={postgresSchema}
        layout="horizontal"
        selectedDataSource={postgres}
        options={options}
        optionsChanged={() => {}}
        optionchanged={() => {}}
        queryName="pgQuery"
        isEditMode
      />
    </ModuleProvider>
  );

beforeEach(() => {
  controls.observers.install();
  act(() => {
    useStore.setState((state) => {
      state.dataQuery.queries.modules.canvas = [query];
    });
    useStore.getState().queryPanel.setSelectedQuery('q-pg');
  });
});
afterEach(() => controls.restore());

test('labels the SQL box "Code" with the open-in-new-tab button at its right', () => {
  renderPostgres({ mode: 'sql', query: 'SELECT 1' });

  const label = screen.getByText('Code');
  expect(label).toHaveAttribute('data-cy', 'query-code-label');
  const row = label.parentElement;
  expect(row).toContainElement(document.querySelector('[data-cy="query-open-code-editor-tab"]'));
  expect(row).toHaveClass('tw-justify-between');

  // The row sits directly above the SQL box.
  expect(row.nextElementSibling).toContainElement(document.querySelector('.cm-editor'));
});

test('drops the popup editor from the SQL box', () => {
  const { container } = renderPostgres({ mode: 'sql', query: 'SELECT 1' });

  expect(container.querySelector('.cm-editor')).toBeInTheDocument();
  expect(container.querySelector('.codehinter-popup-icon')).toBeNull();
});

test('GUI mode has no SQL box, so no Code label', () => {
  renderPostgres({ mode: 'gui', table: 'users' });

  expect(screen.queryByText('Code')).toBeNull();
  expect(document.querySelector('[data-cy="query-open-code-editor-tab"]')).toBeNull();
});

// Every SQL data source's query box, as its plugin manifest declares it (kind, option key, editor type and
// the field's own label, if any). The big block and the auto-growing / one-line boxes all get the label.
const SQL_CODE_FIELDS = [
  ['mysql', 'query', 'multiline'],
  ['mariadb', 'query', 'multiline'],
  ['mssql', 'query', 'multiline'],
  ['oracledb', 'query', 'multiline'],
  ['snowflake', 'query', 'multiline'],
  ['databricks', 'sql_query', 'multiline'],
  ['ibmdb', 'query', 'multiline'],
  ['saphana', 'query', 'multiline'],
  ['bigquery', 'query', 'multiline'],
  ['spanner', 'sql', 'multiline', 'SQL query'],
  ['clickhouse', 'query', 'extendedSingleLine'],
  ['athena', 'query', 'extendedSingleLine'],
  ['awsredshift', 'sql_query', 'extendedSingleLine'],
  ['Presto', 'presto_sql_query', 'extendedSingleLine'],
  ['harperdb', 'sql_query', 'extendedSingleLine'],
  ['couchbase', 'query', 'extendedSingleLine', 'SQL++ Query'],
  ['salesforce', 'soql_query', 'basic', 'Query'],
];

describe.each(SQL_CODE_FIELDS)('%s', (kind, key, editorType, ownLabel) => {
  const dataSource = { id: `ds-${kind}`, kind, name: kind, options: {} };
  const schema = { properties: { [key]: { key, type: 'codehinter', editorType, label: ownLabel } } };

  const renderForm = () => {
    act(() => {
      useStore.setState((state) => {
        state.dataQuery.queries.modules.canvas = [
          buildQuery({ id: 'q-sql', name: 'sqlQuery', kind, options: { [key]: 'SELECT 1' } }),
        ];
      });
      useStore.getState().queryPanel.setSelectedQuery('q-sql');
    });
    return render(
      <ModuleProvider moduleId="canvas" isModuleMode={false}>
        <DynamicForm
          schema={schema}
          layout="horizontal"
          selectedDataSource={dataSource}
          options={{ [key]: 'SELECT 1' }}
          optionsChanged={() => {}}
          optionchanged={() => {}}
          queryName="sqlQuery"
          isEditMode
        />
      </ModuleProvider>
    );
  };

  test('labels the query box "Code" with the open-in-new-tab button, without a popup editor', () => {
    const { container } = renderForm();

    const label = screen.getByText('Code');
    expect(label.parentElement).toContainElement(document.querySelector('[data-cy="query-open-code-editor-tab"]'));
    expect(container.querySelector('.cm-editor')).toBeInTheDocument();
    expect(container.querySelector('.codehinter-popup-icon')).toBeNull();
    // "Code" replaces the field's own label.
    if (ownLabel) expect(screen.queryByText(ownLabel)).toBeNull();
  });
});

test('other code boxes of a SQL data source keep their popup editor and get no Code label', () => {
  const schema = {
    properties: {
      query_params: { key: 'query_params', type: 'codehinter', editorType: 'extendedSingleLine', label: 'Params' },
    },
  };
  const { container } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <DynamicForm
        schema={schema}
        layout="horizontal"
        selectedDataSource={postgres}
        options={{ query_params: '{}' }}
        optionsChanged={() => {}}
        optionchanged={() => {}}
        queryName="pgQuery"
        isEditMode
      />
    </ModuleProvider>
  );

  expect(screen.queryByText('Code')).toBeNull();
  expect(screen.getByText('Params')).toBeInTheDocument();
  expect(container.querySelector('.codehinter-popup-icon')).toBeInTheDocument();
});
