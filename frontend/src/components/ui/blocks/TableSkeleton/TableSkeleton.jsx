import * as React from 'react';
import PropTypes from 'prop-types';
import { TableBody, TableCell, TableRow } from '@/components/ui/Rocket/Table/Table';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';

/**
 * Generic table skeleton — renders pulsing placeholder rows.
 * Designed to be used inside a `<Table>` while data is loading,
 * replacing the real `<TableBody>`.
 */
function TableSkeleton({ rowCount = 5, columnCount = 4 }) {
  const rows = React.useMemo(
    () => Array.from({ length: rowCount }, (_, i) => ({ id: `table-skeleton-${i}` })),
    [rowCount]
  );

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id}>
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
TableSkeleton.displayName = 'TableSkeleton';
TableSkeleton.propTypes = {
  rowCount: PropTypes.number,
  columnCount: PropTypes.number,
};

export { TableSkeleton };
