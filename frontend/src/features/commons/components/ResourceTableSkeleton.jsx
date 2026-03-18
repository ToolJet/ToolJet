import * as React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/Rocket/table';
import { Skeleton } from '@/components/ui/Rocket/skeleton';

export function ResourceTableSkeleton({ rowCount = 5, columnCount = 5 }) {
  const rows = React.useMemo(
    () =>
      Array.from({ length: rowCount }, (_, index) => ({
        id: `resource-table-skeleton-${index}`,
      })),
    [rowCount]
  );

  // Render skeleton cells based on columnCount
  const renderSkeletonCells = () => {
    const cells = [];
    for (let i = 0; i < columnCount; i++) {
      if (i === 0) {
        // First cell: checkbox
        cells.push(
          <TableCell key={`cell-${i}`} className="tw-w-10 tw-h-10 tw-pr-0">
            <div className="tw-flex tw-items-center tw-justify-center tw-h-10 tw-w-full">
              <Skeleton className="tw-size-4" />
            </div>
          </TableCell>
        );
      } else if (i === 1) {
        // Second cell: name/title (wider)
        cells.push(
          <TableCell key={`cell-${i}`}>
            <Skeleton className="tw-h-4 tw-w-64" />
          </TableCell>
        );
      } else if (i === columnCount - 1) {
        // Last cell: actions
        cells.push(
          <TableCell key={`cell-${i}`}>
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
              <Skeleton className="tw-h-6 tw-w-16" />
              <Skeleton className="tw-h-6 tw-w-16" />
              <Skeleton className="tw-h-6 tw-w-8" />
            </div>
          </TableCell>
        );
      } else {
        // Middle cells: generic content
        cells.push(
          <TableCell key={`cell-${i}`}>
            <div className="tw-text-right">
              <Skeleton className="tw-h-3 tw-w-20 tw-ml-auto" />
            </div>
          </TableCell>
        );
      }
    }
    return cells;
  };

  return (
    <TableBody className="**:data-[slot=table-cell]:first:tw-w-8">
      {rows.map((row) => (
        <TableRow key={row.id} className="tw-group tw-border-b-0">
          {renderSkeletonCells()}
        </TableRow>
      ))}
    </TableBody>
  );
}

export default ResourceTableSkeleton;
