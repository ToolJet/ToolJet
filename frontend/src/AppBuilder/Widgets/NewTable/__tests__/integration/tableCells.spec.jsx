/**
 * Table cells: what every cell of a column shares is worked out once for the column (TableRow.jsx, columnPlan), and
 * the table settings cells read come from one subscription for the table (TableCellSettings.jsx). The cells must come
 * out exactly as when each built them itself: classes in the same order, styles, data-cy, editability and background
 * whether fixed or read from the row, pinned columns, validation.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import { writeFileSync } from 'fs';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { tableConfig } from '@/AppBuilder/WidgetManager/widgets/table';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'table-cells',
  name: 'Table cells of every kind of column',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

const ROWS = [
  { id: 1, name: 'ada', email: 'ada@example.com', city: 'Pune', amount: 10.5, code: 'abc', active: true },
  { id: 2, name: 'grace', email: 'grace@example.com', city: 'Oslo', amount: 20, code: 'AB1', active: false },
  { id: 3, name: 'linus', email: 'linus@example.com', city: 'Lima', amount: 0, code: '', active: true },
  { id: 4, name: 'margaret', email: 'm@example.com', city: 'Rome', amount: -3, code: 'xyz', active: false },
];

const COLUMNS = [
  { id: 'c-id', key: 'id', name: 'id', columnType: 'number', pinPosition: 'left' },
  { id: 'c-name', key: 'name', name: 'name', columnType: 'string', isEditable: '{{true}}' },
  {
    id: 'c-email',
    key: 'email',
    name: 'email',
    columnType: 'string',
    cellBackgroundColor: '#ffeeee',
    horizontalAlignment: 'center',
  },
  {
    id: 'c-city',
    key: 'city',
    name: 'city',
    columnType: 'string',
    isEditable: '{{rowData.id % 2 === 0}}',
    cellBackgroundColor: '{{rowData.id > 2 ? "#eeffee" : ""}}',
  },
  { id: 'c-amount', key: 'amount', name: 'amount', columnType: 'number', horizontalAlignment: 'right' },
  { id: 'c-code', key: 'code', name: 'code', columnType: 'string', isEditable: '{{true}}', regex: '^[a-z]+$' },
  { id: 'c-active', key: 'active', name: 'active', columnType: 'boolean' },
];

let session;

function renderTable() {
  const { definition } = tableConfig;
  const table = componentDefinition('t1', 'table1', 'Table', {
    ...definition.properties,
    data: binding('{{variables.rows}}'),
    columns: { value: COLUMNS },
    autogenerateColumns: { value: false },
    enablePagination: binding('{{false}}'),
  });
  table.component.definition.styles = definition.styles;
  table.component.definition.others = definition.others;
  state().setVariable('rows', ROWS, MODULE_ID);
  seedApp({ t1: table }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('edit', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('t1', 'Table', { currentMode: 'edit' })} />);
}

const cellOf = (row, column) => document.querySelector(`td[data-cy="table1-${column}-row-${row}"]`);

describe('Table cells', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test('each kind of column renders its cells as before', async () => {
    renderTable();
    await drain();
    await waitFor(() => expect(cellOf(3, 'active')).not.toBeNull());

    // Fixed `{{true}}` editability, and editability read from the row.
    expect(cellOf(0, 'name').classList.contains('isEditable')).toBe(true);
    expect(cellOf(0, 'city').classList.contains('isEditable')).toBe(false);
    expect(cellOf(1, 'city').classList.contains('isEditable')).toBe(true);
    expect(cellOf(1, 'city').classList.contains('has-text')).toBe(true);
    // A fixed background, one read from the row, and a pinned column's.
    expect(cellOf(0, 'email').style.backgroundColor).toBe('rgb(255, 238, 238)');
    expect(cellOf(0, 'city').style.backgroundColor).toBe('');
    expect(cellOf(2, 'city').style.backgroundColor).toBe('rgb(238, 255, 238)');
    expect(cellOf(0, 'id').classList.contains('pinned-column-left')).toBe(true);
    expect(cellOf(0, 'id').style.position).toBe('sticky');
    // Alignment and the classes around the cell's own.
    expect(cellOf(0, 'email').className).toMatch(/^table-cell td table-text-align-center /);
    expect(cellOf(0, 'amount').classList.contains('table-text-align-right')).toBe(true);

    // The whole body, for comparing with another build of the cells (TABLE_CELLS_DOM=<file>).
    if (process.env.TABLE_CELLS_DOM) {
      writeFileSync(process.env.TABLE_CELLS_DOM, document.querySelector('.jet-data-table tbody').outerHTML);
    }
  });
});
