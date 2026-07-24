import * as React from 'react';
import PropTypes from 'prop-types';
import { flexRender } from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Rocket/Table/Table';
import { TableSkeleton } from '@/components/ui/blocks/TableSkeleton';

/**
 * DataTable — TanStack-driven table block.
 *
 * Pass a TanStack `table` instance (from `useReactTable`). This block renders
 * the header, body (or skeleton during loading), and a "no results" empty state.
 *
 * Higher-level features (sorting indicators, pagination controls, toolbar) are
 * the responsibility of the consuming feature, not this block.
 */
function DataTableInternal({ table, isLoading = false, skeleton, density = 'default', emptyMessage = 'No results.' }) {
  const columnCount = table?.getAllColumns()?.length || 4;

  return (
    <div className="tw-w-full">
      <Table density={density}>
        <TableHeader className="tw-sticky tw-top-0 tw-z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={header.getSize() ? { width: `${header.getSize()}px` } : undefined}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {isLoading ? (
          skeleton || <TableSkeleton rowCount={5} columnCount={columnCount} />
        ) : (
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="tw-h-24 tw-text-center tw-text-text-placeholder tw-font-body-default"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
DataTableInternal.displayName = 'DataTable';
DataTableInternal.propTypes = {
  // TanStack `table` instance — required, but PropTypes can't validate object shape easily
  // eslint-disable-next-line react/forbid-prop-types
  table: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  skeleton: PropTypes.node,
  density: PropTypes.oneOf(['default', 'compact']),
  emptyMessage: PropTypes.string,
};

export const DataTable = React.memo(DataTableInternal);
