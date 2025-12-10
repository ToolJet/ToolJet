import * as React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/Rocket/table';
import { Skeleton } from '@/components/ui/Rocket/skeleton';

/**
 * Generic table skeleton component
 * @param {number} rowCount - Number of skeleton rows to display
 * @param {number} columnCount - Number of columns (default: 4)
 */
export function TableSkeleton({ rowCount = 5, columnCount = 4 }) {
  const rows = React.useMemo(
    () =>
      Array.from({ length: rowCount }, (_, index) => ({
        id: `table-skeleton-${index}`,
      })),
    [rowCount]
  );

  return (
    <TableBody className="**:data-[slot=table-cell]:first:tw-w-8">
      {rows.map((row) => (
        <TableRow key={row.id} className="tw-group tw-border-b-0">
          {Array.from({ length: columnCount }, (_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="tw-h-4 tw-w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

