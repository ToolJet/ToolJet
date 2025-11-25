import * as React from 'react';
import { flexRender } from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Rocket/table';
import { AppsTableSkeleton } from './AppsTableSkeleton';

export function AppsTable({ table, isLoading }) {
  return (
    <div className="tw-overflow-hidden">
      <Table>
        <TableHeader className="tw-sticky tw-top-0 tw-z-10 [&_tr]:hover:tw-bg-transparent">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        {isLoading ? (
          <AppsTableSkeleton rowCount={4} />
        ) : (
          <TableBody className="**:data-[slot=table-cell]:first:tw-w-8">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="tw-group tw-border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="first:tw-rounded-tl-[10px] first:tw-rounded-bl-[10px] last:tw-rounded-tr-[10px] last:tw-rounded-br-[10px]"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="tw-h-24 tw-text-center">No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
