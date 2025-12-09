import * as React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/Rocket/table';
import { Skeleton } from '@/components/ui/Rocket/skeleton';

export function AppsTableSkeleton({ rowCount = 5 }) {
  const rows = React.useMemo(
    () =>
      Array.from({ length: rowCount }, (_, index) => ({
        id: `apps-table-skeleton-${index}`,
      })),
    [rowCount]
  );

  return (
    <TableBody className="**:data-[slot=table-cell]:first:tw-w-8">
      {rows.map((row) => (
        <TableRow key={row.id} className="tw-group tw-border-b-0">
          <TableCell className="tw-w-10 tw-h-10 tw-pr-0">
            <div className="tw-flex tw-items-center tw-justify-center tw-h-10 tw-w-full">
              <Skeleton className="tw-size-4" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="tw-h-4 tw-w-64" />
          </TableCell>
          <TableCell>
            <div className="tw-text-right">
              <Skeleton className="tw-h-3 tw-w-24 tw-ml-auto" />
            </div>
          </TableCell>
          <TableCell>
            <div className="tw-text-right">
              <Skeleton className="tw-h-3 tw-w-20 tw-ml-auto" />
            </div>
          </TableCell>
          <TableCell>
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
              <Skeleton className="tw-h-6 tw-w-16" />
              <Skeleton className="tw-h-6 tw-w-16" />
              <Skeleton className="tw-h-6 tw-w-8" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
