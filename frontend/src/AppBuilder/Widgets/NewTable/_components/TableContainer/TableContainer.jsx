import React, { useState, useMemo } from 'react';
import useTableStore from '../../_stores/tableStore';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';
import TableHeader from '../TableHeader';
import generateColumnsData from '../../_utils/generateColumnsData';

import { getCoreRowModel, useReactTable, flexRender, getSortedRowModel } from '@tanstack/react-table';

export const TableContainer = React.memo(({ id, data }) => {
  const { getLoadingState, getColumnProperties } = useTableStore();
  const loadingState = getLoadingState(id);
  const page = data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columnProperties = getColumnProperties(id) ?? [];

  //   const [sorting, setSorting] = useState([]);

  //   const columns = useMemo(
  //     () =>
  //       columnProperties.map((column) => {
  //         return {
  //           id: column.id,
  //           header: column.name,
  //           accessorKey: column.key || column.name,
  //           cell: (info) => info.getValue(),
  //           enableResizing: true,
  //           enableSorting: true,
  //         };
  //       }),
  //     [columnProperties]
  //   );

  const columns = useMemo(
    () =>
      generateColumnsData({
        columnProperties,
        columnSizes: {}, // Add your column sizes
        defaultColumn: { width: 150 }, // Adjust default width as needed
        changeSet: {},
        tableData: data,
        id,
      }),
    [columnProperties, data, id] // Add other dependencies as needed
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    // sorting,
    // onSortingChange: setSorting,
    // state: {
    //   sorting,
    // },
  });

  console.log('columnProperties--- ', columnProperties, columns);
  console.log('table.getState().sorting--- here---', table.getState().sorting);

  if (loadingState) {
    return (
      <div className={'table-responsive jet-data-table overflow-hidden'}>
        <LoadingState />
      </div>
    );
  } else if (page.length === 0) {
    return (
      <div className={'table-responsive jet-data-table overflow-hidden position-relative'}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={`table-responsive jet-data-table`}>
      <table>
        <TableHeader id={id} table={table} />

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
