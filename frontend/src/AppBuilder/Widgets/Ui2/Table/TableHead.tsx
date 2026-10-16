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
      'tw-bg-[color:var(--lk-head-bg,var(--sc-background))]',
      properties.stickyHeader !== false && fixedHeight && 'tw-sticky tw-top-0 tw-z-10'
    )}
  >
    <tr className={cn('tw-border-b', ROW_BORDER)}>
      {bulk ? (
        <th className="tw-w-10 tw-px-3">
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
              'tw-h-10 tw-px-3 tw-py-2 tw-text-left tw-align-middle tw-text-xs tw-font-medium tw-leading-tight tw-text-[color:var(--lk-head-fg,var(--sc-muted-foreground))]',
              styles?.headerCasing === 'uppercase' && 'tw-uppercase tw-tracking-wide',
              column.align === 'right' && 'tw-text-right',
              column.align === 'center' && 'tw-text-center',
              bordered && cn('tw-border-r last:tw-border-r-0', ROW_BORDER)
            )}
            style={{ width: fitWidths ? column.width : undefined, minWidth: column.minWidth }}
          >
            {sortable ? (
              <button
                type="button"
                onClick={() => clickHeader(column)}
                className={cn(
                  'tw-inline-flex tw-items-center tw-gap-1 tw-rounded tw-text-left hover:tw-text-[color:var(--lk-fg,var(--sc-foreground))] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring',
                  column.align === 'right' && 'tw-flex-row-reverse'
                )}
              >
                <span>{column.name}</span>
                <SortIcon className={cn('tw-h-3 tw-w-3 tw-shrink-0', active ? 'tw-opacity-90' : 'tw-opacity-40')} />
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
