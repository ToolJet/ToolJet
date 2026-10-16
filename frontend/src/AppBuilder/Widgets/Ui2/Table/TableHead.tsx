import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Checkbox, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ROW_BORDER } from './TableCells';
import type { Sort, TableColumn } from './types';

interface TableHeadProps {
  properties: Resolved;
  styles: Resolved;
  fixedHeight: boolean;
  bulk: boolean;
  allOnPage: boolean;
  someOnPage: boolean;
  isDisabled: boolean;
  pageKeys: string[];
  togglePage: () => void;
  shownColumns: TableColumn[];
  sort: Sort | null;
  pressHeader: (column: TableColumn) => void;
  clickHeader: (column: TableColumn) => void;
  bordered: boolean;
  fitWidths: boolean;
}

export const TableHead = ({
  properties,
  styles,
  fixedHeight,
  bulk,
  allOnPage,
  someOnPage,
  isDisabled,
  pageKeys,
  togglePage,
  shownColumns,
  sort,
  pressHeader,
  clickHeader,
  bordered,
  fitWidths,
}: TableHeadProps) => (
  <thead
    className={cn(
      'bg-[color:var(--lk-head-bg,var(--sc-background))]',
      properties.stickyHeader !== false && fixedHeight && 'sticky top-0 z-10'
    )}
  >
    <tr className={cn('border-b', ROW_BORDER)}>
      {bulk ? (
        <th className="w-10 px-3">
          <Checkbox
            aria-label="Select all on this page"
            checked={allOnPage ? true : someOnPage ? 'indeterminate' : false}
            disabled={isDisabled || !pageKeys.length}
            onCheckedChange={togglePage}
          />
        </th>
      ) : null}
      {shownColumns.map((column) => {
        const active = sort?.key === column.key ? sort.direction : null;
        const sortable = properties.enabledSort !== false && column.sortable;
        const SortIcon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ArrowUpDown;
        return (
          <th
            key={column.id}
            scope="col"
            onClick={() => pressHeader(column)}
            aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : undefined}
            className={cn(
              // Header labels wrap between words when the table is narrower than its headers (a narrow card
              // otherwise cut its last column); with room to spare they stay on one line.
              'h-10 px-3 py-2 text-left align-middle text-xs font-medium leading-tight text-[color:var(--lk-head-fg,var(--sc-muted-foreground))]',
              styles?.headerCasing === 'uppercase' && 'uppercase tracking-wide',
              column.align === 'right' && 'text-right',
              column.align === 'center' && 'text-center',
              bordered && cn('border-r last:border-r-0', ROW_BORDER)
            )}
            style={{ width: fitWidths ? column.width : undefined, minWidth: column.minWidth }}
          >
            {sortable ? (
              <button
                type="button"
                onClick={() => clickHeader(column)}
                className={cn(
                  'inline-flex items-center gap-1 rounded text-left hover:text-[color:var(--lk-fg,var(--sc-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  column.align === 'right' && 'flex-row-reverse'
                )}
              >
                <span>{column.name}</span>
                <SortIcon className={cn('h-3 w-3 shrink-0', active ? 'opacity-90' : 'opacity-40')} />
              </button>
            ) : (
              column.name
            )}
          </th>
        );
      })}
    </tr>
  </thead>
);
