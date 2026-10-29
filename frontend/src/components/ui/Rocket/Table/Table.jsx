import React, { createContext, forwardRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

import {
  Table as ShadcnTable,
  TableHeader as ShadcnTableHeader,
  TableBody as ShadcnTableBody,
  TableFooter as ShadcnTableFooter,
  TableRow as ShadcnTableRow,
  TableHead as ShadcnTableHead,
  TableCell as ShadcnTableCell,
  TableCaption as ShadcnTableCaption,
} from '@/components/ui/Rocket/shadcn/table';

// ── Density context ─────────────────────────────────────────────────────────

const TableDensityContext = createContext('default');

// ── Table (root) ────────────────────────────────────────────────────────────

const Table = forwardRef(function Table({ className, density = 'default', ...props }, ref) {
  return (
    <TableDensityContext.Provider value={density}>
      <ShadcnTable
        ref={ref}
        data-density={density}
        className={cn(
          'tw-w-full tw-caption-bottom',
          'tw-border-separate tw-border-spacing-0',
          'tw-font-body-default tw-text-text-default',
          className
        )}
        {...props}
      />
    </TableDensityContext.Provider>
  );
});
Table.displayName = 'Table';
Table.propTypes = {
  density: PropTypes.oneOf(['default', 'compact']),
  className: PropTypes.string,
};

// ── TableHeader ─────────────────────────────────────────────────────────────

const TableHeader = forwardRef(function TableHeader({ className, ...props }, ref) {
  return (
    <ShadcnTableHeader
      ref={ref}
      className={cn(
        '[&_th]:tw-border-solid [&_th]:tw-border-0 [&_th]:tw-border-b [&_th]:tw-border-border-weak',
        className
      )}
      {...props}
    />
  );
});
TableHeader.displayName = 'TableHeader';

// ── TableBody ───────────────────────────────────────────────────────────────

const TableBody = forwardRef(function TableBody({ className, ...props }, ref) {
  return <ShadcnTableBody ref={ref} className={cn(className)} {...props} />;
});
TableBody.displayName = 'TableBody';

// ── TableFooter ─────────────────────────────────────────────────────────────

const TableFooter = forwardRef(function TableFooter({ className, ...props }, ref) {
  return (
    <ShadcnTableFooter
      ref={ref}
      className={cn(
        'tw-border-solid tw-border-0 tw-border-t tw-border-border-weak',
        'tw-bg-background-surface-layer-02 tw-font-title-default',
        className
      )}
      {...props}
    />
  );
});
TableFooter.displayName = 'TableFooter';

// ── TableRow ────────────────────────────────────────────────────────────────

const TableRow = forwardRef(function TableRow({ className, ...props }, ref) {
  return (
    <ShadcnTableRow
      ref={ref}
      className={cn(
        'tw-transition-colors',
        'hover:tw-bg-interactive-hover',
        'data-[state=selected]:tw-bg-interactive-selected',
        className
      )}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';

// ── TableHead ───────────────────────────────────────────────────────────────

const tableHeadDensityClasses = {
  default: 'tw-h-10 tw-px-3.5 tw-py-0',
  compact: 'tw-h-8 tw-px-3 tw-py-0',
};

const TableHead = forwardRef(function TableHead({ className, ...props }, ref) {
  const density = useContext(TableDensityContext);

  return (
    <ShadcnTableHead
      ref={ref}
      className={cn(
        tableHeadDensityClasses[density],
        'tw-text-left tw-align-middle',
        'tw-font-title-default tw-text-text-default',
        className
      )}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

// ── TableCell ───────────────────────────────────────────────────────────────

const tableCellDensityClasses = {
  default: 'tw-h-[52px] tw-p-3.5',
  compact: 'tw-h-9 tw-px-3 tw-py-2',
};

const TableCell = forwardRef(function TableCell({ className, ...props }, ref) {
  const density = useContext(TableDensityContext);

  return (
    <ShadcnTableCell
      ref={ref}
      className={cn(
        tableCellDensityClasses[density],
        'tw-align-middle tw-text-text-default',
        // Rounded pill effect: first/last cell corners get rounded so the
        // hover/selected row bg shows as a pill highlight.
        'first:tw-rounded-l-[10px] last:tw-rounded-r-[10px]',
        className
      )}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';

// ── TableCaption ────────────────────────────────────────────────────────────

const TableCaption = forwardRef(function TableCaption({ className, ...props }, ref) {
  return (
    <ShadcnTableCaption
      ref={ref}
      className={cn('tw-mt-4 tw-font-body-small tw-text-text-placeholder', className)}
      {...props}
    />
  );
});
TableCaption.displayName = 'TableCaption';

// ── Exports ─────────────────────────────────────────────────────────────────

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption };
