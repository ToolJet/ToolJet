import React from 'react';
import { generateActionColumns } from './generateActionColumns';
import generateColumnsData from './generateColumnsData';
import IndeterminateCheckbox from '../_components/IndeterminateCheckbox';
import { ChevronDown } from 'lucide-react';

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
  tableBodyRef,
  t,
  enableExpandableRows,
  toggleRowExpansion,
  moduleId = 'canvas'
) => {
  const expansionColumn = enableExpandableRows
    ? {
        id: 'expansion',
        enableSorting: false,
        enableResizing: false,
        meta: { columnType: 'expansion', skipExport: true, skipFilter: true, skipAddNewRow: true },
        size: 40,
        header: () => null,
        cell: ({ row, table }) => {
          const isExpanded = row.id in (table.options.meta?.expandedRows ?? {});

          return (
            <button
              className="table-expansion-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion?.(id, row.id, row.index);
              }}
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
              title={isExpanded ? 'Collapse row' : 'Expand row'}
            >
              <ChevronDown
                width={16}
                height={16}
                color="var(--cc-default-icon)"
                style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          );
        },
      }
    : null;

  return [
    expansionColumn,
    {
      id: 'selection',
      accessorKey: 'selection',
      enableSorting: false,
      enableResizing: false,
      meta: {
        columnType: 'selector',
        skipExport: true,
        skipFilter: true,
        skipAddNewRow: true,
        pinPosition: 'unpinned',
      },
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
      setExposedVariables,
      tableRef: tableBodyRef,
      handleCellValueChange,
      searchText: globalFilter,
      t,
      moduleId,
    }).filter(Boolean),

    ...generateActionColumns({
      actions: actions.filter((action) => action.position === 'right'),
      fireEvent,
      setExposedVariables,
      id,
    }),
  ].filter(Boolean);
};
