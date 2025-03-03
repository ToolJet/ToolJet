import React from 'react';
import { generateActionColumns } from './generateActionColumns';
import generateColumnsData from './generateColumnsData';
import IndeterminateCheckbox from '../_components/IndeterminateCheckbox';

export const buildTableColumn = (
  showBulkSelector,
  actions,
  fireEvent,
  setExposedVariables,
  id,
  columnProperties,
  columnSizes,
  data,
  darkMode,
  handleCellValueChange,
  globalFilter,
  serverSideSearch,
  tableBodyRef
) => {
  return [
    {
      id: 'selection',
      accessorKey: 'selection',
      enableSorting: false,
      enableResizing: false,
      meta: { columnType: 'selector', skipExport: true, skipFilter: true, skipAddNewRow: true },
      size: 40,
      header: ({ table }) =>
        showBulkSelector ? (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllPageRowsSelected(),
              indeterminate: table.getIsSomePageRowsSelected(),
              onChange: table.getToggleAllPageRowsSelectedHandler(),
            }}
          />
        ) : null,
      cell: ({ row }) => (
        <IndeterminateCheckbox
          {...{
            checked: row.getIsSelected(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
          isCell={true}
        />
      ),
    },
    ...generateActionColumns({
      actions: actions.filter((action) => action.position === 'left'),
      fireEvent,
      setExposedVariables,
      id,
    }),
    ...generateColumnsData({
      columnProperties,
      columnSizes,
      defaultColumn: { width: 150 },
      tableData: data,
      id,
      darkMode,
      fireEvent,
      tableRef: tableBodyRef,
      handleCellValueChange,
      searchText: serverSideSearch ? '' : globalFilter,
    }).filter(Boolean),

    ...generateActionColumns({
      actions: actions.filter((action) => action.position === 'right'),
      fireEvent,
      setExposedVariables,
      id,
    }),
  ].filter(Boolean);
};
