/**
 * The table toolbar's "Refresh data" button (ControlButtons.jsx, via
 * useTableRefresh's handleRefresh) was never exposed as a component action, so
 * there is no `{{components.table1.refreshTable()}}`. This pins that gap down
 * at the runtime-exposure level (schema-level gap is covered separately in
 * WidgetManager/widgets/__tests__/table.spec.js).
 *
 * TableExposedVariables returns null (no DOM), so it's mounted directly here
 * with a REAL tanstack table instance (via the real useTable hook) and the
 * same setExposedVariables/fireEvent wrappers RenderWidget.jsx passes to every
 * widget, instead of mocking the widget's own logic.
 */
import React from 'react';
import { render, renderHook } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useTable } from '@/AppBuilder/Widgets/NewTable/_hooks/useTable';
import { TableExposedVariables } from '@/AppBuilder/Widgets/NewTable/_components/TableExposedVariables/TableExposedVariables';
import { seedApp, componentDefinition, drainExposedValueBatch } from '@/test/app-builder';

const state = () => useStore.getState();

const ROWS = [{ id: 1, name: 'Ada' }];
const COLUMNS = [{ id: 'name', accessorKey: 'name', header: 'Name' }];

function mountExposedVariables() {
  seedApp({ t1: componentDefinition('t1', 'table1', 'Table') });
  state().setEditorLoading(false, 'canvas');
  state().setCurrentMode('edit', 'canvas');

  const { result } = renderHook(() =>
    useTable({
      data: ROWS,
      columns: COLUMNS,
      enableSorting: true,
      enablePagination: true,
      showBulkSelector: true,
      serverSidePagination: false,
      serverSideSort: false,
      serverSideFilter: false,
      rowsPerPage: 10,
      globalFilter: '',
      setGlobalFilter: () => {},
      expandedRows: {},
    })
  );

  const setExposedVariables = (values) => state().setExposedValues('t1', 'components', values, 'canvas');
  const fireEvent = (eventName, options) => state().eventsSlice.fireEvent(eventName, 't1', 'canvas', {}, options);

  render(
    <TableExposedVariables
      id="t1"
      data={ROWS}
      setExposedVariables={setExposedVariables}
      fireEvent={fireEvent}
      table={result.current.table}
      componentName="table1"
      pageIndex={1}
      lastClickedRowRef={{ current: {} }}
      hasDataChanged={false}
      paginationBtnClicked={{ current: false }}
    />
  );
}

describe('Table "refreshTable" component action', () => {
  afterEach(drainExposedValueBatch);

  test('refreshTable is exposed as a callable component action', () => {
    mountExposedVariables();

    expect(typeof state().getExposedValueOfComponent('t1').refreshTable).toBe('function');
  });
});
